import { Schema, model } from 'mongoose';

const SystemErrorSchema = new Schema({
  request_id: { type: String, index: true },
  path: { type: String, index: true },
  method: { type: String },
  status_code: { type: Number, index: true },
  error_name: { type: String, index: true },
  message: { type: String },
  code: { type: String },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  ip: { type: String },
  user_agent: { type: String },
  stack: { type: String },
  handled: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now, index: true },
});

SystemErrorSchema.index({ error_name: 1, created_at: -1 });
SystemErrorSchema.index({ path: 1, created_at: -1 });
SystemErrorSchema.index({ status_code: 1, created_at: -1 });
SystemErrorSchema.index({ created_at: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default model('SystemError', SystemErrorSchema);
