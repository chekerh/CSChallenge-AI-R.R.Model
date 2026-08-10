import pino from 'pino';
import SystemError from '../models/SystemError';
import Incident, { type IncidentSeverity, type IncidentSource } from '../models/Incident';
import SelfHealAction from '../models/SelfHealAction';
import AdminSetting from '../models/AdminSetting';
import { sendAdminAlertEmail } from './emailService';
import { getResendApiKey } from '../config/env';
import {
  getBreaker,
  setBreaker,
  recordBreakerFailure,
  OPENAI_BREAKER_THRESHOLD,
} from './circuitBreaker';

const log = pino({ name: 'monitoring' });

export const CONFIG = {
  windowMs: 5 * 60 * 1000,
  errorSpikeThreshold: 10,
  repeatedErrorThreshold: 5,
  authAnomalyThreshold: 8,
  openaiBreakerThreshold: OPENAI_BREAKER_THRESHOLD,
  healIntervalMs: 60 * 1000,
  initialDelayMs: 5000,
};

export interface RecordErrorParams {
  requestId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  name?: string;
  message?: string;
  code?: string;
  userId?: string | null;
  ip?: string;
  userAgent?: string;
  stack?: string;
  handled?: boolean;
}

export function recordError(p: RecordErrorParams): void {
  void SystemError.create({
    request_id: p.requestId,
    path: p.path,
    method: p.method,
    status_code: p.statusCode,
    error_name: p.name,
    message: p.message,
    code: p.code,
    user_id: p.userId || null,
    ip: p.ip,
    user_agent: p.userAgent,
    stack: p.stack,
    handled: p.handled,
  }).catch(() => {
    // best-effort capture; never break the request flow
  });
}

function severityFor(value: number, threshold: number): IncidentSeverity {
  if (value >= threshold * 3) return 'critical';
  if (value >= threshold * 2) return 'warning';
  return 'warning';
}

interface IncidentInput {
  source: IncidentSource;
  key: string;
  title: string;
  severity: IncidentSeverity;
  summary: string;
  metric: string;
  threshold: number;
  value: number;
  recommended_action: string;
}

async function upsertIncident(input: IncidentInput): Promise<void> {
  const existing = await Incident.findOne({ source: input.source, key: input.key, status: 'open' }).lean();
  if (existing) {
    await Incident.updateOne(
      { _id: existing._id },
      {
        $set: {
          last_seen_at: new Date(),
          value: input.value,
          summary: input.summary,
          severity:
            (existing.severity as IncidentSeverity) === 'critical'
              ? 'critical'
              : input.severity,
        },
        $inc: { observation_count: 1 },
      }
    );
    return;
  }
  await Incident.create({
    ...input,
    detected_at: new Date(),
    first_seen_at: new Date(),
    last_seen_at: new Date(),
  });
}

function recommendForSignature(signature: string): string {
  const s = signature.toLowerCase();
  if (s.includes('openai') || s.includes('fetch') || s.includes('econnrefused') || s.includes('timeout') || s.includes('429'))
    return 'Défaillance réseau/IA : le circuit breaker est activé automatiquement. Vérifiez la clé OpenAI et le débit.';
  if (s.includes('validation'))
    return 'Erreur de validation : corrigez le schéma de payload côté API ou côté client.';
  if (s.includes('duplicate') || s.includes('11000'))
    return 'Conflit de données (clé dupliquée) : corrigez la logique d’upsert ou la contrainte d’unicité.';
  if (s.includes('jwt') || s.includes('token'))
    return 'Erreur d’authentification : vérifiez JWT_SECRET et l’expiration des jetons.';
  return 'Corrigez l’exception ci-dessous (voir stack trace) puis confirmez la résolution.';
}

export async function runDetectionCycle(): Promise<void> {
  const since = new Date(Date.now() - CONFIG.windowMs);
  const minutes = CONFIG.windowMs / 60000;
  const [errorCount, bySignature, authErrors, openaiErrors] = await Promise.all([
    SystemError.countDocuments({ created_at: { $gte: since } }),
    SystemError.aggregate<{ _id: string; n: number }>([
      { $match: { created_at: { $gte: since } } },
      { $group: { _id: { $concat: ['$path', '|', { $ifNull: ['$error_name', 'Unknown'] }] }, n: { $sum: 1 } } },
      { $sort: { n: -1 } },
      { $limit: 8 },
    ]),
    SystemError.countDocuments({ created_at: { $gte: since }, path: /^\/auth/, status_code: 401 }),
    SystemError.countDocuments({ created_at: { $gte: since }, $or: [{ error_name: /OpenAI|fetch/i }, { message: /OpenAI|timeout|ECONNRESET/i }] }),
  ]);

  if (errorCount >= CONFIG.errorSpikeThreshold) {
    await upsertIncident({
      source: 'error_spike',
      key: 'global',
      title: "Pic d'erreurs système",
      severity: severityFor(errorCount, CONFIG.errorSpikeThreshold),
      summary: `${errorCount} erreurs enregistrées en ${minutes} min (seuil : ${CONFIG.errorSpikeThreshold})`,
      metric: 'errors_per_window',
      threshold: CONFIG.errorSpikeThreshold,
      value: errorCount,
      recommended_action: 'Consultez la liste des erreurs et traitez la première cause racine.',
    });
  }

  for (const sig of bySignature) {
    if (sig.n >= CONFIG.repeatedErrorThreshold) {
      await upsertIncident({
        source: 'repeated_error',
        key: sig._id,
        title: `Erreur répétée : ${sig._id.split('|').pop()}`,
        severity: severityFor(sig.n, CONFIG.repeatedErrorThreshold),
        summary: `${sig.n} occurrences de « ${sig._id} » en ${minutes} min`,
        metric: 'same_signature_per_window',
        threshold: CONFIG.repeatedErrorThreshold,
        value: sig.n,
        recommended_action: recommendForSignature(sig._id),
      });
    }
  }

  if (authErrors >= CONFIG.authAnomalyThreshold) {
    await upsertIncident({
      source: 'auth_anomaly',
      key: 'auth',
      title: 'Tentatives de connexion échouées en masse',
      severity: 'warning',
      summary: `${authErrors} échecs d’authentification en ${minutes} min (seuil : ${CONFIG.authAnomalyThreshold})`,
      metric: 'auth_failures_per_window',
      threshold: CONFIG.authAnomalyThreshold,
      value: authErrors,
      recommended_action: 'Vérifiez si une IP ou un compte subit une attaque brute-force sur /auth.',
    });
  }

  if (openaiErrors >= CONFIG.openaiBreakerThreshold) {
    const breaker = await getBreaker('openai');
    if (breaker.state !== 'open') {
      const state = await recordBreakerFailure('openai', CONFIG.openaiBreakerThreshold);
      await upsertIncident({
        source: 'openai_breaker',
        key: 'openai',
        title: 'Défaillances répétées du service IA (OpenAI)',
        severity: 'warning',
        summary: `${openaiErrors} échecs OpenAI en ${minutes} min — circuit breaker passé à « ${state.state} »`,
        metric: 'openai_failures_per_window',
        threshold: CONFIG.openaiBreakerThreshold,
        value: openaiErrors,
        recommended_action: 'Appels IA courts-circuités pendant le cooldown. Vérifiez la clé OpenAI, le solde et le débit.',
      });
      await SelfHealAction.create({
        action: 'breaker_open',
        status: 'success',
        detail: `Circuit breaker OpenAI ouvert après ${state.consecutive_failures} échecs consécutifs (cooldown ${5} min).`,
        metadata: { consecutive_failures: state.consecutive_failures },
      });
    }
  }

  await dispatchAlerts();
}

async function getAlertConfig(): Promise<{ enabled: boolean; email: string }> {
  const [enabledDoc, emailDoc] = await Promise.all([
    AdminSetting.findOne({ key: 'monitor.alert_enabled' }).lean(),
    AdminSetting.findOne({ key: 'monitor.alert_email' }).lean(),
  ]);
  return {
    enabled: Boolean((enabledDoc as { value?: unknown } | null)?.value),
    email: String((emailDoc as { value?: unknown } | null)?.value || '').trim(),
  };
}

export async function getAlertSettings(): Promise<{ enabled: boolean; email: string }> {
  return getAlertConfig();
}

export async function dispatchAlerts(): Promise<void> {
  if (process.env.NODE_ENV === 'test') return;
  if (getResendApiKey() === 're_placeholder') return;

  const cfg = await getAlertConfig();
  if (!cfg.enabled || !cfg.email) return;

  const criticals = await Incident.find({ status: 'open', severity: 'critical', alert_sent_at: null })
    .sort({ last_seen_at: -1 })
    .limit(5)
    .lean();

  for (const inc of criticals) {
    try {
      await sendAdminAlertEmail({
        to: cfg.email,
        title: inc.title,
        summary: inc.summary || `Incident « ${inc.title} » détecté automatiquement.`,
        severity: 'critical',
        source: inc.source,
        incidentId: String(inc._id),
        recommendedAction: inc.recommended_action,
      });
      await Incident.updateOne({ _id: inc._id }, { $set: { alert_sent_at: new Date() } });
      await SelfHealAction.create({
        incident_id: inc._id,
        action: 'admin_alert_email',
        status: 'success',
        detail: `Alerte critique envoyée à ${cfg.email}.`,
      });
    } catch (err) {
      log.error({ err, incidentId: String(inc._id) }, 'failed to dispatch admin alert email');
    }
  }
}

interface SignalResult {
  above: boolean;
  value: number;
}

async function signalForIncident(source: IncidentSource, key: string | undefined, since: Date): Promise<SignalResult> {
  switch (source) {
    case 'error_spike': {
      const count = await SystemError.countDocuments({ created_at: { $gte: since } });
      return { above: count >= CONFIG.errorSpikeThreshold, value: count };
    }
    case 'repeated_error': {
      const [p, n] = (key || '|').split('|');
      const count = await SystemError.countDocuments({
        created_at: { $gte: since },
        path: p || { $exists: true },
        error_name: n === 'Unknown' ? { $in: [null, 'Unknown', 'Error'] } : n,
      });
      return { above: count >= CONFIG.repeatedErrorThreshold, value: count };
    }
    case 'auth_anomaly': {
      const count = await SystemError.countDocuments({ created_at: { $gte: since }, path: /^\/auth/, status_code: 401 });
      return { above: count >= CONFIG.authAnomalyThreshold, value: count };
    }
    case 'openai_breaker': {
      const breaker = await getBreaker('openai');
      if (breaker.state === 'closed') return { above: false, value: 0 };
      const count = await SystemError.countDocuments({
        created_at: { $gte: since },
        $or: [{ error_name: /OpenAI|fetch/i }, { message: /OpenAI|timeout|ECONNRESET/i }],
      });
      return { above: count >= CONFIG.openaiBreakerThreshold, value: count };
    }
    default:
      return { above: false, value: 0 };
  }
}

export async function runSelfHealCycle(): Promise<void> {
  const since = new Date(Date.now() - CONFIG.windowMs);
  const openIncidents = await Incident.find({ status: 'open' }).lean();

  for (const inc of openIncidents) {
    const sig = await signalForIncident(inc.source as IncidentSource, inc.key, since);

    if (!sig.above) {
      await Incident.updateOne(
        { _id: inc._id },
        { $set: { status: 'auto_resolved', resolved_at: new Date(), resolved_by: 'system' } }
      );
      await SelfHealAction.create({
        incident_id: inc._id,
        action: 'auto_resolve',
        status: 'success',
        detail: `Signal revenu à la normale (${sig.value}/${inc.threshold ?? '—'}). Incident clôturé automatiquement.`,
      });
      continue;
    }

    const firstSeen = inc.first_seen_at ? new Date(inc.first_seen_at).getTime() : Date.now();
    const ageMs = Date.now() - firstSeen;
    if ((ageMs >= 15 * 60 * 1000 || (inc.observation_count ?? 1) >= 6) && inc.severity !== 'critical') {
      await Incident.updateOne({ _id: inc._id }, { $set: { severity: 'critical' } });
      await SelfHealAction.create({
        incident_id: inc._id,
        action: 'escalate',
        status: 'info',
        detail: 'Sévérité passée à « critique » : le signal persiste au-delà de la fenêtre d’observation.',
      });
    }

    await SelfHealAction.create({
      incident_id: inc._id,
      action: 'remediation_attempt',
      status: 'skipped',
      detail: `Recommandation appliquée par l’opérateur : ${inc.recommended_action ?? 'aucune'}`,
      metadata: { observed_value: sig.value, threshold: inc.threshold },
    });
  }

  const breaker = await getBreaker('openai');
  if (breaker.state === 'open' && breaker.cooldown_until && Date.now() >= new Date(breaker.cooldown_until).getTime()) {
    await setBreaker('openai', { ...breaker, state: 'half-open' });
    await SelfHealAction.create({
      action: 'breaker_half_open',
      status: 'info',
      detail: 'Cooldown écoulé : le prochain appel IA servira de test de récupération.',
    });
  }

  await dispatchAlerts();
}

let workerTimer: ReturnType<typeof setInterval> | null = null;
let initialTimer: ReturnType<typeof setTimeout> | null = null;
const workerStatus = {
  running: false,
  last_detection: null as string | null,
  last_self_heal: null as string | null,
  started_at: null as string | null,
};

export function getWorkerStatus() {
  return { ...workerStatus, interval_ms: CONFIG.healIntervalMs };
}

export async function runManualHealCycle(): Promise<{ incidents_detected: number; heal_actions: number }> {
  const incidentsBefore = await Incident.countDocuments();
  await runDetectionCycle();
  const incidentsAfter = await Incident.countDocuments();
  await runSelfHealCycle();
  const actions = await SelfHealAction.countDocuments({ created_at: { $gte: new Date(Date.now() - 10_000) } });
  return { incidents_detected: Math.max(0, incidentsAfter - incidentsBefore), heal_actions: actions };
}

export function startMonitoringWorker(): void {
  if (workerTimer) return;
  workerStatus.running = true;
  workerStatus.started_at = new Date().toISOString();

  const tick = (): void => {
    runDetectionCycle()
      .then(() => { workerStatus.last_detection = new Date().toISOString(); })
      .catch((err) => log.error({ err }, 'detection cycle failed'));
    runSelfHealCycle()
      .then(() => { workerStatus.last_self_heal = new Date().toISOString(); })
      .catch((err) => log.error({ err }, 'self-heal cycle failed'));
  };

  initialTimer = setTimeout(tick, CONFIG.initialDelayMs);
  workerTimer = setInterval(tick, CONFIG.healIntervalMs);
  log.info({ intervalMs: CONFIG.healIntervalMs }, 'Monitoring worker started');
}

export function stopMonitoringWorker(): void {
  if (initialTimer) clearTimeout(initialTimer);
  if (workerTimer) clearInterval(workerTimer);
  workerTimer = null;
  initialTimer = null;
  workerStatus.running = false;
  log.info('Monitoring worker stopped');
}
