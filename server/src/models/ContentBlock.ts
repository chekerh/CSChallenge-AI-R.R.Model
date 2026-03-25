import { Schema, model } from 'mongoose';

const ContentBlockSchema = new Schema({
  key: { type: String, required: true, unique: true },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  content: { type: Schema.Types.Mixed, default: {} },
  published_content: { type: Schema.Types.Mixed, default: null },
  published_at: { type: Date, default: null },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User' },
  updated_at: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now },
});

export default model('ContentBlock', ContentBlockSchema);

