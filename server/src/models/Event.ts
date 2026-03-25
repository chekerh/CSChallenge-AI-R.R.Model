import { Schema, model } from 'mongoose';

const EventSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  event: { type: String, required: true, index: true },
  props: { type: Schema.Types.Mixed, default: {} },
  created_at: { type: Date, default: Date.now, index: true },
});

EventSchema.index({ event: 1, created_at: -1 });

export default model('Event', EventSchema);

