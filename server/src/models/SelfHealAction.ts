import { Schema, model } from 'mongoose';

export type SelfHealActionStatus = 'success' | 'failed' | 'skipped' | 'info';

const SelfHealActionSchema = new Schema({
  incident_id: { type: Schema.Types.ObjectId, ref: 'Incident', default: null, index: true },
  action: { type: String, required: true },
  status: { type: String, enum: ['success', 'failed', 'skipped', 'info'], default: 'info', index: true },
  detail: { type: String },
  metadata: { type: Schema.Types.Mixed },
  triggered_by: { type: String, enum: ['worker', 'admin', 'system'], default: 'worker' },
  created_at: { type: Date, default: Date.now, index: true },
});

SelfHealActionSchema.index({ created_at: -1 });
SelfHealActionSchema.index({ incident_id: 1, created_at: -1 });

export default model('SelfHealAction', SelfHealActionSchema);
