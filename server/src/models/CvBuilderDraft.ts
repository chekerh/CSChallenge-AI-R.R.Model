import { Schema, model, Types } from 'mongoose';

const CvBuilderDraftSchema = new Schema({
  user_id: { type: Types.ObjectId, ref: 'User', required: true, unique: true },
  title: { type: String, default: 'Mon CV' },
  profile: { type: Schema.Types.Mixed, required: true },
  compiled_text: { type: String, required: true },
  updated_at: { type: Date, default: Date.now },
});

export default model('CvBuilderDraft', CvBuilderDraftSchema);
