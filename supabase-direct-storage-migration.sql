-- Run this once in Supabase SQL Editor.
-- It keeps your existing tables and adds numeric app IDs used by WildSpeed MotorsOS.

alter table public.cars
  add column if not exists app_id bigint,
  add column if not exists investor_app_id bigint,
  add column if not exists timeline jsonb not null default '[]'::jsonb;

alter table public.expenses
  add column if not exists app_id bigint,
  add column if not exists car_app_id bigint;

alter table public.investors
  add column if not exists app_id bigint;

alter table public.capital_transactions
  add column if not exists app_id bigint,
  add column if not exists investor_app_id bigint;

create unique index if not exists cars_user_app_id_unique
  on public.cars(user_id, app_id);

create unique index if not exists expenses_user_app_id_unique
  on public.expenses(user_id, app_id);

create unique index if not exists investors_user_app_id_unique
  on public.investors(user_id, app_id);

create unique index if not exists capital_transactions_user_app_id_unique
  on public.capital_transactions(user_id, app_id);

create index if not exists cars_investor_app_id_idx
  on public.cars(user_id, investor_app_id);

create index if not exists expenses_car_app_id_idx
  on public.expenses(user_id, car_app_id);

create index if not exists capital_transactions_investor_app_id_idx
  on public.capital_transactions(user_id, investor_app_id);

-- The app now links records with numeric app IDs. Keep the old UUID link
-- columns for compatibility, but allow them to be empty.
alter table public.expenses
  alter column car_id drop not null;

alter table public.capital_transactions
  alter column investor_id drop not null;
