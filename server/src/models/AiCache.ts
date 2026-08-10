import { Schema, model } from 'mongoose';

const AiCacheSchema = new Schema({
  hash: { type: String, required: true, unique: true, index: true },
  model: { type: String, required: true },
  raw: { type: String, required: true },
  parsed: { type: Schema.Types.Mixed },
  hit_count: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now, index: true },
  expires_at: { type: Date, default: Date.now, index: true },
});

AiCacheSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export default model('AiCache', AiCacheSchema);
