import { Schema, model } from 'mongoose';

const AiUsageSchema = new Schema({
  date: { type: String, required: true, unique: true, index: true }, // YYYY-MM-DD
  requests: { type: Number, default: 0 },
  cached_hits: { type: Number, default: 0 },
  tokens_in: { type: Number, default: 0 },
  tokens_out: { type: Number, default: 0 },
  estimated_cost_usd: { type: Number, default: 0 },
  updated_at: { type: Date, default: Date.now },
});

export default model('AiUsage', AiUsageSchema);
