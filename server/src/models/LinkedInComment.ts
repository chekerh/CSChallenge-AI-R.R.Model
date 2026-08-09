import { Schema, model } from 'mongoose';

const LinkedInCommentSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  post_id: { type: Schema.Types.ObjectId, ref: 'LinkedInPost', index: true },
  post_urn: String,
  comment_urn: { type: String, required: true, unique: true },
  author_name: String,
  text: { type: String, required: true },
  received_at: { type: Date, default: Date.now },
  reply_text: String,
  reply_status: { type: String, enum: ['pending', 'approved', 'sent', 'dismissed'], default: 'pending' },
  replied_at: Date,
  reply_error: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

LinkedInCommentSchema.index({ user_id: 1, reply_status: 1, received_at: -1 });

export default model('LinkedInComment', LinkedInCommentSchema);
