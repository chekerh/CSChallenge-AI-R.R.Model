import { Schema, model } from 'mongoose';

const JobAgentSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  schedule: { type: String, enum: ['daily', 'weekly'], default: 'daily' },
  keywords: [String],
  location: String,
  status: { type: String, enum: ['idle', 'running', 'error'], default: 'idle' },
  last_run: Date,
  last_error: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

JobAgentSchema.index({ user_id: 1, created_at: -1 });

export default model('JobAgent', JobAgentSchema);
