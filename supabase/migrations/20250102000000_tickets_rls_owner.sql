-- Fix tickets RLS: add owner_id and restrict policy (for existing DBs that ran initial migration without it)
alter table public.tickets
  add column if not exists owner_id uuid references auth.users(id) on delete set null;

drop policy if exists "Users can manage tickets" on public.tickets;

create policy "Users can manage own tickets"
  on public.tickets for all
  using (auth.uid() = owner_id or owner_id is null);
