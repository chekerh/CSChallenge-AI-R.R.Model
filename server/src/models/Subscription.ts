import { Schema, model } from 'mongoose';

const SubscriptionSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { type: String, default: 'manual' },
  provider_customer_id: { type: String, default: null },
  provider_subscription_id: { type: String, default: null },
  status: {
    type: String,
    enum: ['trialing', 'active', 'past_due', 'canceled', 'incomplete'],
    default: 'active',
  },
  plan_code: { type: String, default: 'free' },
  current_period_start: { type: Date, default: Date.now },
  current_period_end: { type: Date, default: null },
  cancel_at_period_end: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

SubscriptionSchema.index({ provider_subscription_id: 1 }, { sparse: true });
SubscriptionSchema.index({ user_id: 1, status: 1 });

export default model('Subscription', SubscriptionSchema);

