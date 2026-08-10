// Seeds local dev users (super admin + demo user). Idempotent: existing
// users keep their password, only role/plan are refreshed.
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/utopiahire';

const User = mongoose.model(
  'User',
  new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: String,
    password_hash: { type: String, select: false },
    provider: { type: String, enum: ['local', 'google'] },
    provider_id: String,
    role: {
      type: String,
      enum: ['user', 'support', 'admin', 'super_admin'],
      default: 'user',
    },
    plan: { type: String, enum: ['free', 'pro'], default: 'free' },
    stripe_customer_id: String,
    reset_token: String,
    reset_token_expires: Date,
    created_at: { type: Date, default: Date.now },
  })
);

const DEMO_ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL || 'admin@utopiahire.local';
const DEMO_ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD || 'Admin1234!';
const DEMO_USER_EMAIL = process.env.DEMO_USER_EMAIL || 'demo@utopiahire.local';
const DEMO_USER_PASSWORD = process.env.DEMO_USER_PASSWORD || 'Demo1234!';

async function upsert(email, name, password, role, plan) {
  const normalized = String(email).trim().toLowerCase();
  const existing = await User.findOne({ email: normalized }).select('_id').lean();
  if (existing) {
    await User.updateOne({ _id: existing._id }, { $set: { role, plan } }).exec();
    console.log(`[seed] ${normalized} already exists -> role=${role} plan=${plan} (password unchanged)`);
    return;
  }
  const hash = await bcrypt.hash(password, 10);
  await User.create({ email: normalized, name, password_hash: hash, role, plan });
  console.log(`[seed] created ${normalized} (${role}, ${plan})`);
}

async function main() {
  await mongoose.connect(uri);
  await upsert(DEMO_ADMIN_EMAIL, 'Admin', DEMO_ADMIN_PASSWORD, 'super_admin', 'pro');
  await upsert(DEMO_USER_EMAIL, 'Demo User', DEMO_USER_PASSWORD, 'user', 'free');
  console.log('\nLogin credentials:');
  console.log(`  Admin: ${DEMO_ADMIN_EMAIL} / ${DEMO_ADMIN_PASSWORD}`);
  console.log(`  Demo:  ${DEMO_USER_EMAIL} / ${DEMO_USER_PASSWORD}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('[seed] failed:', err.message);
  process.exit(1);
});
