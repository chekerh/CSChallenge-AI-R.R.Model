import { Schema, model } from 'mongoose';

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  password_hash: String,
  provider: String,
  provider_id: String,
  /** Subscription tier for CV Pro gating */
  plan: { type: String, enum: ['free', 'pro'], default: 'free' },
  created_at: { type: Date, default: Date.now },
});

export default model('User', UserSchema);
