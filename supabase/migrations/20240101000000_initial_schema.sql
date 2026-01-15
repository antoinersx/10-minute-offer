-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  plan text default 'free' check (plan in ('free', 'pro')),
  stripe_customer_id text,
  generations_this_month int default 0,
  billing_cycle_start timestamp with time zone,
  onboarding_complete boolean default false,
  business_name text,
  business_description text,
  target_avatar text,
  price_range text,
  competitors text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Projects table
create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  business_description text,
  avatar_description text,
  deep_research boolean default true,
  status text default 'draft' check (status in ('draft', 'generating', 'complete', 'failed', 'partial')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS on projects
alter table public.projects enable row level security;

-- Projects policies
create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Documents table
create table public.documents (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete cascade not null,
  doc_type text not null check (doc_type in (
    'market-research',
    'avatar-complete',
    'big-idea',
    'value-ladder',
    'avatar-validation',
    'landing-page-copy',
    'implementation-checklist'
  )),
  doc_number int not null check (doc_number in (3, 4, 5, 6, 7, 10, 14)),
  title text not null,
  content text,
  status text default 'pending' check (status in ('pending', 'generating', 'complete')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(project_id, doc_type)
);

-- Enable RLS on documents
alter table public.documents enable row level security;

-- Documents policies
create policy "Users can view documents of own projects"
  on public.documents for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = documents.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can insert documents for own projects"
  on public.documents for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = documents.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can update documents of own projects"
  on public.documents for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = documents.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete documents of own projects"
  on public.documents for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = documents.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Generations table (for tracking/analytics)
create table public.generations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  started_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  status text check (status in ('success', 'failed', 'partial')),
  error_message text,
  duration_seconds int,
  created_at timestamp with time zone default now()
);

-- Enable RLS on generations
alter table public.generations enable row level security;

-- Generations policies
create policy "Users can view own generations"
  on public.generations for select
  using (auth.uid() = user_id);

create policy "Users can insert own generations"
  on public.generations for insert
  with check (auth.uid() = user_id);

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add updated_at triggers
create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

create trigger projects_updated_at
  before update on public.projects
  for each row
  execute function public.handle_updated_at();

create trigger documents_updated_at
  before update on public.documents
  for each row
  execute function public.handle_updated_at();

-- Create a trigger to automatically create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
