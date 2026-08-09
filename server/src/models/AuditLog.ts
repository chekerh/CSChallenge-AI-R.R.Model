import { Schema, model } from 'mongoose';

const AuditLogSchema = new Schema({
  actor_user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  actor_role: { type: String, required: true },
  action: { type: String, required: true },
  target_type: { type: String },
  target_id: { type: String },
  metadata: { type: Schema.Types.Mixed },
  ip: { type: String },
  user_agent: { type: String },
  created_at: { type: Date, default: Date.now },
});

AuditLogSchema.index({ created_at: -1 });
AuditLogSchema.index({ action: 1, created_at: -1 });
AuditLogSchema.index({ created_at: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default model('AuditLog', AuditLogSchema);

