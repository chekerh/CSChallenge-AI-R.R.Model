import AiUsage from '../models/AiUsage';
import AdminSetting from '../models/AdminSetting';

const DEFAULT_BUDGET_USD = 10;

export interface CostGuardStatus {
  enabled: boolean;
  daily_budget_usd: number;
  daily_spent_usd: number;
  remaining_usd: number;
  blocked: boolean;
}

export function todayKey(offsetMs = 0): string {
  const d = new Date(Date.now() + offsetMs);
  return d.toISOString().slice(0, 10);
}

async function getGuardConfig(): Promise<{ enabled: boolean; budgetUsd: number }> {
  const [enabledDoc, budgetDoc] = await Promise.all([
    AdminSetting.findOne({ key: 'ai.cost_guard_enabled' }).lean(),
    AdminSetting.findOne({ key: 'ai.daily_budget_usd' }).lean(),
  ]);
  const budgetRaw = Number((budgetDoc as { value?: unknown } | null)?.value ?? DEFAULT_BUDGET_USD);
  return {
    enabled: Boolean((enabledDoc as { value?: unknown } | null)?.value),
    budgetUsd: Number.isFinite(budgetRaw) && budgetRaw > 0 ? budgetRaw : DEFAULT_BUDGET_USD,
  };
}

export async function getCostGuardStatus(): Promise<CostGuardStatus> {
  const cfg = await getGuardConfig();
  const usage = await AiUsage.findOne({ date: todayKey() }).lean();
  const dailySpent = Number((usage as { estimated_cost_usd?: unknown } | null)?.estimated_cost_usd ?? 0);
  return {
    enabled: cfg.enabled,
    daily_budget_usd: cfg.budgetUsd,
    daily_spent_usd: dailySpent,
    remaining_usd: Math.max(0, cfg.budgetUsd - dailySpent),
    blocked: cfg.enabled && dailySpent >= cfg.budgetUsd,
  };
}

export async function assertAiBudgetAvailable(): Promise<void> {
  const status = await getCostGuardStatus();
  if (status.blocked) {
    const err = new Error(
      `Budget IA quotidien atteint (${status.daily_spent_usd.toFixed(2)} USD / ${status.daily_budget_usd} USD). Réessayez demain.`,
    );
    err.name = 'BudgetExceededError';
    throw err;
  }
}

const COST_PER_1K_IN = 0.0015; // gpt-4o-mini input $/1k tokens
const COST_PER_1K_OUT = 0.006; // gpt-4o-mini output $/1k tokens

export async function recordAiUsage(input: {
  tokensIn: number;
  tokensOut: number;
  cachedHit?: boolean;
}): Promise<void> {
  try {
    const cost =
      ((input.tokensIn || 0) / 1000) * COST_PER_1K_IN +
      ((input.tokensOut || 0) / 1000) * COST_PER_1K_OUT;
    await AiUsage.findOneAndUpdate(
      { date: todayKey() },
      {
        $inc: {
          requests: 1,
          cached_hits: input.cachedHit ? 1 : 0,
          tokens_in: input.tokensIn || 0,
          tokens_out: input.tokensOut || 0,
          estimated_cost_usd: cost,
        },
        $set: { updated_at: new Date() },
      },
      { upsert: true },
    );
  } catch (err) {
    console.error('recordAiUsage failed:', err);
  }
}
