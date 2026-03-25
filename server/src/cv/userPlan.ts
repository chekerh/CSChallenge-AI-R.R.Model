import { resolveEffectivePlan } from '../billing/entitlements';

export type UserPlan = 'free' | 'pro';

export async function loadUserPlan(userId: string): Promise<UserPlan> {
  return resolveEffectivePlan(userId);
}
