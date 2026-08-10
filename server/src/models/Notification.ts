import { Schema, model } from 'mongoose';

export type NotificationType =
  | 'incident'
  | 'billing'
  | 'subscription'
  | 'system'
  | 'job';

const NotificationSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['incident', 'billing', 'subscription', 'system', 'job'], default: 'system', index: true },
  title: { type: String, required: true },
  body: { type: String, default: '' },
  link: { type: String, default: null },
  metadata: { type: Schema.Types.Mixed },
  read_at: { type: Date, default: null },
  created_at: { type: Date, default: Date.now, index: true },
});

NotificationSchema.index({ user_id: 1, created_at: -1 });
NotificationSchema.index({ user_id: 1, read_at: 1 });

export default model('Notification', NotificationSchema);
