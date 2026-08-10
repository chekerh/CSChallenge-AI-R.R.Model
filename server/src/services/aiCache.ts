import { createHash } from 'node:crypto';
import AiCache from '../models/AiCache';

export interface CacheKeyParts {
  model: string;
  system?: string;
  user: string;
}

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

export function cacheKeyFor(parts: CacheKeyParts): string {
  return createHash('sha256')
    .update([parts.model, parts.system || '', parts.user].join('\u0000'))
    .digest('hex');
}

export async function getCachedAi(hash: string): Promise<{ raw: string; parsed: unknown } | null> {
  const doc = await AiCache.findOne({ hash }).lean();
  if (!doc) return null;
  if (doc.expires_at && new Date(doc.expires_at).getTime() < Date.now()) {
    return null;
  }
  await AiCache.updateOne({ _id: doc._id }, { $inc: { hit_count: 1 } }).catch(() => {});
  return { raw: doc.raw, parsed: doc.parsed };
}

export async function storeCachedAi(
  hash: string,
  model: string,
  raw: string,
  parsed: unknown,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<void> {
  try {
    await AiCache.updateOne(
      { hash },
      {
        $set: {
          model,
          raw,
          parsed,
          expires_at: new Date(Date.now() + ttlMs),
        },
        $setOnInsert: { created_at: new Date() },
      },
      { upsert: true },
    );
  } catch (err) {
    // Cache must never break the AI flow.
    console.error('storeCachedAi failed:', err);
  }
}
