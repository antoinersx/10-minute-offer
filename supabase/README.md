# Supabase Setup Instructions

## Prerequisites

1. Create a Supabase account at https://supabase.com
2. Create a new project

## Database Setup

### Option 1: Using Supabase Dashboard (Recommended for initial setup)

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `migrations/20240101000000_initial_schema.sql`
4. Paste and run the SQL in the SQL Editor
5. Verify tables were created under Database → Tables

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

You can find these values in:
- Supabase Dashboard → Settings → API

## Database Schema

The schema includes:

- **profiles**: User profiles with plan info, onboarding data
- **projects**: Offer projects created by users
- **documents**: Generated documents (7 per project)
- **generations**: Tracking/analytics for each generation run

All tables have Row Level Security (RLS) enabled with appropriate policies.

## Testing Database Connection

Create a test file to verify connection:

```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data, error } = await supabase.from('profiles').select('*').limit(1)
console.log({ data, error })
```
