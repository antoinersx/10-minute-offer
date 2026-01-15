# prd 10 minute offer - Development Instructions

## Project Overview

This project was imported from a Product Requirements Document.

## Core Objectives

Work through the items in @fix_plan.md one at a time. For each iteration:
1. Pick the highest priority uncompleted task
2. Implement it fully with tests
3. Mark it complete in @fix_plan.md
4. Report your progress

## Key Principles

- Focus on ONE task per loop iteration
- Keep testing effort to ~20% of work
- Write clean, maintainable code
- Document significant decisions

## Status Reporting

At the end of each iteration, report:
```
STATUS: [working/blocked/done]
COMPLETED: [what you finished]
NEXT: [what's next or blockers]
EXIT_SIGNAL: [true only if ALL tasks complete]
```

## Exit Conditions

Set EXIT_SIGNAL: true ONLY when:
- All items in @fix_plan.md are marked complete
- All tests pass
- No remaining high-priority tasks

## Original Requirements

# PRD: 10 Minute Offer

## Introduction

10 Minute Offer is a web-based SaaS that generates complete $100M-style offer packages using AI. Users input their business information and target market, and the system uses Claude API (with web search) to research the market and generate a complete suite of offer documents based on the Hormozi and Brunson frameworks.

The product solves a critical problem: entrepreneurs spend days or weeks building offers manually, often creating disconnected documents that don't reference each other. 10 Minute Offer compresses this into a 10-minute AI-powered workflow that produces interconnected, research-backed offer assets.

**Inspiration UI:** LaunchOS (clean dashboard, step-by-step progress, quick access cards)

**Build Method:** RALPH framework via Claude Code with bash orchestration

---

## Goals

- Generate a complete offer package in under 10 minutes
- Produce 7 interconnected output documents that reference each other
- Use Claude's web search to validate market assumptions with real data
- Provide downloadable PDF exports for all outputs
- Launch MVP within 2-3 weeks
- Validate market demand via X (Twitter) audience
- Target pricing: $49/mo for 5 offer generations

---

## Target User

**Primary:** Solo entrepreneurs, course creators, coaches, agency owners who need to create or refine their offer.

**Characteristics:**
- Familiar with Hormozi's $100M Offers concept
- Currently struggling to articulate their offer clearly
- Willing to pay for speed and quality
- Active on X/Twitter (launch channel)

---

## User Flow

```
1. ONBOARDING
   User creates account → Answers 4-5 questions about their business and target market
   
2. PROJECT CREATION
   User starts new offer project → Inputs business details + target avatar description
   
3. GENERATION
   System triggers Claude API → Web research + document generation
   User sees progress indicator → "Researching market..." → "Building avatar..." → etc.
   
4. REVIEW
   User views generated documents in dashboard
   Can regenerate individual sections or full offer
   
5. EXPORT
   User downloads all documents as PDF (single zip or individual files)
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│                    (Next.js 14)                         │
│  - Landing page                                         │
│  - Auth (Supabase)                                      │
│  - Dashboard (LaunchOS-style)                           │
│  - Document viewer                                      │
│  - PDF export                                           │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                    BACKEND API                          │
│              (Next.js API Routes)                       │
│  - /api/generate-offer (main generation endpoint)      │
│  - /api/regenerate-section (single doc regeneration)   │
│  - /api/export-pdf (PDF generation)                    │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                  CLAUDE API LAYER                       │
│           (with web_search tool enabled)                │
│                                                         │
│  Context Files (loaded into every request):             │
│  - 01-research-hormozi.md                               │
│  - 02-research-brunson.md                               │
│                                                         │
│  Generation Sequence:                                   │
│  1. Market research (web search)                        │
│  2. Avatar generation                                   │
│  3. Big idea creation                                   │
│  4. Value ladder design                                 │
│  5. Avatar validation                                   │
│  6. Landing page copy                                   │
│  7. Implementation checklist                            │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                     DATABASE                            │
│                    (Supabase)                           │
│                                                         │
│  Tables:                                                │
│  - users (auth)                                         │
│  - projects (offer projects)                            │
│  - documents (generated outputs)                        │
│  - generations (usage tracking)                         │
└─────────────────────────────────────────────────────────┘
```

---

## Input Files (Context for Claude)

These files are loaded as context for every generation request:

### 01-research-hormozi.md
Reference document containing Alex Hormozi's $100M Offers framework:
- Grand Slam Offer components
- Value equation
- Pricing strategies
- Guarantee frameworks
- Bonus stacking methodology

### 02-research-brunson.md
Reference document containing Russell Brunson's frameworks:
- Value ladder concept
- Hook, story, offer structure
- Dream customer avatar methodology
- Funnel architecture principles

**Implementation:** These files are stored in the codebase and injected into Claude's system prompt for every generation.

---

## Output Files (Generated Documents)

Each project generates 7 documents:

| # | Filename | Description |
|---|----------|-------------|
| 03 | market-research.md | Web research findings: competitors, market trends, customer pain points, pricing benchmarks |
| 04 | avatar-complete.md | Full customer avatar: demographics, psychographics, pain points, desires, language patterns |
| 05 | big-idea.md | Core offer concept: transformation promise, unique mechanism, positioning |
| 06 | value-ladder.md | Complete value ladder: entry offer → core offer → premium offer with pricing |
| 07 | avatar-validation.md | Validation of avatar against market research: confirmed pain points, gaps, opportunities |
| 10 | landing-page-copy.md | Full landing page copy: headline, subhead, bullets, CTA, guarantee, testimonial placeholders |
| 14 | implementation-checklist.md | Step-by-step action plan to launch the offer |

**Document Interconnection Rules:**
- `avatar-complete.md` references pain points found in `market-research.md`
- `big-idea.md` addresses the core desire from `avatar-complete.md`
- `value-ladder.md` builds on the transformation in `big-idea.md`
- `avatar-validation.md` cross-references `market-research.md` and `avatar-complete.md`
- `landing-page-copy.md` uses language patterns from `avatar-complete.md`
- `implementation-checklist.md` references all other documents

---

## User Stories

### US-001: User Registration & Authentication
**Description:** As a new user, I want to create an account so I can save my offer projects.

**Acceptance Criteria:**
- [ ] User can sign up with email/password via Supabase Auth
- [ ] User can sign in with existing credentials
- [ ] User can reset password via email
- [ ] After auth, user is redirected to dashboard
- [ ] Typecheck passes
- [ ] Verify in browser

---

### US-002: Onboarding Flow
**Description:** As a new user, I want to answer a few questions about my business so the system understands my context.

**Acceptance Criteria:**
- [ ] First-time users see onboarding modal/page
- [ ] Questions collected:
  - Business name
  - What do you sell? (text, 1-2 sentences)
  - Who is your target customer? (text, 2-3 sentences)
  - What price range are you targeting? (dropdown: <$100, $100-500, $500-2000, $2000+)
  - Any competitors you know of? (optional, text)
- [ ] Answers saved to user profile in database
- [ ] User can skip and fill later
- [ ] Typecheck passes
- [ ] Verify in browser

---

### US-003: Dashboard Home
**Description:** As a user, I want to see my offer projects and create new ones from a clean dashboard.

**Acceptance Criteria:**
- [ ] Dashboard shows "Your Projects" list (empty state if none)
- [ ] "New Offer" button prominently displayed
- [ ] Each project card shows: name, date created, status (draft/complete)
- [ ] Click project card → opens project detail view
- [ ] UI inspired by LaunchOS: clean, minimal, progress indicators
- [ ] Typecheck passes
- [ ] Verify in browser

---

### US-004: Create New Offer Project
**Description:** As a user, I want to start a new offer project by providing basic information.

**Acceptance Criteria:**
- [ ] "New Offer" button opens project creation form
- [ ] Form fields:
  - Project name (text)
  - Business/product description (textarea, pre-filled from onboarding if available)
  - Target avatar description (textarea, pre-filled from onboarding if available)
  - Deep research toggle (on/off, default: on)
- [ ] Submit creates project in database with status "draft"
- [ ] User redirected to project detail page
- [ ] Typecheck passes
- [ ] Verify in browser

---

### US-005: Offer Generation - Trigger
**Description:** As a user, I want to generate my offer documents with one click.

**Acceptance Criteria:**
- [ ] Project detail page shows "Generate Offer" button
- [ ] Clicking button triggers generation API call
- [ ] Button shows loading state during generation
- [ ] User cannot trigger multiple generations simultaneously
- [ ] Typecheck passes
- [ ] Verify in browser

---

### US-006: Offer Generation - Progress Display
**Description:** As a user, I want to see progress while my offer is being generated so I know it's working.

**Acceptance Criteria:**
- [ ] Progress indicator shows current step:
  - "Researching market..."
  - "Building avatar..."
  - "Creating big idea..."
  - "Designing value ladder..."
  - "Validating avatar..."
  - "Writing landing page copy..."
  - "Creating implementation checklist..."
- [ ] Progress bar or step indicator updates in real-time (polling or websocket)
- [ ] Estimated time remaining shown (optional)
- [ ] Typecheck passes
- [ ] Verify in browser

---

### US-007: Offer Generation - Claude API Integration
**Description:** As the system, I need to call Claude API with proper context to generate all documents.

**Acceptance Criteria:**
- [ ] API endpoint `/api/generate-offer` accepts project ID
- [ ] Loads `01-research-hormozi.md` and `02-research-brunson.md` as context
- [ ] Constructs prompt with user's business info, avatar description, and onboarding data
- [ ] Enables `web_search` tool for market research step
- [ ] Generates all 7 output documents in sequence
- [ ] Each document references previous documents where appropriate
- [ ] Saves all documents to database linked to project
- [ ] Updates project status to "complete"
- [ ] Returns success/failure response
- [ ] Handles API errors gracefully (retry logic, user-friendly error messages)
- [ ] Typecheck passes

---

### US-008: Document Viewer
**Description:** As a user, I want to view my generated documents in a clean interface.

**Acceptance Criteria:**
- [ ] Project detail page shows list of all 7 documents
- [ ] Each document has: title, status (generated/pending), view button
- [ ] Clicking document opens markdown viewer (rendered, not raw)
- [ ] Documents displayed in logical order (03 → 04 → 05 → 06 → 07 → 10 → 14)
- [ ] Typecheck passes
- [ ] Verify in browser

---

### US-009: Single Document Regeneration
**Description:** As a user, I want to regenerate a single document if I'm not satisfied with it.

**Acceptance Criteria:**
- [ ] Each document card has "Regenerate" button
- [ ] Clicking regenerate calls `/api/regenerate-section` with document type
- [ ] System regenerates only that document (using existing project context + other docs as reference)
- [ ] Updated document replaces previous version
- [ ] Previous version is NOT saved (no version history in V1)
- [ ] Typecheck passes
- [ ] Verify in browser

---

### US-010: PDF Export - Single Document
**Description:** As a user, I want to download a single document as PDF.

**Acceptance Criteria:**
- [ ] Each document card has "Download PDF" button
- [ ] Clicking triggers PDF generation from markdown
- [ ] PDF has clean formatting: title, content, page numbers
- [ ] PDF filename: `[project-name]-[document-name].pdf`
- [ ] Typecheck passes
- [ ] Verify in browser

---

### US-011: PDF Export - Full Package
**Description:** As a user, I want to download all documents as a single ZIP file.

**Acceptance Criteria:**
- [ ] Project detail page has "Download All (ZIP)" button
- [ ] Clicking generates PDFs for all 7 documents
- [ ] PDFs bundled into ZIP file
- [ ] ZIP filename: `[project-name]-offer-package.zip`
- [ ] Download starts automatically
- [ ] Typecheck passes
- [ ] Verify in browser

---

### US-012: Usage Tracking & Limits
**Description:** As the system, I need to track generations per user to enforce plan limits.

**Acceptance Criteria:**
- [ ] Each generation increments user's monthly generation count
- [ ] Free tier: 1 offer total (lifetime)
- [ ] Pro tier ($49/mo): 5 offers per month
- [ ] User sees remaining generations on dashboard
- [ ] If limit reached, "Generate" button is disabled with upgrade prompt
- [ ] Generation count resets on billing cycle (1st of month or subscription anniversary)
- [ ] Typecheck passes

---

### US-013: Stripe Integration - Subscription
**Description:** As a user, I want to upgrade to Pro to get more offer generations.

**Acceptance Criteria:**
- [ ] "Upgrade" button visible on dashboard and in limit-reached state
- [ ] Clicking opens Stripe Checkout for $49/mo subscription
- [ ] After successful payment, user's plan updates to "pro"
- [ ] User can manage subscription (cancel, update payment) via Stripe Customer Portal
- [ ] Webhook handles subscription events (created, cancelled, payment failed)
- [ ] Typecheck passes
- [ ] Verify in browser

---

### US-014: Landing Page
**Description:** As a visitor, I want to understand what 10 Minute Offer does and sign up.

**Acceptance Criteria:**
- [ ] Landing page at root URL (/)
- [ ] Sections:
  - Hero: headline, subhead, CTA button
  - Problem: why building offers is painful
  - Solution: what 10 Minute Offer does
  - How it works: 3-step visual
  - Output preview: show sample documents
  - Pricing: Free vs Pro comparison
  - CTA: Sign up button
- [ ] Mobile responsive
- [ ] Typecheck passes
- [ ] Verify in browser

---

## Functional Requirements

### Core Generation

- FR-1: System must load `01-research-hormozi.md` and `02-research-brunson.md` as context for all generations
- FR-2: System must use Claude API with `web_search` tool enabled when "deep research" is on
- FR-3: System must generate documents in sequence: market-research → avatar → big-idea → value-ladder → avatar-validation → landing-page-copy → implementation-checklist
- FR-4: Each document must reference relevant content from previously generated documents
- FR-5: Generation must complete within 3 minutes for standard offers
- FR-6: System must handle Claude API failures with retry logic (max 3 retries)
- FR-7: System must save partial progress if generation fails mid-sequence

### Documents

- FR-8: All documents stored as markdown in database
- FR-9: Document viewer must render markdown to HTML
- FR-10: PDF export must convert markdown to clean, formatted PDF
- FR-11: ZIP export must include all 7 documents as individual PDFs

### User Management

- FR-12: Users authenticated via Supabase Auth (email/password)
- FR-13: Each user can have multiple projects
- FR-14: Projects belong to exactly one user (no sharing in V1)
- FR-15: Free users limited to 1 offer (lifetime)
- FR-16: Pro users limited to 5 offers per billing cycle

### Billing

- FR-17: Stripe handles all payment processing
- FR-18: Single plan: Pro at $49/month
- FR-19: Webhooks update user plan status in database
- FR-20: Users can cancel anytime via Stripe Customer Portal

---

## Non-Goals (Out of Scope for V1)

- Team seats / collaboration
- White-label / custom branding on outputs
- Version history for documents
- Email sequences as output
- Sales page builder (we generate copy, not design)
- Custom framework uploads (only Hormozi + Brunson)
- API access for external integrations
- Mobile app
- Document editing in-app (view only, edit externally)
- Multiple language support (English only)
- Affiliate program
- Lifetime deal (consider for launch promo only)

---

## Design Considerations

### UI Inspiration: LaunchOS
- Clean, minimal dashboard
- Step-by-step progress indicators
- Quick access cards for common actions
- Warm accent color (gold/yellow) on dark cards
- Light background, dark feature cards
- Clear hierarchy: what's next > your progress > quick access

### Key UI Elements
- **Dashboard:** Project list + "New Offer" CTA
- **Project Detail:** Document list + Generate button + Export options
- **Document Viewer:** Clean markdown rendering, full-width
- **Progress Indicator:** Step-by-step with current step highlighted

### Colors (from LaunchOS)
- Background: Light warm gray (#F5F3F0 or similar)
- Cards: Dark charcoal (#1A1A1A) for feature cards
- Accent: Gold/yellow (#D4A855) for CTAs and highlights
- Text: Dark gray for body, white on dark cards

---

## Technical Considerations

### Tech Stack
- **Frontend:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Auth:** Supabase Auth
- **Database:** Supabase PostgreSQL
- **AI:** Claude API (claude-sonnet-4-20250514) with web_search tool
- **Payments:** Stripe (Checkout + Customer Portal + Webhooks)
- **PDF Generation:** @react-pdf/renderer or Puppeteer
- **Deployment:** Vercel

### Database Schema

```sql
-- Users (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users primary key,
  email text,
  plan text default 'free', -- 'free' | 'pro'
  stripe_customer_id text,
  generations_this_month int default 0,
  billing_cycle_start timestamp,
  onboarding_complete boolean default false,
  business_name text,
  business_description text,
  target_avatar text,
  price_range text,
  competitors text,
  created_at timestamp default now()
);

-- Projects
create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id),
  name text not null,
  business_description text,
  avatar_description text,
  deep_research boolean default true,
  status text default 'draft', -- 'draft' | 'generating' | 'complete' | 'failed'
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Documents
create table public.documents (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id),
  doc_type text not null, -- 'market-research' | 'avatar-complete' | etc.
  doc_number int not null, -- 03, 04, 05, etc.
  title text not null,
  content text, -- markdown content
  status text default 'pending', -- 'pending' | 'generating' | 'complete'
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Generations (for tracking/analytics)
create table public.generations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id),
  project_id uuid references public.projects(id),
  started_at timestamp default now(),
  completed_at timestamp,
  status text, -- 'success' | 'failed' | 'partial'
  error_message text,
  duration_seconds int
);
```

### Claude API Prompt Structure

```
SYSTEM PROMPT:
You are an expert offer strategist trained in Alex Hormozi's $100M Offers and Russell Brunson's value ladder frameworks.

[INJECT: 01-research-hormozi.md content]
[INJECT: 02-research-brunson.md content]

Your task is to generate a complete offer package for a business. You will create 7 interconnected documents. Each document should reference and build upon the previous ones.

USER PROMPT:
Business: [from project]
Target Customer: [from project]
Price Range: [from onboarding]
Known Competitors: [from onboarding, if any]

Generate the following documents in order:
1. Market Research (use web search to find real data)
2. Complete Avatar Profile
3. Big Idea / Core Offer Concept
4. Value Ladder
5. Avatar Validation (cross-reference with market research)
6. Landing Page Copy
7. Implementation Checklist

For each document, output in this format:
---
## [Document Title]
[Content in markdown]
---
```

### API Rate Limits & Costs
- Claude Sonnet: ~$3 per 1M input tokens, ~$15 per 1M output tokens
- Estimated cost per full generation: $1-2 (with web search)
- At $49/mo for 5 offers: ~$5-10 cost, $39-44 margin per user

### RALPH Integration
- Use RALPH framework for Claude Code orchestration
- Bash script handles generation sequence
- Each document generated as separate Claude call for reliability
- Progress updates via database status field (polled by frontend)

---

## Success Metrics

### Launch (Week 1-2)
- [ ] 100+ signups from X launch
- [ ] 10+ free offers generated
- [ ] 5+ paying customers

### Month 1
- [ ] 50+ paying customers ($2,450 MRR)
- [ ] <5% churn
- [ ] Average generation time <3 minutes
- [ ] NPS >40

### Month 3
- [ ] 200+ paying customers ($9,800 MRR)
- [ ] 3+ testimonials with specific results
- [ ] Feature requests informing V2 roadmap

---

## Open Questions

1. **Regeneration scope:** When regenerating a single document, should we also update downstream documents that reference it? (V1: No, keep simple)

2. **Generation timeout:** What happens if Claude takes >3 minutes? (Show timeout message, allow retry)

3. **Partial generation:** If generation fails at document 5, do we keep documents 1-4? (Yes, mark project as "partial")

4. **Deep research toggle:** Should this affect pricing/limits differently? (V1: No, same limits)

5. **Output editing:** Should users be able to edit documents in-app? (V1: No, download and edit externally)

---

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- [ ] Next.js project setup with Tailwind
- [ ] Supabase auth integration
- [ ] Database schema deployed
- [ ] Basic dashboard UI (project list, create project)

### Phase 2: Generation Engine (Week 1-2)
- [ ] Claude API integration with web search
- [ ] Prompt engineering for all 7 documents
- [ ] Generation endpoint with progress tracking
- [ ] Document storage and retrieval

### Phase 3: User Experience (Week 2)
- [ ] Document viewer with markdown rendering
- [ ] PDF export (single + ZIP)
- [ ] Progress indicators during generation
- [ ] Error handling and retry logic

### Phase 4: Monetization (Week 2-3)
- [ ] Stripe integration (Checkout, Portal, Webhooks)
- [ ] Usage tracking and limits
- [ ] Upgrade flow

### Phase 5: Launch (Week 3)
- [ ] Landing page
- [ ] X/Twitter launch campaign
- [ ] Onboarding flow polish
- [ ] Bug fixes from beta testers

---

## Appendix: Document Output Specifications

### 03-market-research.md
```markdown
# Market Research: [Business Name]

## Industry Overview
[2-3 paragraphs on market size, trends, growth]

## Competitor Analysis
[Table: Competitor | Positioning | Price Range | Strengths | Weaknesses]

## Customer Pain Points (from real sources)
[Bulleted list with source attribution where possible]

## Pricing Benchmarks
[What competitors charge, market expectations]

## Opportunities
[Gaps in the market this offer can fill]
```

### 04-avatar-complete.md
```markdown
# Customer Avatar: [Avatar Name]

## Demographics
- Age:
- Gender:
- Location:
- Income:
- Occupation:

## Psychographics
- Values:
- Fears:
- Desires:
- Frustrations:

## Current Situation
[What they're doing now, what's not working]

## Dream Outcome
[What transformation do they want]

## Language Patterns
[Exact phrases they use to describe their problems]

## Where They Hang Out
[Platforms, communities, influencers they follow]
```

### 05-big-idea.md
```markdown
# The Big Idea

## One-Liner
[10 words or less describing the core offer]

## The Transformation
From: [Current state]
To: [Desired state]

## Unique Mechanism
[What makes this different from everything else]

## Why Now
[Why this is the right moment for this offer]

## Belief Shifts Required
[What the customer must believe to buy]
```

### 06-value-ladder.md
```markdown
# Value Ladder

## Level 1: Entry Offer
- Name:
- Price:
- What's Included:
- Purpose: [Lead generation / trust building]

## Level 2: Core Offer
- Name:
- Price:
- What's Included:
- Transformation Delivered:

## Level 3: Premium Offer
- Name:
- Price:
- What's Included:
- Why Someone Would Upgrade:

## Pricing Psychology
[Anchoring strategy, value stacking notes]
```

### 07-avatar-validation.md
```markdown
# Avatar Validation Report

## Confirmed Pain Points
[Pain points from avatar that were validated by market research]

## Unconfirmed Assumptions
[Things we assumed but couldn't verify]

## New Insights
[Things discovered in research not in original avatar]

## Recommended Avatar Adjustments
[How to refine the avatar based on research]

## Confidence Score
[High / Medium / Low with explanation]
```

### 10-landing-page-copy.md
```markdown
# Landing Page Copy

## Headline
[Main headline - speaks to transformation]

## Subheadline
[Supporting line - adds specificity]

## Hero Section
[Opening paragraph]

## Problem Section
[Agitate the pain - use avatar language]

## Solution Section
[Introduce the offer as the answer]

## How It Works
1. [Step 1]
2. [Step 2]
3. [Step 3]

## What You Get
[Bullet list of deliverables with benefit-focused descriptions]

## Guarantee
[Risk reversal statement]

## FAQ
[3-5 common objections answered]

## Final CTA
[Closing statement + button text]
```

### 14-implementation-checklist.md
```markdown
# Implementation Checklist

## Week 1: Foundation
- [ ] Finalize offer name and positioning
- [ ] Create simple landing page with copy provided
- [ ] Set up payment processing
- [ ] Prepare delivery mechanism

## Week 2: Content
- [ ] Record/write core offer content
- [ ] Create bonus materials
- [ ] Set up email sequences

## Week 3: Launch Prep
- [ ] Test purchase flow end-to-end
- [ ] Prepare launch emails/posts
- [ ] Line up 3-5 beta customers for testimonials

## Week 4: Launch
- [ ] Soft launch to warm audience
- [ ] Collect feedback, iterate
- [ ] Scale promotion

## Ongoing
- [ ] Weekly review of conversion metrics
- [ ] Monthly offer optimization based on feedback
```

---

## Final Notes

This PRD is designed to be implemented using Claude Code with the RALPH framework. Each user story is scoped to be completable in a focused session. The generation engine is the core differentiator — everything else is standard SaaS infrastructure.

**Priority order if time is tight:**
1. Generation engine (US-007) — this IS the product
2. Basic dashboard (US-003, US-004, US-005)
3. Document viewer (US-008)
4. PDF export (US-010, US-011)
5. Auth and billing (US-001, US-012, US-013)
6. Landing page (US-014)

Ship generation + dashboard first. Add billing when you have users asking to pay.
