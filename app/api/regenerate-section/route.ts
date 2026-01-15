import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateDocument, DOCUMENT_CONFIG } from '@/lib/claude/generator'
import type { Database } from '@/lib/types/database'

type DocumentType = Database['public']['Tables']['documents']['Row']['doc_type']

export async function POST(request: NextRequest) {
  try {
    const { projectId, docType } = await request.json()

    if (!projectId || !docType) {
      return NextResponse.json(
        { error: 'Project ID and document type are required' },
        { status: 400 }
      )
    }

    // Validate docType
    if (!DOCUMENT_CONFIG[docType as DocumentType]) {
      return NextResponse.json(
        { error: 'Invalid document type' },
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

    // Fetch the document to regenerate
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', projectId)
      .eq('doc_type', docType)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Fetch user profile for onboarding data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
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

    // Fetch dependency documents
    const config = DOCUMENT_CONFIG[docType as DocumentType]
    const dependencyDocs: Record<string, string> = {}

    if (config.dependencies.length > 0) {
      const { data: deps } = await supabase
        .from('documents')
        .select('doc_type, content')
        .eq('project_id', projectId)
        .in('doc_type', config.dependencies)
        .eq('status', 'complete')

      if (deps) {
        for (const dep of deps) {
          if (dep.content) {
            dependencyDocs[dep.doc_type] = dep.content
          }
        }
      }
    }

    // Start regeneration in background
    regenerateDocumentInBackground(
      projectId,
      docType as DocumentType,
      projectContext,
      dependencyDocs
    ).catch(console.error)

    return NextResponse.json({
      success: true,
      message: 'Regeneration started',
      docType
    })
  } catch (error) {
    console.error('Error in regenerate-section:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function regenerateDocumentInBackground(
  projectId: string,
  docType: DocumentType,
  projectContext: any,
  dependencyDocs: Record<string, string>
) {
  const supabase = await createClient()
  const maxRetries = 3

  try {
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

    // If all retries failed, revert to previous state
    if (!content && lastError) {
      await supabase
        .from('documents')
        .update({ status: 'complete' }) // Revert to complete (preserve old content)
        .eq('project_id', projectId)
        .eq('doc_type', docType)

      console.error(`Failed to regenerate ${docType} after ${maxRetries} attempts:`, lastError)
      return
    }

    // Save successful document (replaces previous version)
    await supabase
      .from('documents')
      .update({
        content,
        status: 'complete',
        updated_at: new Date().toISOString(),
      })
      .eq('project_id', projectId)
      .eq('doc_type', docType)

    // Update project timestamp
    await supabase
      .from('projects')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', projectId)

  } catch (error) {
    console.error('Fatal error in regeneration:', error)

    // Revert document status on fatal error
    await supabase
      .from('documents')
      .update({ status: 'complete' })
      .eq('project_id', projectId)
      .eq('doc_type', docType)
  }
}
