import { Schema, model, Types } from 'mongoose';

const ResumeSchema = new Schema({
  user_id: { type: Types.ObjectId, ref: 'User', required: true },
  title: String,
  created_at: { type: Date, default: Date.now }
});

export default model('Resume', ResumeSchema);
