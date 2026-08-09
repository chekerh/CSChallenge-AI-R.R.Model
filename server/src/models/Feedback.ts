import { Schema, model, Types } from 'mongoose';

const FeedbackSchema = new Schema({
  resume_version_id: { type: Types.ObjectId, ref: 'ResumeVersion', required: true },
  author: String,
  suggestions: { type: Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now }
});

FeedbackSchema.index({ resume_version_id: 1 });

export default model('Feedback', FeedbackSchema);
