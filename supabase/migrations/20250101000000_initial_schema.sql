-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text default 'user',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Companies
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text,
  industry text,
  size text,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.companies enable row level security;

create policy "Users can manage own companies"
  on public.companies for all
  using (auth.uid() = owner_id or owner_id is null);

-- Contacts
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  company_id uuid references public.companies(id) on delete set null,
  owner_id uuid references auth.users(id) on delete set null,
  source text,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.contacts enable row level security;

create policy "Users can manage own contacts"
  on public.contacts for all
  using (auth.uid() = owner_id or owner_id is null);

-- Deals
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  amount numeric default 0,
  currency text default 'USD',
  stage text not null default 'lead',
  contact_id uuid references public.contacts(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  owner_id uuid references auth.users(id) on delete set null,
  expected_close_date date,
  closed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.deals enable row level security;

create policy "Users can manage own deals"
  on public.deals for all
  using (auth.uid() = owner_id or owner_id is null);

-- Activities
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('call', 'meeting', 'email')),
  subject text,
  body text,
  contact_id uuid references public.contacts(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  owner_id uuid references auth.users(id) on delete set null,
  occurred_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.activities enable row level security;

create policy "Users can manage own activities"
  on public.activities for all
  using (auth.uid() = owner_id or owner_id is null);

-- Tickets
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  contact_id uuid references public.contacts(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  assignee_id uuid references auth.users(id) on delete set null,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tickets enable row level security;

create policy "Users can manage own tickets"
  on public.tickets for all
  using (auth.uid() = owner_id or owner_id is null);

-- Campaigns
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text check (type in ('email', 'ad', 'event')),
  status text default 'draft',
  start_date date,
  end_date date,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.campaigns enable row level security;

create policy "Users can manage own campaigns"
  on public.campaigns for all
  using (auth.uid() = owner_id or owner_id is null);

-- Campaign contacts (touchpoints)
create table if not exists public.campaign_contacts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  status text,
  touched_at timestamptz default now(),
  unique(campaign_id, contact_id)
);

alter table public.campaign_contacts enable row level security;

create policy "Users can manage campaign_contacts for own campaigns"
  on public.campaign_contacts for all
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_contacts.campaign_id
      and (c.owner_id = auth.uid() or c.owner_id is null)
    )
  );

-- Trigger to create profile on signup (optional; we upsert from app too)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, updated_at)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), now());
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
