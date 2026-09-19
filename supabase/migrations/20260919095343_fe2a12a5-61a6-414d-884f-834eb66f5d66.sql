create type public.app_role as enum ('admin', 'coach');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  -- first ever user becomes admin, everyone after becomes coach
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'coach');
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age_category text not null default '',
  coach_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.groups to authenticated;
grant all on public.groups to service_role;
alter table public.groups enable row level security;

create table public.players (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  birth_date date,
  guardian_name text not null default '',
  guardian_phone text not null default '',
  group_id uuid references public.groups(id) on delete set null,
  status text not null default 'active',
  joined_at date not null default current_date,
  notes text not null default '',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.players to authenticated;
grant all on public.players to service_role;
alter table public.players enable row level security;

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  session_date date not null,
  start_time time not null default '17:00',
  location text not null default '',
  notes text not null default '',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.sessions to authenticated;
grant all on public.sessions to service_role;
alter table public.sessions enable row level security;

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  status text not null default 'present',
  created_at timestamptz not null default now(),
  unique (session_id, player_id)
);
grant select, insert, update, delete on public.attendance to authenticated;
grant all on public.attendance to service_role;
alter table public.attendance enable row level security;

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  amount numeric(10,2) not null,
  month text not null,
  status text not null default 'pending',
  paid_at date,
  notes text not null default '',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.payments to authenticated;
grant all on public.payments to service_role;
alter table public.payments enable row level security;

-- RLS policies

create policy "Users read own profile" on public.profiles
  for select to authenticated
  using (auth.uid() = id or public.has_role(auth.uid(), 'admin'));
create policy "Users update own profile" on public.profiles
  for update to authenticated
  using (auth.uid() = id);

create policy "Users read own roles" on public.user_roles
  for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create policy "Staff read groups" on public.groups
  for select to authenticated using (true);
create policy "Admins manage groups" on public.groups
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Staff read players" on public.players
  for select to authenticated using (true);
create policy "Admins manage players" on public.players
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Staff read sessions" on public.sessions
  for select to authenticated using (true);
create policy "Admins manage sessions" on public.sessions
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "Coaches manage own group sessions" on public.sessions
  for all to authenticated
  using (exists (select 1 from public.groups g where g.id = sessions.group_id and g.coach_id = auth.uid()))
  with check (exists (select 1 from public.groups g where g.id = sessions.group_id and g.coach_id = auth.uid()));

create policy "Staff read attendance" on public.attendance
  for select to authenticated using (true);
create policy "Admins manage attendance" on public.attendance
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "Coaches manage own group attendance" on public.attendance
  for all to authenticated
  using (exists (
    select 1 from public.sessions s join public.groups g on g.id = s.group_id
    where s.id = attendance.session_id and g.coach_id = auth.uid()))
  with check (exists (
    select 1 from public.sessions s join public.groups g on g.id = s.group_id
    where s.id = attendance.session_id and g.coach_id = auth.uid()));

create policy "Staff read payments" on public.payments
  for select to authenticated using (true);
create policy "Admins manage payments" on public.payments
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));