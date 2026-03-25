import { Schema, model } from 'mongoose';

const AdminSettingSchema = new Schema({
  key: { type: String, required: true, unique: true },
  type: { type: String, enum: ['string', 'number', 'boolean', 'json'], required: true },
  value: { type: Schema.Types.Mixed, required: true },
  validation: { type: Schema.Types.Mixed },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User' },
  updated_at: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now },
});

export default model('AdminSetting', AdminSettingSchema);

