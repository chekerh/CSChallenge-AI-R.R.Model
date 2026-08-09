import { Schema, model } from 'mongoose';

const JobApplicationSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  agent_id: { type: Schema.Types.ObjectId, ref: 'JobAgent' },
  company: { type: String, required: true },
  position: { type: String, required: true },
  url: String,
  status: { type: String, enum: ['saved', 'applied', 'interview', 'rejected', 'accepted'], default: 'saved' },
  match_score: Number,
  notes: String,
  applied_date: Date,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

JobApplicationSchema.index({ user_id: 1, status: 1 });

export default model('JobApplication', JobApplicationSchema);
