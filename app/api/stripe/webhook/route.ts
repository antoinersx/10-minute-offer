import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

let _supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabaseAdmin;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const stripe = getStripe();
  const supabaseAdmin = getSupabaseAdmin();

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerEmail = session.customer_details?.email || session.customer_email;
        const customerId = session.customer as string;

        // Try to find user by metadata first, then by email
        let userId = session.metadata?.supabase_user_id;
        let profile;

        if (userId) {
          const { data } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          profile = data;
        }

        // If no userId in metadata, find by email (for Payment Links)
        if (!profile && customerEmail) {
          const { data } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('email', customerEmail)
            .single();
          profile = data;
          userId = profile?.id;
        }

        if (!profile || !userId) {
          console.error('No user found for checkout session', { customerEmail, customerId });
          break;
        }

        if (session.mode === 'subscription') {
          // Monthly subscription - 5 reports/month
          await supabaseAdmin.from('profiles').update({
            plan: 'pro',
            stripe_customer_id: customerId,
            billing_cycle_start: new Date().toISOString(),
            generations_this_month: 0,
          }).eq('id', userId);

          console.log(`User ${userId} (${customerEmail}) upgraded to Pro plan (subscription)`);
        } else if (session.mode === 'payment') {
          // One-time purchase - add 1 report credit
          const currentCredits = profile.report_credits || 0;

          await supabaseAdmin.from('profiles').update({
            report_credits: currentCredits + 1,
            stripe_customer_id: customerId,
          }).eq('id', userId);

          console.log(`User ${userId} (${customerEmail}) purchased 1 report credit (now has ${currentCredits + 1})`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!profile) {
          console.error(`No profile found for customer ${customerId}`);
          break;
        }

        const isActive = subscription.status === 'active';
        await supabaseAdmin.from('profiles').update({
          plan: isActive ? 'pro' : 'free',
        }).eq('id', profile.id);

        console.log(`Subscription updated for user ${profile.id}: ${subscription.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!profile) {
          console.error(`No profile found for customer ${customerId}`);
          break;
        }

        await supabaseAdmin.from('profiles').update({
          plan: 'free',
          generations_this_month: 0,
        }).eq('id', profile.id);

        console.log(`Subscription cancelled for user ${profile.id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!profile) {
          console.error(`No profile found for customer ${customerId}`);
          break;
        }

        console.log(`Payment failed for user ${profile.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
