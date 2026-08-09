import { Schema, model, Types } from 'mongoose';

const ResumeSchema = new Schema({
  user_id: { type: Types.ObjectId, ref: 'User', required: true },
  title: String,
  created_at: { type: Date, default: Date.now }
});

ResumeSchema.index({ user_id: 1, created_at: -1 });

export default model('Resume', ResumeSchema);
