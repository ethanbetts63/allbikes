import { loadStripe } from '@stripe/stripe-js';

/**
 * One shared Stripe.js loader for every payment screen.
 *
 * Must live at module scope — calling loadStripe inside a component would
 * re-request the script on each render.
 */
export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
