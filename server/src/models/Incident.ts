import { Schema, model } from 'mongoose';

export type IncidentSeverity = 'info' | 'warning' | 'critical';
export type IncidentStatus = 'open' | 'auto_resolved' | 'manual_resolved' | 'ignored';
export type IncidentSource = 'error_spike' | 'repeated_error' | 'auth_anomaly' | 'openai_breaker';

const IncidentSchema = new Schema({
  title: { type: String, required: true },
  source: { type: String, enum: ['error_spike', 'repeated_error', 'auth_anomaly', 'openai_breaker'], required: true, index: true },
  key: { type: String, index: true },
  severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'warning', index: true },
  status: { type: String, enum: ['open', 'auto_resolved', 'manual_resolved', 'ignored'], default: 'open', index: true },
  summary: { type: String },
  metric: { type: String },
  threshold: { type: Number },
  value: { type: Number },
  details: { type: Schema.Types.Mixed },
  recommended_action: { type: String },
  observation_count: { type: Number, default: 1 },
  first_seen_at: { type: Date, default: Date.now },
  last_seen_at: { type: Date, default: Date.now },
  detected_at: { type: Date, default: Date.now },
  resolved_at: { type: Date },
  resolved_by: { type: String, enum: ['system', 'admin', 'manual'] },
  resolved_by_user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  alert_sent_at: { type: Date },
});

IncidentSchema.index({ status: 1, last_seen_at: -1 });
IncidentSchema.index({ severity: 1, detected_at: -1 });
IncidentSchema.index({ source: 1, key: 1, status: 1 });

export default model('Incident', IncidentSchema);
