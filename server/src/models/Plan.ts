import { Schema, model } from 'mongoose';

const PlanSchema = new Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  currency: { type: String, default: 'TND' },
  price_monthly: { type: Number, default: 0 },
  is_public: { type: Boolean, default: true },
  sort_order: { type: Number, default: 0 },
  features: { type: [String], default: [] },
  limits: { type: Schema.Types.Mixed, default: {} },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export default model('Plan', PlanSchema);

