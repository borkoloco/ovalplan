-- OvalPlan · esquema inicial: perfiles y biblioteca de ejercicios.
-- Los datos de usuario se limitan al mail (en auth.users) y un nombre opcional.

-- ── Perfiles ─────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: cada uno ve el suyo"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles: cada uno edita el suyo"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Nadie puede hacerse admin a sí mismo: sólo se puede editar el nombre.
revoke update on public.profiles from authenticated, anon;
grant update (display_name) on public.profiles to authenticated;

-- Crear el perfil automáticamente al registrarse.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ── Ejercicios ───────────────────────────────────────────────────
create type public.exercise_status as enum ('pending', 'approved', 'rejected');

create table public.exercises (
  -- texto para mantener los ids actuales ('ball-tag', …) que usan las sesiones guardadas
  id text primary key default gen_random_uuid()::text,
  name jsonb not null check (name ? 'es'),          -- { "es": "...", "en": "..." }
  summary jsonb not null check (summary ? 'es'),
  steps jsonb not null default '[]' check (jsonb_typeof(steps) = 'array'),
  kind text not null check (kind in ('drill', 'game')),
  fits text[] not null check (
    cardinality(fits) > 0 and fits <@ array['warmup', 'technique', 'game', 'cooldown']
  ),
  topics text[] not null default '{}' check (
    topics <@ array['passing', 'evasion', 'tackle', 'ruck', 'lineout', 'scrum', 'defense', 'attack', 'kicking']
  ),
  min_age int not null check (min_age between 4 and 20),
  min_players int not null check (min_players between 1 and 60),
  duration int not null check (duration between 3 and 60),
  equipment text[] not null default '{}' check (
    equipment <@ array['balls', 'cones', 'bibs', 'shields', 'tackleBags']
  ),
  contact text not null check (contact in ('none', 'tag', 'controlled', 'full')),
  video_url text check (video_url ~ '^https://'),
  status public.exercise_status not null default 'pending',
  review_note text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index exercises_status_idx on public.exercises (status);
create index exercises_created_by_idx on public.exercises (created_by);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger exercises_updated_at
  before update on public.exercises
  for each row execute function public.set_updated_at();

alter table public.exercises enable row level security;

-- Ver: los aprobados los ve cualquiera (también sin login); los propios y,
-- si sos admin, todos.
create policy "exercises: ver"
  on public.exercises for select to anon, authenticated
  using (
    status = 'approved'
    or created_by = (select auth.uid())
    or (select public.is_admin())
  );

-- Crear: siempre como propio y pendiente de revisión (el admin, como quiera).
create policy "exercises: crear"
  on public.exercises for insert to authenticated
  with check (
    (select public.is_admin())
    or (created_by = (select auth.uid()) and status = 'pending')
  );

-- Editar: el autor sólo mientras no esté aprobado, y vuelve a quedar pendiente.
create policy "exercises: editar"
  on public.exercises for update to authenticated
  using (
    (select public.is_admin())
    or (created_by = (select auth.uid()) and status <> 'approved')
  )
  with check (
    (select public.is_admin())
    or (created_by = (select auth.uid()) and status = 'pending')
  );

create policy "exercises: borrar"
  on public.exercises for delete to authenticated
  using (
    (select public.is_admin())
    or (created_by = (select auth.uid()) and status <> 'approved')
  );
