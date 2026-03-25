import Event from '../models/Event';

export function trackEvent(params: {
  userId?: string | null;
  event: string;
  props?: Record<string, unknown>;
}): void {
  const { userId, event, props } = params;
  void Event.create({
    user_id: userId || null,
    event,
    props: props || {},
  }).catch(() => {
    // best-effort analytics; never break main request flow
  });
}

