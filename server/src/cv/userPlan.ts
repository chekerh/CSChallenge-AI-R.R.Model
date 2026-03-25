import User from '../models/User';

export type UserPlan = 'free' | 'pro';

export async function loadUserPlan(userId: string): Promise<UserPlan> {
  const u = await User.findById(userId).select('plan').lean();
  const p = (u as { plan?: string } | null)?.plan;
  return p === 'pro' ? 'pro' : 'free';
}
