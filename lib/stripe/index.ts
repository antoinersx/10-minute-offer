import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

export const STRIPE_PRICE_ID_PRO = process.env.STRIPE_PRICE_ID_PRO || '';

export const STRIPE_CONFIG = {
  proPriceId: STRIPE_PRICE_ID_PRO,
  currency: 'usd',
  successUrl: process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=success`
    : 'http://localhost:3000/dashboard?upgrade=success',
  cancelUrl: process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=cancelled`
    : 'http://localhost:3000/dashboard?upgrade=cancelled',
};
