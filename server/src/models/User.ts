import { Schema, model } from 'mongoose';

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  password_hash: { type: String, select: false },
  provider: { type: String, enum: ['local', 'google', 'linkedin'] },
  provider_id: String,
  avatar: String,
  /** Application role (admin access is role-gated). */
  role: {
    type: String,
    enum: ['user', 'support', 'admin', 'super_admin'],
    default: 'user',
  },
  /** Subscription tier for CV Pro gating */
  plan: { type: String, enum: ['free', 'pro'], default: 'free' },
  stripe_customer_id: { type: String, select: false },
  reset_token: { type: String, select: false },
  reset_token_expires: Date,
  created_at: { type: Date, default: Date.now },
});

export default model('User', UserSchema);
