import cron from 'node-cron';
import pino from 'pino';
import LinkedInAccount from '../models/LinkedInAccount';
import LinkedInPost from '../models/LinkedInPost';
import LinkedInComment from '../models/LinkedInComment';
import { generatePost, draftReply } from './contentEngine';
import {
  createLinkedInPost,
  getPostComments,
  createComment,
  refreshAccessToken,
  buildPersonUrn,
} from './linkedinApi';
import { trackEvent } from '../analytics/events';

const log = pino({ name: 'linkedin-scheduler' });

const running = { daily: false, comments: false };

async function refreshAccountIfNeeded(account: {
  _id?: unknown;
  access_token?: string;
  refresh_token?: string;
  expires_at?: Date;
}): Promise<{ accessToken: string; refreshToken?: string; expiresAt: Date } | null> {
  if (!account.access_token) return null;
  const hasExpired = !account.expires_at || account.expires_at.getTime() <= Date.now() + 60_000;
  if (!hasExpired) {
    return {
      accessToken: account.access_token,
      refreshToken: account.refresh_token,
      expiresAt: account.expires_at as Date,
    };
  }
  if (!account.refresh_token) return null;
  const refreshed = await refreshAccessToken(account.refresh_token);
  return {
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken,
    expiresAt: refreshed.expiresAt,
  };
}

export async function publishPostNow(input: {
  userId: string;
  post: {
    _id?: unknown;
    text: string;
  };
}): Promise<{ postUrn: string; postUrl: string }> {
  const account = await LinkedInAccount.findOne({ user_id: input.userId }).select(
    '+access_token +refresh_token'
  );
  if (!account) throw new Error('LinkedIn not connected');
  const tokens = await refreshAccountIfNeeded(account);
  if (!tokens) throw new Error('LinkedIn token is expired and cannot be refreshed');

  await LinkedInAccount.updateOne(
    { _id: account._id },
    {
      $set: {
        access_token: tokens.accessToken,
        ...(tokens.refreshToken ? { refresh_token: tokens.refreshToken } : {}),
        expires_at: tokens.expiresAt,
        updated_at: new Date(),
      },
    }
  ).exec();

  const { postUrn, postUrl } = await createLinkedInPost(
    tokens.accessToken,
    buildPersonUrn(account.linkedin_user_id),
    input.post.text
  );
  trackEvent({ userId: input.userId, event: 'linkedin.post_published', props: { urn: postUrn } });
  return { postUrn, postUrl };
}

async function runDailyPublish(): Promise<void> {
  if (running.daily) return;
  running.daily = true;
  try {
    const accounts = await LinkedInAccount.find({ auto_post: true }).select('+access_token +refresh_token');
    if (accounts.length === 0) return;

    for (const account of accounts) {
      try {
        const alreadyPublished = await LinkedInPost.exists({
          user_id: account.user_id,
          status: 'published',
          published_at: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        });
        if (alreadyPublished) continue;

        const recent = await LinkedInPost.find({ user_id: account.user_id, source: 'ai' })
          .sort({ created_at: -1 })
          .limit(7)
          .lean();
        const draft = await generatePost({ tone: account.tone, recent: recent.map((p) => p.text) });

        const post = await LinkedInPost.create({
          user_id: account.user_id,
          text: draft.text,
          source: 'ai',
          status: 'scheduled',
          community: draft.community,
          concepts: draft.concepts,
        });

        try {
          const { postUrn, postUrl } = await publishPostNow({ userId: account.user_id.toString(), post });
          await LinkedInPost.updateOne(
            { _id: post._id },
            {
              $set: {
                status: 'published',
                published_at: new Date(),
                post_urn: postUrn,
                post_url: postUrl,
                updated_at: new Date(),
              },
            }
          ).exec();
          await LinkedInAccount.updateOne(
            { _id: account._id },
            { $set: { last_publish_at: new Date(), last_error: null, updated_at: new Date() } }
          ).exec();
        } catch (err) {
          await LinkedInPost.updateOne(
            { _id: post._id },
            {
              $set: {
                status: 'failed',
                error: err instanceof Error ? err.message.slice(0, 500) : 'publish failed',
                updated_at: new Date(),
              },
            }
          ).exec();
          await LinkedInAccount.updateOne(
            { _id: account._id },
            {
              $set: {
                last_error: err instanceof Error ? err.message.slice(0, 500) : 'publish failed',
                updated_at: new Date(),
              },
            }
          ).exec();
          log.error({ userId: account.user_id, err }, 'Daily LinkedIn publish failed');
        }
      } catch (err) {
        log.error({ userId: account.user_id, err }, 'Daily LinkedIn generation failed');
      }
    }
  } finally {
    running.daily = false;
  }
}

async function runCommentSweep(): Promise<void> {
  if (running.comments) return;
  running.comments = true;
  try {
    const accounts = await LinkedInAccount.find({}).select('+access_token +refresh_token');
    if (accounts.length === 0) return;

    for (const account of accounts) {
      try {
        const tokens = await refreshAccountIfNeeded(account);
        if (!tokens) continue;

        const publishedPosts = await LinkedInPost.find({
          user_id: account.user_id,
          status: 'published',
          post_urn: { $exists: true },
        })
          .sort({ published_at: -1 })
          .limit(20)
          .lean();

        for (const post of publishedPosts) {
          const comments = await getPostComments(tokens.accessToken, post.post_urn as string);
          for (const c of comments) {
            if (!c.comment_urn || !c.text) continue;
            const exists = await LinkedInComment.exists({ comment_urn: c.comment_urn });
            if (exists) continue;

            const doc = await LinkedInComment.create({
              user_id: account.user_id,
              post_id: post._id,
              post_urn: post.post_urn,
              comment_urn: c.comment_urn,
              author_name: c.author_name,
              text: c.text.slice(0, 2000),
              received_at: c.created_at || new Date(),
            });

            if (account.auto_reply) {
              try {
                const reply = await draftReply({ comment: c.text, authorName: c.author_name });
                const replyUrn = await createComment(
                  tokens.accessToken,
                  c.comment_urn,
                  reply.text
                );
                await LinkedInComment.updateOne(
                  { _id: doc._id },
                  {
                    $set: {
                      reply_text: reply.text,
                      reply_status: 'sent',
                      replied_at: new Date(),
                      reply_error: replyUrn ? undefined : 'empty urn',
                      updated_at: new Date(),
                    },
                  }
                ).exec();
                trackEvent({ userId: account.user_id.toString(), event: 'linkedin.reply_sent' });
              } catch (err) {
                await LinkedInComment.updateOne(
                  { _id: doc._id },
                  {
                    $set: {
                      reply_status: 'pending',
                      reply_error: err instanceof Error ? err.message.slice(0, 300) : 'reply failed',
                      updated_at: new Date(),
                    },
                  }
                ).exec();
              }
            }
          }
        }
      } catch (err) {
        log.error({ userId: account.user_id, err }, 'LinkedIn comment sweep failed');
      }
    }
  } finally {
    running.comments = false;
  }
}

export function startLinkedInScheduler(): void {
  const scheduleDaily = () => {
    const accounts = LinkedInAccount.find({ auto_post: true }).countDocuments().exec();
    accounts.catch(() => {});
    void accounts.then((count) => log.info({ accounts: count }, 'LinkedIn daily scheduler tick'));
    void runDailyPublish();
  };

  const scheduleComments = () => {
    void runCommentSweep();
  };

  cron.schedule(process.env.LINKEDIN_POST_TIME || '0 9 * * *', scheduleDaily);
  const interval = parseInt(process.env.LINKEDIN_COMMENT_SWEEP_MINUTES || '30', 10);
  cron.schedule(`*/${Math.max(1, interval)} * * * *`, scheduleComments);
  log.info(
    { postCron: process.env.LINKEDIN_POST_TIME || '0 9 * * *', sweepMinutes: interval },
    'LinkedIn scheduler started'
  );
}

export async function runDailyPublishOnce(): Promise<void> {
  await runDailyPublish();
}

export async function runCommentSweepOnce(): Promise<void> {
  await runCommentSweep();
}
