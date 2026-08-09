import { Schema, model, Types } from 'mongoose';

const ResumeVersionSchema = new Schema({
  resume_id: { type: Types.ObjectId, ref: 'Resume', required: true },
  version_label: { type: String, required: true },
  content_text: { type: String, required: true },
  storage_path: String,
  created_at: { type: Date, default: Date.now }
});

ResumeVersionSchema.index({ resume_id: 1, created_at: 1 });

export default model('ResumeVersion', ResumeVersionSchema);
