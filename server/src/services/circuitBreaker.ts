import AdminSetting from '../models/AdminSetting';

export type BreakerState = 'closed' | 'open' | 'half-open';

export interface BreakerStateDoc {
  state: BreakerState;
  opened_at: string | null;
  cooldown_until: string | null;
  consecutive_failures: number;
  failure_count: number;
  success_count: number;
}

export const BREAKER_COOLDOWN_MS = 5 * 60 * 1000;
export const OPENAI_BREAKER_THRESHOLD = 5;
const BREAKER_KEY_PREFIX = 'monitor.breaker';

function defaults(): BreakerStateDoc {
  return {
    state: 'closed',
    opened_at: null,
    cooldown_until: null,
    consecutive_failures: 0,
    failure_count: 0,
    success_count: 0,
  };
}

function keyFor(name: string): string {
  return `${BREAKER_KEY_PREFIX}.${name}`;
}

export async function getBreaker(name: string): Promise<BreakerStateDoc> {
  const doc = await AdminSetting.findOne({ key: keyFor(name) })
    .lean()
    .catch(() => null);
  const raw = (doc as { value?: unknown } | null)?.value;
  if (!raw || typeof raw !== 'object') return defaults();
  return { ...defaults(), ...(raw as Record<string, unknown>) } as BreakerStateDoc;
}

export async function setBreaker(name: string, state: BreakerStateDoc): Promise<void> {
  await AdminSetting.findOneAndUpdate(
    { key: keyFor(name) },
    {
      key: keyFor(name),
      type: 'json',
      value: state,
      updated_at: new Date(),
    },
    { upsert: true }
  ).catch(() => {});
}

export async function isBreakerOpen(
  name: string
): Promise<{ open: boolean; retryAfterMs: number; state: BreakerStateDoc }> {
  const b = await getBreaker(name);
  if (b.state !== 'open') return { open: false, retryAfterMs: 0, state: b };
  const cooldown = b.cooldown_until ? new Date(b.cooldown_until).getTime() : 0;
  if (cooldown && Date.now() >= cooldown) {
    await setBreaker(name, { ...b, state: 'half-open' });
    return { open: false, retryAfterMs: 0, state: { ...b, state: 'half-open' } };
  }
  return { open: true, retryAfterMs: Math.max(0, cooldown - Date.now()), state: b };
}

export async function recordBreakerSuccess(name: string): Promise<void> {
  const b = await getBreaker(name);
  await setBreaker(name, {
    ...b,
    state: 'closed',
    opened_at: null,
    cooldown_until: null,
    consecutive_failures: 0,
    success_count: b.success_count + 1,
  });
}

export async function recordBreakerFailure(
  name: string,
  threshold = OPENAI_BREAKER_THRESHOLD
): Promise<BreakerStateDoc> {
  const b = await getBreaker(name);
  const consecutive = b.consecutive_failures + 1;
  const next: BreakerStateDoc = {
    ...b,
    consecutive_failures: consecutive,
    failure_count: b.failure_count + 1,
  };
  if (consecutive >= threshold) {
    next.state = 'open';
    next.opened_at = new Date().toISOString();
    next.cooldown_until = new Date(Date.now() + BREAKER_COOLDOWN_MS).toISOString();
  }
  await setBreaker(name, next);
  return next;
}
