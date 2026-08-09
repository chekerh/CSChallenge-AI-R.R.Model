import { Schema, model } from 'mongoose';

const LinkedInPostSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  text: { type: String, required: true, maxlength: 3000 },
  source: { type: String, enum: ['manual', 'ai'], default: 'manual' },
  status: { type: String, enum: ['draft', 'scheduled', 'published', 'failed', 'canceled'], default: 'draft' },
  scheduled_at: Date,
  published_at: Date,
  post_urn: { type: String, select: false },
  post_url: String,
  community: String,
  concepts: [String],
  likes: { type: Number, default: 0 },
  comments_count: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  error: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

LinkedInPostSchema.index({ user_id: 1, created_at: -1 });
LinkedInPostSchema.index({ user_id: 1, status: 1, scheduled_at: 1 });

export default model('LinkedInPost', LinkedInPostSchema);
