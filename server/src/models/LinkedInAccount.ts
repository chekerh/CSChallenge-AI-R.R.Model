import { Schema, model } from 'mongoose';

const LinkedInAccountSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  linkedin_user_id: { type: String, required: true },
  linkedin_user_name: String,
  access_token: { type: String, select: false },
  refresh_token: { type: String, select: false },
  expires_at: Date,
  scope: String,
  auto_post: { type: Boolean, default: true },
  auto_reply: { type: Boolean, default: false },
  post_time: { type: String, default: '0 9 * * *' },
  tone: { type: String, enum: ['balanced', 'diagnostic', 'story', 'anti-hype'], default: 'balanced' },
  connected_at: { type: Date, default: Date.now },
  last_publish_at: Date,
  last_error: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export default model('LinkedInAccount', LinkedInAccountSchema);
