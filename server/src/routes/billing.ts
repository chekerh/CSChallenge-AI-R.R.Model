import express from 'express';
import Stripe from 'stripe';
import { requireAuth } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/requireRole';
import User from '../models/User';
import Subscription from '../models/Subscription';
import { trackEvent } from '../analytics/events';
import { getStripeSecretKey } from '../config/env';
import pino from 'pino';

const log = pino({ name: 'billing' });

function getFrontendUrl(): string {
  const url = process.env.FRONTEND_URL;
  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FRONTEND_URL environment variable is required in production');
    }
    return 'http://localhost:5173';
  }
  return url.replace(/\/+$/, '');
}

const FRONTEND_URL = getFrontendUrl();

const STRIPE_PRICE_ID_PRO = process.env.STRIPE_PRICE_ID_PRO;
if (!STRIPE_PRICE_ID_PRO) {
  throw new Error('STRIPE_PRICE_ID_PRO environment variable is required');
}

const router = express.Router();
const stripe = new Stripe(getStripeSecretKey(), { apiVersion: '2026-05-27.dahlia' });

interface WebhookInvoice extends Stripe.Invoice {
  subscription?: string | Stripe.Subscription | null;
  subscription_details?: { subscription?: string | Stripe.Subscription | null };
}

interface WebhookSubscription extends Stripe.Subscription {
  current_period_end?: number | null;
}

// Get current subscription
router.get('/subscription', requireAuth, async (req, res) => {
  try {
    const sub = await Subscription.findOne({ user_id: req.user!.id }).lean();
    if (!sub) {
      return res.json({ plan_code: 'free', status: 'active', current_period_end: null });
    }
    res.json(sub);
  } catch (err) {
    log.error({ err }, 'Subscription fetch error');
    res.status(500).json({ error: 'Failed to load subscription' });
  }
});

// Create checkout session
router.post('/create-checkout', requireAuth, express.json(), async (req, res) => {
  try {
    const { plan_code } = req.body as { plan_code?: string };
    if (!plan_code || plan_code !== 'pro') {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const user = await User.findById(req.user!.id).select('+stripe_customer_id');
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check if user already has a Stripe customer ID
    let customerId = user.get('stripe_customer_id') as string | undefined;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { user_id: user._id.toString() },
      });
      customerId = customer.id;
      user.set('stripe_customer_id', customerId);
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_PRICE_ID_PRO,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${FRONTEND_URL}/payment?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/pricing`,
      metadata: { user_id: user._id.toString(), plan_code: 'pro' },
      allow_promotion_codes: true,
    });

    trackEvent({ userId: user._id.toString(), event: 'billing.checkout_created', props: { session_id: session.id, plan_code: 'pro' } });

    res.json({ url: session.url, session_id: session.id });
  } catch (err) {
    log.error({ err }, 'Checkout creation error');
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Create customer portal session (manage subscription)
router.post('/create-portal', requireAuth, express.json(), async (req, res) => {
  try {
    const user = await User.findById(req.user!.id).select('+stripe_customer_id');
    if (!user || !user.get('stripe_customer_id')) {
      return res.status(400).json({ error: 'No active subscription' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.get('stripe_customer_id') as string,
      return_url: `${FRONTEND_URL}/dashboard`,
    });

    res.json({ url: session.url });
  } catch (err) {
    log.error({ err }, 'Portal creation error');
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// Webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    log.warn({ err: err.message }, 'Webhook signature verification failed');
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const planCode = session.metadata?.plan_code || 'pro';

        if (userId) {
          const subId = session.subscription as string | null;
          let periodEnd: Date | null = null;
          if (subId) {
            try {
              const subResponse = await stripe.subscriptions.retrieve(subId) as unknown as { current_period_end: number };
              periodEnd = new Date(subResponse.current_period_end * 1000);
            } catch { /* ignore */ }
          }

          await Subscription.findOneAndUpdate(
            { user_id: userId },
            {
              plan_code: planCode,
              status: 'active',
              provider: 'stripe',
              provider_subscription_id: subId,
              current_period_start: new Date(session.created * 1000),
              current_period_end: periodEnd,
            },
            { upsert: true }
          );
          
          await User.findByIdAndUpdate(userId, { plan: planCode });
          trackEvent({ userId, event: 'billing.subscription_activated', props: { plan_code: planCode } });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as WebhookInvoice;
        const subRef = invoice.subscription_details?.subscription ?? invoice.subscription;
        const subscriptionId = (typeof subRef === 'string' ? subRef : subRef?.id) as string | undefined;
        
        if (subscriptionId) {
          const sub = await Subscription.findOne({ provider_subscription_id: subscriptionId });
          if (sub) {
            const periodEnd = invoice.lines?.data?.[0]?.period?.end
              ? new Date(invoice.lines.data[0].period.end * 1000)
              : new Date();
            
            await Subscription.findByIdAndUpdate(sub._id, {
              status: 'active',
              current_period_end: periodEnd,
            });
            await User.findByIdAndUpdate(String(sub.user_id), { plan: sub.plan_code || 'pro' });
            trackEvent({ userId: String(sub.user_id), event: 'billing.payment_succeeded' });
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as WebhookInvoice;
        const subRef = invoice.subscription_details?.subscription ?? invoice.subscription;
        const subscriptionId = (typeof subRef === 'string' ? subRef : subRef?.id) as string | undefined;
        
        if (subscriptionId) {
          const sub = await Subscription.findOne({ provider_subscription_id: subscriptionId });
          if (sub) {
            // Keep user on Pro during the dunning / past_due grace period (resolveEffectivePlan allows past_due)
            await Subscription.findByIdAndUpdate(sub._id, { status: 'past_due' });
            trackEvent({ userId: String(sub.user_id), event: 'billing.payment_failed' });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const sub = await Subscription.findOne({ provider_subscription_id: subscription.id });
        
        if (sub) {
          await Subscription.findByIdAndUpdate(sub._id, { status: 'canceled' });
          await User.findByIdAndUpdate(String(sub.user_id), { plan: 'free' });
          trackEvent({ userId: String(sub.user_id), event: 'billing.subscription_canceled' });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as WebhookSubscription;
        const sub = await Subscription.findOne({ provider_subscription_id: subscription.id });
        if (sub) {
          const planCode = subscription.metadata?.plan_code || 'pro';
          const status = subscription.status; // active, past_due, canceled, trialing, unpaid, incomplete
          const cancelAtPeriodEnd = subscription.cancel_at_period_end;
          const currentPeriodEnd = subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : null;
          
          await Subscription.findByIdAndUpdate(sub._id, {
            status: status === 'unpaid' ? 'canceled' : status,
            cancel_at_period_end: cancelAtPeriodEnd,
            current_period_end: currentPeriodEnd,
          });
          
          if (status === 'active' || status === 'trialing' || status === 'past_due') {
            await User.findByIdAndUpdate(String(sub.user_id), { plan: planCode });
          } else {
            await User.findByIdAndUpdate(String(sub.user_id), { plan: 'free' });
          }
          
          log.info({ subscriptionId: subscription.id, status }, 'Subscription updated via webhook');
        }
        break;
      }

      default:
        log.info(`Unhandled webhook event type ${event.type}`);
    }
  } catch (webhookErr) {
    log.error({ err: webhookErr }, 'Error processing Stripe webhook event');
    return res.status(500).json({ error: 'Failed to process webhook event' });
  }

  res.json({ received: true });
});

export default router;
