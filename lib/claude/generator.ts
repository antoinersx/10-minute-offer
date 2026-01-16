import Anthropic from '@anthropic-ai/sdk'
import { anthropic, CLAUDE_MODEL } from './client'
import { getSystemPrompt, generateDocumentPrompt } from './prompts'
import type { Database } from '@/lib/types/database'

type ProjectContext = {
  businessName?: string
  businessDescription?: string
  targetAvatar?: string
  priceRange?: string
  competitors?: string
  deepResearch?: boolean
}

type DocumentType = Database['public']['Tables']['documents']['Row']['doc_type']

export async function generateDocument(
  docType: DocumentType,
  context: ProjectContext,
  previousDocs: Record<string, string> = {}
): Promise<string> {
  const systemPrompt = getSystemPrompt()
  const userPrompt = generateDocumentPrompt(docType, context, previousDocs)

  try {
    const messageParams: Anthropic.MessageCreateParams = {
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    }

    // Add web search tool if deep research is enabled
    if (context.deepResearch) {
      // Web search tool - using any to bypass SDK type mismatch
      messageParams.tools = [
        {
          type: 'web_search_20250305',
          name: 'web_search',
        } as any,
      ]
    }

    const response = await anthropic.messages.create(messageParams)

    // Extract text content from response
    let content = ''
    for (const block of response.content) {
      if (block.type === 'text') {
        content += block.text
      }
    }

    return content.trim()
  } catch (error) {
    console.error(`Error generating ${docType}:`, error)
    throw new Error(`Failed to generate ${docType}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export const DOCUMENT_CONFIG: Record<
  DocumentType,
  { number: 3 | 4 | 5 | 6 | 7 | 10 | 14; title: string; dependencies: DocumentType[] }
> = {
  'market-research': {
    number: 3,
    title: 'Market Research',
    dependencies: [],
  },
  'avatar-complete': {
    number: 4,
    title: 'Complete Customer Avatar',
    dependencies: ['market-research'],
  },
  'big-idea': {
    number: 5,
    title: 'The Big Idea',
    dependencies: ['avatar-complete'],
  },
  'value-ladder': {
    number: 6,
    title: 'Value Ladder',
    dependencies: ['big-idea'],
  },
  'avatar-validation': {
    number: 7,
    title: 'Avatar Validation',
    dependencies: ['market-research', 'avatar-complete'],
  },
  'landing-page-copy': {
    number: 10,
    title: 'Landing Page Copy',
    dependencies: ['avatar-complete', 'big-idea', 'value-ladder'],
  },
  'implementation-checklist': {
    number: 14,
    title: 'Implementation Checklist',
    dependencies: ['value-ladder', 'landing-page-copy'],
  },
}

export const GENERATION_SEQUENCE: DocumentType[] = [
  'market-research',
  'avatar-complete',
  'big-idea',
  'value-ladder',
  'avatar-validation',
  'landing-page-copy',
  'implementation-checklist',
]
