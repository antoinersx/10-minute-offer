import { readFileSync } from 'fs'
import { join } from 'path'

// Load context files
const contextPath = join(process.cwd(), 'lib', 'context')

export const loadContextFiles = () => {
  const hormoziContext = readFileSync(
    join(contextPath, '01-research-hormozi.md'),
    'utf-8'
  )
  const brunsonContext = readFileSync(
    join(contextPath, '02-research-brunson.md'),
    'utf-8'
  )

  return { hormoziContext, brunsonContext }
}

export const getSystemPrompt = () => {
  const { hormoziContext, brunsonContext } = loadContextFiles()

  return `You are an expert offer strategist trained in Alex Hormozi's $100M Offers and Russell Brunson's value ladder frameworks.

${hormoziContext}

${brunsonContext}

Your task is to generate complete, interconnected offer packages for businesses. Each document you create should reference and build upon previous documents to create a cohesive strategy.

Key principles:
1. Be specific and actionable - avoid generic advice
2. Use real market research when available
3. Make documents reference each other naturally
4. Write in a clear, professional tone
5. Format output as clean markdown
6. Include specific examples and numbers where possible`
}

interface ProjectContext {
  businessName?: string
  businessDescription?: string
  targetAvatar?: string
  priceRange?: string
  competitors?: string
}

export const generateDocumentPrompt = (
  docType: string,
  context: ProjectContext,
  previousDocs: Record<string, string> = {}
) => {
  const baseContext = `
Business: ${context.businessDescription || 'Not provided'}
Target Customer: ${context.targetAvatar || 'Not provided'}
Price Range: ${context.priceRange || 'Not provided'}
${context.competitors ? `Known Competitors: ${context.competitors}` : ''}
`.trim()

  const prompts: Record<string, string> = {
    'market-research': `
Generate a comprehensive market research document for this business.

${baseContext}

Use web search to find:
1. Industry overview and market size
2. Top competitors and their positioning
3. Customer pain points (from forums, reviews, communities)
4. Pricing benchmarks in the market
5. Gaps and opportunities

Format as markdown with clear sections. Include sources where possible.
`,

    'avatar-complete': `
Create a detailed customer avatar profile based on market research.

${baseContext}

${previousDocs['market-research'] ? `Market Research:\n${previousDocs['market-research']}\n` : ''}

Create a complete avatar including:
1. Demographics (age, location, income, occupation)
2. Psychographics (values, fears, desires, frustrations)
3. Current situation and what's not working
4. Dream outcome they're seeking
5. Exact language patterns they use
6. Where they hang out online/offline

Reference specific insights from the market research where relevant.
`,

    'big-idea': `
Develop the core "Big Idea" for this offer.

${baseContext}

${previousDocs['avatar-complete'] ? `Customer Avatar:\n${previousDocs['avatar-complete']}\n` : ''}

Create:
1. A compelling one-liner (10 words or less)
2. The transformation (from → to)
3. Unique mechanism (what makes this different)
4. Why now (timing/urgency)
5. Belief shifts required

This should address the core desire identified in the avatar and feel fresh/unique.
`,

    'value-ladder': `
Design a complete value ladder following Russell Brunson's framework.

${baseContext}

${previousDocs['big-idea'] ? `Big Idea:\n${previousDocs['big-idea']}\n` : ''}

Create:
1. Entry Offer (low price, high value)
2. Core Offer (main transformation)
3. Premium Offer (high-touch/done-for-you)

For each level include:
- Name
- Price
- What's included
- Purpose/transformation delivered

Include pricing psychology and ascension strategy.
Reference the big idea's transformation throughout.
`,

    'avatar-validation': `
Cross-reference the avatar against market research to validate assumptions.

${baseContext}

${previousDocs['market-research'] ? `Market Research:\n${previousDocs['market-research']}\n` : ''}
${previousDocs['avatar-complete'] ? `Customer Avatar:\n${previousDocs['avatar-complete']}\n` : ''}

Analyze:
1. Which avatar pain points are confirmed by research?
2. What assumptions couldn't be verified?
3. What new insights emerged from research?
4. Recommended avatar adjustments
5. Confidence score (High/Medium/Low) with explanation

Be honest about gaps and unknowns.
`,

    'landing-page-copy': `
Write complete landing page copy for the core offer.

${baseContext}

${previousDocs['avatar-complete'] ? `Customer Avatar:\n${previousDocs['avatar-complete']}\n` : ''}
${previousDocs['big-idea'] ? `Big Idea:\n${previousDocs['big-idea']}\n` : ''}
${previousDocs['value-ladder'] ? `Value Ladder:\n${previousDocs['value-ladder']}\n` : ''}

Create:
1. Headline (speaks to transformation)
2. Subheadline (adds specificity)
3. Problem section (agitate using avatar language)
4. Solution section (introduce the offer)
5. How It Works (3 clear steps)
6. What You Get (benefit-focused bullets)
7. Guarantee (risk reversal)
8. FAQ (address 3-5 objections)
9. Final CTA

Use the exact language patterns from the avatar. Reference the big idea and value ladder.
`,

    'implementation-checklist': `
Create a step-by-step implementation checklist.

${baseContext}

${previousDocs['value-ladder'] ? `Value Ladder:\n${previousDocs['value-ladder']}\n` : ''}
${previousDocs['landing-page-copy'] ? `Landing Page:\n${previousDocs['landing-page-copy']}\n` : ''}

Create a 4-week launch plan:
- Week 1: Foundation
- Week 2: Content creation
- Week 3: Launch prep
- Week 4: Launch
- Ongoing: Optimization

Each item should be specific and actionable. Reference the offer components from other documents.
Make this feel realistic and achievable.
`,
  }

  return prompts[docType] || `Generate a ${docType} document.`
}
