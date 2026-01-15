import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateDocument, GENERATION_SEQUENCE, DOCUMENT_CONFIG } from '@/lib/claude/generator'
import { canGenerateOffer, incrementGenerationCount } from '@/lib/usage/limits'
import type { Database } from '@/lib/types/database'

type DocumentType = Database['public']['Tables']['documents']['Row']['doc_type']

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json()

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

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

    // Fetch project and verify ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Check if already generating
    if (project.status === 'generating') {
      return NextResponse.json(
        { error: 'Generation already in progress' },
        { status: 409 }
      )
    }

    // Check generation limits
    const limitCheck = await canGenerateOffer(user.id)
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: limitCheck.reason || 'Generation limit reached',
          limits: limitCheck.limits
        },
        { status: 403 }
      )
    }

    // Fetch user profile for onboarding data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Update project status to generating
    await supabase
      .from('projects')
      .update({ status: 'generating', updated_at: new Date().toISOString() })
      .eq('id', projectId)

    // Create generation record
    const generationStartTime = Date.now()
    const { data: generation } = await supabase
      .from('generations')
      .insert({
        user_id: user.id,
        project_id: projectId,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    // Create project context
    const projectContext = {
      businessName: project.name,
      businessDescription: project.business_description || profile?.business_description || undefined,
      targetAvatar: project.avatar_description || profile?.target_avatar || undefined,
      priceRange: profile?.price_range || undefined,
      competitors: profile?.competitors || undefined,
      deepResearch: project.deep_research,
    }

    // Initialize document records
    for (const docType of GENERATION_SEQUENCE) {
      const config = DOCUMENT_CONFIG[docType]
      await supabase.from('documents').insert({
        project_id: projectId,
        doc_type: docType,
        doc_number: config.number,
        title: config.title,
        status: 'pending',
      })
    }

    // Increment generation count
    await incrementGenerationCount(user.id)

    // Start generation in background
    generateOfferInBackground(
      projectId,
      projectContext,
      generation?.id || '',
      generationStartTime
    ).catch(console.error)

    return NextResponse.json({
      success: true,
      message: 'Generation started',
      projectId
    })
  } catch (error) {
    console.error('Error in generate-offer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function generateOfferInBackground(
  projectId: string,
  projectContext: any,
  generationId: string,
  startTime: number
) {
  const supabase = await createClient()
  const previousDocs: Record<string, string> = {}
  let completedCount = 0
  const maxRetries = 3

  try {
    for (const docType of GENERATION_SEQUENCE) {
      const config = DOCUMENT_CONFIG[docType]

      // Update document status to generating
      await supabase
        .from('documents')
        .update({ status: 'generating' })
        .eq('project_id', projectId)
        .eq('doc_type', docType)

      let content = ''
      let attempts = 0
      let lastError: Error | null = null

      // Retry logic
      while (attempts < maxRetries) {
        try {
          attempts++

          // Load dependencies
          const dependencyDocs: Record<string, string> = {}
          for (const depType of config.dependencies) {
            if (previousDocs[depType]) {
              dependencyDocs[depType] = previousDocs[depType]
            }
          }

          // Generate document
          content = await generateDocument(
            docType,
            projectContext,
            dependencyDocs
          )

          // Success - break retry loop
          break
        } catch (error) {
          lastError = error as Error
          console.error(`Attempt ${attempts} failed for ${docType}:`, error)

          if (attempts < maxRetries) {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts)))
          }
        }
      }

      // If all retries failed, mark as partial and stop
      if (!content && lastError) {
        await supabase
          .from('documents')
          .update({ status: 'pending' })
          .eq('project_id', projectId)
          .eq('doc_type', docType)

        await supabase
          .from('projects')
          .update({ status: 'partial', updated_at: new Date().toISOString() })
          .eq('id', projectId)

        const duration = Math.floor((Date.now() - startTime) / 1000)
        await supabase
          .from('generations')
          .update({
            completed_at: new Date().toISOString(),
            status: 'partial',
            error_message: `Failed to generate ${config.title}: ${lastError.message}`,
            duration_seconds: duration,
          })
          .eq('id', generationId)

        return
      }

      // Save successful document
      await supabase
        .from('documents')
        .update({
          content,
          status: 'complete',
          updated_at: new Date().toISOString(),
        })
        .eq('project_id', projectId)
        .eq('doc_type', docType)

      // Store for next documents
      previousDocs[docType] = content
      completedCount++
    }

    // All documents generated successfully
    await supabase
      .from('projects')
      .update({ status: 'complete', updated_at: new Date().toISOString() })
      .eq('id', projectId)

    const duration = Math.floor((Date.now() - startTime) / 1000)
    await supabase
      .from('generations')
      .update({
        completed_at: new Date().toISOString(),
        status: 'success',
        duration_seconds: duration,
      })
      .eq('id', generationId)

  } catch (error) {
    console.error('Fatal error in generation:', error)

    await supabase
      .from('projects')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', projectId)

    const duration = Math.floor((Date.now() - startTime) / 1000)
    await supabase
      .from('generations')
      .update({
        completed_at: new Date().toISOString(),
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        duration_seconds: duration,
      })
      .eq('id', generationId)
  }
}
