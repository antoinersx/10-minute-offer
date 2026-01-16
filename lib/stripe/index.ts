import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Missing STRIPE_SECRET_KEY environment variable');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });
  }
  return _stripe;
}

// For backwards compatibility - lazy getter
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as any)[prop];
  }
});

export function getStripePriceId(): string {
  return process.env.STRIPE_PRICE_ID_PRO || '';
}

// For backwards compatibility
export const STRIPE_PRICE_ID_PRO = '';

export const STRIPE_CONFIG = {
  get proPriceId() {
    return process.env.STRIPE_PRICE_ID_PRO || '';
  },
  currency: 'usd',
  get successUrl() {
    return process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=success`
      : 'http://localhost:3000/dashboard?upgrade=success';
  },
  get cancelUrl() {
    return process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=cancelled`
      : 'http://localhost:3000/dashboard?upgrade=cancelled';
  },
};
