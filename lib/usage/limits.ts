import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

export interface GenerationLimit {
  allowed: number
  used: number
  remaining: number
  isUnlimited: boolean
}

/**
 * Check if user's billing cycle needs to be reset
 * Returns true if reset was performed
 */
export async function checkAndResetBillingCycle(profile: Profile): Promise<boolean> {
  const supabase = await createClient()

  // If no billing cycle start date, set it to now
  if (!profile.billing_cycle_start) {
    await supabase
      .from('profiles')
      .update({
        billing_cycle_start: new Date().toISOString(),
        generations_this_month: 0,
      })
      .eq('id', profile.id)
    return true
  }

  // Check if we've passed the billing cycle date
  const billingStart = new Date(profile.billing_cycle_start)
  const now = new Date()

  // Calculate next billing date (same day next month)
  const nextBillingDate = new Date(billingStart)
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)

  // If we've passed the next billing date, reset
  if (now >= nextBillingDate) {
    await supabase
      .from('profiles')
      .update({
        billing_cycle_start: now.toISOString(),
        generations_this_month: 0,
      })
      .eq('id', profile.id)
    return true
  }

  return false
}

/**
 * Get generation limits for a user
 */
export async function getGenerationLimits(userId: string): Promise<GenerationLimit | null> {
  const supabase = await createClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    return null
  }

  // Reset billing cycle if needed
  await checkAndResetBillingCycle(profile)

  // Refresh profile after potential reset
  const { data: refreshedProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (!refreshedProfile) {
    return null
  }

  const plan = refreshedProfile.plan || 'free'

  if (plan === 'free') {
    // Free plan: 1 generation lifetime
    return {
      allowed: 1,
      used: refreshedProfile.total_generations || 0,
      remaining: Math.max(0, 1 - (refreshedProfile.total_generations || 0)),
      isUnlimited: false,
    }
  } else if (plan === 'pro') {
    // Pro plan: 5 generations per month
    return {
      allowed: 5,
      used: refreshedProfile.generations_this_month || 0,
      remaining: Math.max(0, 5 - (refreshedProfile.generations_this_month || 0)),
      isUnlimited: false,
    }
  }

  // Unknown plan, return no access
  return {
    allowed: 0,
    used: 0,
    remaining: 0,
    isUnlimited: false,
  }
}

/**
 * Check if user can generate a new offer
 */
export async function canGenerateOffer(userId: string): Promise<{
  allowed: boolean
  reason?: string
  limits?: GenerationLimit
}> {
  const limits = await getGenerationLimits(userId)

  if (!limits) {
    return {
      allowed: false,
      reason: 'Unable to fetch user limits',
    }
  }

  if (limits.remaining <= 0) {
    const supabase = await createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', userId)
      .single()

    if (profile?.plan === 'free') {
      return {
        allowed: false,
        reason: 'Free plan limit reached. Upgrade to Pro for 5 offers per month.',
        limits,
      }
    } else {
      return {
        allowed: false,
        reason: 'Monthly generation limit reached. Your limit will reset on your billing cycle date.',
        limits,
      }
    }
  }

  return {
    allowed: true,
    limits,
  }
}

/**
 * Increment generation counters after a successful generation start
 */
export async function incrementGenerationCount(userId: string): Promise<void> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (!profile) {
    throw new Error('Profile not found')
  }

  // Increment both counters
  await supabase
    .from('profiles')
    .update({
      total_generations: (profile.total_generations || 0) + 1,
      generations_this_month: (profile.generations_this_month || 0) + 1,
    })
    .eq('id', userId)
}
