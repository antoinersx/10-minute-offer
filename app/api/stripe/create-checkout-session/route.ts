import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json().catch(() => ({}));
    const planType = body.planType || 'subscription'; // 'subscription' or 'one_report'

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    let customerId = profile.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email || user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Determine price ID and mode based on plan type
    const isSubscription = planType === 'subscription';
    const priceId = isSubscription ? STRIPE_CONFIG.proPriceId : STRIPE_CONFIG.oneReportPriceId;
    const mode: 'subscription' | 'payment' = isSubscription ? 'subscription' : 'payment';

    if (!priceId) {
      return NextResponse.json(
        { error: 'Stripe price ID not configured' },
        { status: 500 }
      );
    }

    // Use hardcoded URLs to avoid any env var issues
    const successUrl = 'https://marketreveal.ai/dashboard?upgrade=success';
    const cancelUrl = 'https://marketreveal.ai/dashboard?upgrade=cancelled';

    console.log('Creating checkout with:', { priceId, mode, successUrl, cancelUrl, customerId });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        supabase_user_id: user.id,
        plan_type: planType,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        details: error?.message || 'Unknown error',
        code: error?.code || 'unknown'
      },
      { status: 500 }
    );
  }
}
