import express from 'express';
import pino from 'pino';
import LinkedInAccount from '../models/LinkedInAccount';
import LinkedInPost from '../models/LinkedInPost';
import LinkedInComment from '../models/LinkedInComment';
import { requireAuth } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/requireRole';
import { hasLinkedInConfig, getLinkedInRedirectUri } from '../config/env';
import {
  buildLinkedInOAuthUrl,
  signOAuthState,
  verifyOAuthState,
  exchangeCodeForToken,
  getUserInfo,
  createComment,
  refreshAccessToken,
} from '../services/linkedinApi';
import { publishPostNow, runCommentSweepOnce, runDailyPublishOnce } from '../services/linkedinScheduler';
import { generatePost, draftReply, getContentPillars } from '../services/contentEngine';
import { trackEvent } from '../analytics/events';

const log = pino({ name: 'linkedin' });
const router = express.Router();

// --- OAuth ---

router.get('/auth-url', requireAuth, async (req, res) => {
  try {
    if (!hasLinkedInConfig()) {
      res.status(503).json({ error: 'LinkedIn not configured on the server' });
      return;
    }
    const state = signOAuthState(req.user!.id);
    res.json({ url: buildLinkedInOAuthUrl(state) });
  } catch (err) {
    log.error({ err }, 'Failed to build OAuth URL');
    res.status(500).json({ error: 'Failed to build OAuth URL' });
  }
});

router.get('/oauth/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query as { code?: string; state?: string; error?: string };
    if (error) throw new Error(`LinkedIn OAuth error: ${error}`);
    if (!code || !state) throw new Error('Missing code or state');
    const userId = verifyOAuthState(state);
    const tokens = await exchangeCodeForToken(code);
    const info = await getUserInfo(tokens.accessToken);

    const existing = await LinkedInAccount.findOne({ user_id: userId });
    if (existing) {
      existing.linkedin_user_id = info.sub;
      existing.linkedin_user_name = info.name || existing.linkedin_user_name;
      existing.access_token = tokens.accessToken;
      if (tokens.refreshToken) existing.refresh_token = tokens.refreshToken;
      existing.expires_at = tokens.expiresAt;
      existing.scope = tokens.scope;
      existing.connected_at = new Date();
      existing.last_error = null as unknown as string;
      existing.updated_at = new Date();
      await existing.save();
    } else {
      await LinkedInAccount.create({
        user_id: userId,
        linkedin_user_id: info.sub,
        linkedin_user_name: info.name,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: tokens.expiresAt,
        scope: tokens.scope,
      });
    }
    trackEvent({ userId, event: 'linkedin.connect' });
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/linkedin?connected=1`);
  } catch (err) {
    log.error({ err }, 'LinkedIn OAuth callback failed');
    const base = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(
      `${base}/linkedin?connected=0&error=${encodeURIComponent(
        err instanceof Error ? err.message : 'OAuth failed'
      )}`
    );
  }
});

// --- Status & settings ---

router.get('/status', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const account = await LinkedInAccount.findOne({ user_id: userId }).select(
      '+access_token +refresh_token'
    );
    const [totalPosts, published, pendingComments] = await Promise.all([
      LinkedInPost.countDocuments({ user_id: userId }),
      LinkedInPost.countDocuments({ user_id: userId, status: 'published' }),
      LinkedInComment.countDocuments({ user_id: userId, reply_status: 'pending' }),
    ]);
    res.json({
      configured: hasLinkedInConfig(),
      redirect_uri: getLinkedInRedirectUri(),
      connected: Boolean(account),
      name: account?.linkedin_user_name || null,
      expires_at: account?.expires_at || null,
      auto_post: account?.auto_post ?? true,
      auto_reply: account?.auto_reply ?? false,
      post_time: account?.post_time || '0 9 * * *',
      tone: account?.tone || 'balanced',
      last_publish_at: account?.last_publish_at || null,
      last_error: account?.last_error || null,
      stats: { total_posts: totalPosts, published, pending_comments: pendingComments },
    });
  } catch (err) {
    log.error({ err }, 'Failed to load LinkedIn status');
    res.status(500).json({ error: 'Failed to load LinkedIn status' });
  }
});

router.patch('/settings', requireAuth, express.json(), async (req, res) => {
  try {
    const userId = req.user!.id;
    const account = await LinkedInAccount.findOne({ user_id: userId });
    if (!account) {
      res.status(404).json({ error: 'LinkedIn not connected' });
      return;
    }
    const { auto_post, auto_reply, post_time, tone } = req.body as Record<string, unknown>;
    if (typeof auto_post === 'boolean') account.auto_post = auto_post;
    if (typeof auto_reply === 'boolean') account.auto_reply = auto_reply;
    if (typeof post_time === 'string' && /^[\d*/ -]+$/.test(post_time)) account.post_time = post_time;
    if (typeof tone === 'string' && ['balanced', 'diagnostic', 'story', 'anti-hype'].includes(tone)) {
      account.tone = tone as 'balanced' | 'diagnostic' | 'story' | 'anti-hype';
    }
    account.updated_at = new Date();
    await account.save();
    res.json(account);
  } catch (err) {
    log.error({ err }, 'Failed to update LinkedIn settings');
    res.status(500).json({ error: 'Failed to update LinkedIn settings' });
  }
});

router.post('/disconnect', requireAuth, async (req, res) => {
  try {
    await LinkedInAccount.deleteOne({ user_id: req.user!.id });
    trackEvent({ userId: req.user!.id, event: 'linkedin.disconnect' });
    res.json({ ok: true });
  } catch (err) {
    log.error({ err }, 'Failed to disconnect LinkedIn');
    res.status(500).json({ error: 'Failed to disconnect LinkedIn' });
  }
});

// --- Posts ---

router.get('/posts', requireAuth, async (req, res) => {
  try {
    const posts = await LinkedInPost.find({ user_id: req.user!.id })
      .sort({ created_at: -1 })
      .limit(100)
      .lean();
    res.json(posts);
  } catch (err) {
    log.error({ err }, 'Failed to load LinkedIn posts');
    res.status(500).json({ error: 'Failed to load LinkedIn posts' });
  }
});

router.post('/posts', requireAuth, express.json(), async (req, res) => {
  try {
    const { text, generate, count } = req.body as {
      text?: string;
      generate?: boolean;
      count?: number;
    };
    if (generate) {
      const drafts = [];
      const n = Math.min(Math.max(count || 1, 1), 5);
      for (let i = 0; i < n; i += 1) {
        const draft = await generatePost({});
        drafts.push(draft);
      }
      res.status(201).json({ drafts });
      return;
    }
    if (!text?.trim()) {
      res.status(400).json({ error: 'text is required when not generating' });
      return;
    }
    const post = await LinkedInPost.create({
      user_id: req.user!.id,
      text: text.trim().slice(0, 3000),
      source: 'manual',
      status: 'draft',
    });
    res.status(201).json(post);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create post';
    if (msg.includes('OPENAI_API_KEY')) {
      res.status(503).json({ error: 'AI service not configured' });
      return;
    }
    if (msg.startsWith('Content generation failed')) {
      res.status(502).json({ error: msg });
      return;
    }
    log.error({ err }, 'Failed to create LinkedIn post');
    res.status(500).json({ error: 'Failed to create LinkedIn post' });
  }
});

router.patch('/posts/:id', requireAuth, express.json(), async (req, res) => {
  try {
    const post = await LinkedInPost.findOne({ _id: req.params.id, user_id: req.user!.id });
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    const { text, scheduled_at, status } = req.body as Record<string, unknown>;
    if (typeof text === 'string' && text.trim()) post.text = text.trim().slice(0, 3000);
    if (scheduled_at) {
      const d = new Date(scheduled_at as string);
      if (!Number.isNaN(d.getTime())) {
        post.scheduled_at = d;
        post.status = 'scheduled';
      }
    }
    if (status === 'draft' || status === 'canceled' || status === 'scheduled') {
      post.status = status;
    }
    post.updated_at = new Date();
    await post.save();
    res.json(post);
  } catch (err) {
    log.error({ err }, 'Failed to update LinkedIn post');
    res.status(500).json({ error: 'Failed to update LinkedIn post' });
  }
});

router.delete('/posts/:id', requireAuth, async (req, res) => {
  try {
    await LinkedInPost.deleteOne({ _id: req.params.id, user_id: req.user!.id });
    res.json({ ok: true });
  } catch (err) {
    log.error({ err }, 'Failed to delete LinkedIn post');
    res.status(500).json({ error: 'Failed to delete LinkedIn post' });
  }
});

router.post('/posts/:id/publish', requireAuth, express.json(), async (req, res) => {
  try {
    const post = await LinkedInPost.findOne({ _id: req.params.id, user_id: req.user!.id });
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    const { postUrn, postUrl } = await publishPostNow({
      userId: req.user!.id,
      post: { text: post.text },
    });
    post.status = 'published';
    post.published_at = new Date();
    post.post_urn = postUrn;
    post.post_url = postUrl;
    post.error = null as unknown as string;
    post.updated_at = new Date();
    await post.save();
    res.json(post);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to publish';
    const status = msg.includes('not connected') ? 400 : msg.includes('LinkedIn API') ? 502 : 500;
    log.error({ err }, 'Failed to publish LinkedIn post');
    res.status(status).json({ error: msg });
  }
});

// --- Comments ---

router.get('/comments', requireAuth, async (req, res) => {
  try {
    const comments = await LinkedInComment.find({ user_id: req.user!.id })
      .sort({ received_at: -1 })
      .limit(100)
      .lean();
    res.json(comments);
  } catch (err) {
    log.error({ err }, 'Failed to load LinkedIn comments');
    res.status(500).json({ error: 'Failed to load LinkedIn comments' });
  }
});

router.post('/comments/:id/generate-reply', requireAuth, async (req, res) => {
  try {
    const comment = await LinkedInComment.findOne({ _id: req.params.id, user_id: req.user!.id });
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }
    const reply = await draftReply({ comment: comment.text, authorName: comment.author_name });
    comment.reply_text = reply.text;
    comment.reply_status = 'approved';
    comment.updated_at = new Date();
    await comment.save();
    res.json(comment);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate reply';
    if (msg.includes('OPENAI_API_KEY')) {
      res.status(503).json({ error: 'AI service not configured' });
      return;
    }
    log.error({ err }, 'Failed to generate reply');
    res.status(500).json({ error: 'Failed to generate reply' });
  }
});

router.post('/comments/:id/reply', requireAuth, express.json(), async (req, res) => {
  try {
    const comment = await LinkedInComment.findOne({ _id: req.params.id, user_id: req.user!.id });
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }
    const { text } = req.body as { text?: string };
    const replyText = (text || comment.reply_text || '').trim();
    if (!replyText) {
      res.status(400).json({ error: 'reply text is required' });
      return;
    }
    const account = await LinkedInAccount.findOne({ user_id: req.user!.id }).select(
      '+access_token +refresh_token'
    );
    if (!account) {
      res.status(400).json({ error: 'LinkedIn not connected' });
      return;
    }
    const { createComment, refreshAccessToken } = await import('../services/linkedinApi');
    let accessToken = account.access_token;
    if (!accessToken) {
      res.status(400).json({ error: 'LinkedIn token missing' });
      return;
    }
    if (account.expires_at && account.expires_at.getTime() <= Date.now() + 60_000) {
      if (!account.refresh_token) {
        res.status(400).json({ error: 'LinkedIn token expired' });
        return;
      }
      const refreshed = await refreshAccessToken(account.refresh_token);
      accessToken = refreshed.accessToken;
      account.access_token = refreshed.accessToken;
      account.expires_at = refreshed.expiresAt;
      await account.save();
    }
    await createComment(accessToken, comment.comment_urn, replyText);
    comment.reply_text = replyText;
    comment.reply_status = 'sent';
    comment.replied_at = new Date();
    comment.reply_error = null as unknown as string;
    comment.updated_at = new Date();
    await comment.save();
    trackEvent({ userId: req.user!.id, event: 'linkedin.reply_sent' });
    res.json(comment);
  } catch (err) {
    log.error({ err }, 'Failed to send LinkedIn reply');
    res.status(500).json({ error: 'Failed to send reply' });
  }
});

router.post('/comments/:id/dismiss', requireAuth, async (req, res) => {
  try {
    const comment = await LinkedInComment.findOne({ _id: req.params.id, user_id: req.user!.id });
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }
    comment.reply_status = 'dismissed';
    comment.updated_at = new Date();
    await comment.save();
    res.json(comment);
  } catch (err) {
    log.error({ err }, 'Failed to dismiss comment');
    res.status(500).json({ error: 'Failed to dismiss comment' });
  }
});

// --- Content intelligence ---

router.get('/pillars', requireAuth, async (req, res) => {
  try {
    res.json({ pillars: getContentPillars() });
  } catch (err) {
    log.error({ err }, 'Failed to load content pillars');
    res.status(500).json({ error: 'Failed to load content pillars' });
  }
});

// --- Manual scheduler triggers (admin only) ---

router.post('/run/daily', requireAuth, requireRole('admin'), async (_req, res) => {
  try {
    await runDailyPublishOnce();
    res.json({ ok: true });
  } catch (err) {
    log.error({ err }, 'Manual daily run failed');
    res.status(500).json({ error: 'Manual daily run failed' });
  }
});

router.post('/run/sweep', requireAuth, requireRole('admin'), async (_req, res) => {
  try {
    await runCommentSweepOnce();
    res.json({ ok: true });
  } catch (err) {
    log.error({ err }, 'Manual comment sweep failed');
    res.status(500).json({ error: 'Manual comment sweep failed' });
  }
});

export default router;
