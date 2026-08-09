import { Schema, model, Types } from 'mongoose';

const CvAnalysisSchema = new Schema({
  user_id: { type: Types.ObjectId, ref: 'User', required: true, index: true },
  target_role: { type: String, required: true },
  output_language: { type: String, required: true },
  input_char_count: { type: Number, required: true },
  /** Full model output (always complete, for Pro history & upgrades). */
  full_diagnosis: { type: Schema.Types.Mixed, required: true },
  tier_at_request: { type: String, enum: ['free', 'pro'], required: true },
  created_at: { type: Date, default: Date.now },
});

CvAnalysisSchema.index({ created_at: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default model('CvAnalysis', CvAnalysisSchema);
