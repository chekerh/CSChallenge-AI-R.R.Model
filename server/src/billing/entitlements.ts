import Plan from '../models/Plan';
import Subscription from '../models/Subscription';
import UsageCounter from '../models/UsageCounter';
import User from '../models/User';

export type UserPlan = 'free' | 'pro';
export type FeatureKey = 'cv.job_match' | 'cv.rewrite_section' | 'cv.diagnosis.full' | 'resume.ai_process';
export type QuotaKey =
  | 'cv_diagnosis_runs_per_month'
  | 'cv_job_matches_per_month'
  | 'cv_rewrite_sections_per_month'
  | 'resume_ai_process_runs_per_month';

type Limits = Record<QuotaKey, number>;

const DEFAULT_LIMITS: Record<UserPlan, Limits> = {
  free: {
    cv_diagnosis_runs_per_month: 20,
    cv_job_matches_per_month: 0,
    cv_rewrite_sections_per_month: 0,
    resume_ai_process_runs_per_month: 20,
  },
  pro: {
    cv_diagnosis_runs_per_month: 500,
    cv_job_matches_per_month: 300,
    cv_rewrite_sections_per_month: 300,
    resume_ai_process_runs_per_month: 500,
  },
};

const DEFAULT_FEATURES: Record<UserPlan, Set<FeatureKey>> = {
  free: new Set<FeatureKey>(['resume.ai_process']),
  pro: new Set<FeatureKey>(['resume.ai_process', 'cv.job_match', 'cv.rewrite_section', 'cv.diagnosis.full']),
};

export function currentPeriodKey(now = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export async function resolveEffectivePlan(userId: string): Promise<UserPlan> {
  const activeSub = await Subscription.findOne({
    user_id: userId,
    status: { $in: ['trialing', 'active', 'past_due'] },
  })
    .sort({ updated_at: -1 })
    .select('plan_code')
    .lean();
  const subPlan = (activeSub as { plan_code?: string } | null)?.plan_code;
  if (subPlan === 'pro') return 'pro';

  const u = await User.findById(userId).select('plan').lean();
  const p = (u as { plan?: string } | null)?.plan;
  return p === 'pro' ? 'pro' : 'free';
}

async function loadPlanOverride(plan: UserPlan): Promise<{ limits?: Partial<Limits>; features?: string[] } | null> {
  const doc = await Plan.findOne({ code: plan, is_public: true })
    .select('limits features')
    .lean();
  if (!doc) return null;
  return doc as { limits?: Partial<Limits>; features?: string[] };
}

export async function hasFeature(userId: string, feature: FeatureKey): Promise<boolean> {
  const plan = await resolveEffectivePlan(userId);
  const override = await loadPlanOverride(plan);
  const set = new Set<string>(override?.features?.length ? override.features : Array.from(DEFAULT_FEATURES[plan]));
  return set.has(feature);
}

export async function getQuotaLimit(userId: string, key: QuotaKey): Promise<number> {
  const plan = await resolveEffectivePlan(userId);
  const override = await loadPlanOverride(plan);
  const o = override?.limits?.[key];
  if (typeof o === 'number' && Number.isFinite(o) && o >= 0) return o;
  return DEFAULT_LIMITS[plan][key];
}

export async function consumeQuota(userId: string, key: QuotaKey): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const limit = await getQuotaLimit(userId, key);
  if (limit <= 0) return { allowed: false, remaining: 0, limit };

  const period = currentPeriodKey();

  // Optimistic lock-free atomic increment using Mongo $inc
  const result = await UsageCounter.findOneAndUpdate(
    { user_id: userId, period_key: period },
    {
      $setOnInsert: { user_id: userId, period_key: period, created_at: new Date() },
      $inc: { [`counters.${key}`]: 1 },
      $set: { updated_at: new Date() },
    },
    { upsert: true, new: true, lean: true }
  );

  const current = Number((result as { counters?: Record<string, unknown> } | null)?.counters?.[key] || 0);

  if (current > limit) {
    // Exceeded! Rollback the increment atomically
    await UsageCounter.updateOne(
      { user_id: userId, period_key: period },
      { $inc: { [`counters.${key}`]: -1 } }
    );
    return { allowed: false, remaining: 0, limit };
  }

  return { allowed: true, remaining: Math.max(limit - current, 0), limit };
}

