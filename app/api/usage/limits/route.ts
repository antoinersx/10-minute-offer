import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGenerationLimits } from '@/lib/usage/limits'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const limits = await getGenerationLimits(user.id)

    if (!limits) {
      return NextResponse.json(
        { error: 'Unable to fetch limits' },
        { status: 500 }
      )
    }

    return NextResponse.json(limits)
  } catch (error) {
    console.error('Error in usage/limits:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
