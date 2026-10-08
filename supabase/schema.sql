create table if not exists public.portal_admin (user_id uuid primary key references auth.users(id) on delete cascade);
create unique index if not exists portal_admin_singleton on public.portal_admin ((true));
insert into public.portal_admin(user_id)
select id from auth.users where lower(email)=lower('REPLACE_WITH_ADMIN_EMAIL@example.com')
on conflict do nothing;

create or replace function public.is_portal_admin() returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.portal_admin where user_id=(select auth.uid()));
$$;
revoke all on function public.is_portal_admin() from public;
grant execute on function public.is_portal_admin() to authenticated;

create table if not exists public.beneficiaries (id uuid primary key default gen_random_uuid(), full_name text not null, phone text, status text, created_at timestamptz not null default now());
create table if not exists public.vehicles (id uuid primary key default gen_random_uuid(), plate_number text not null, make_model text, model_year integer, status text, created_at timestamptz not null default now());
create table if not exists public.contracts (id uuid primary key default gen_random_uuid(), reference text not null, beneficiary_name text, vehicle_plate text, monthly_amount numeric(12,2), status text, created_at timestamptz not null default now());
create table if not exists public.installments (id uuid primary key default gen_random_uuid(), contract_reference text not null, due_date date, amount numeric(12,2), paid_amount numeric(12,2), status text, created_at timestamptz not null default now());
create table if not exists public.maintenance (id uuid primary key default gen_random_uuid(), vehicle_plate text not null, category text, due_date date, status text, created_at timestamptz not null default now());
create table if not exists public.followups (id uuid primary key default gen_random_uuid(), subject text not null, due_date date, status text, created_at timestamptz not null default now());

do $$ declare t text; begin
 foreach t in array array['beneficiaries','vehicles','contracts','installments','maintenance','followups'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('drop policy if exists "admin_only" on public.%I',t);
 execute format('create policy "admin_only" on public.%I for all to authenticated using ((select public.is_portal_admin())) with check ((select public.is_portal_admin()))',t);
 end loop;
end $$;
