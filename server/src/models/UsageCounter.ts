import { Schema, model } from 'mongoose';

const UsageCounterSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  period_key: { type: String, required: true, index: true },
  counters: { type: Schema.Types.Mixed, default: {} },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

UsageCounterSchema.index({ user_id: 1, period_key: 1 }, { unique: true });

export default model('UsageCounter', UsageCounterSchema);

