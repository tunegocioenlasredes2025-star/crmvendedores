-- ============================================================
-- CRM Tu Negocio En Las Redes — Base de datos Supabase
-- (Versión SIN login: se entra directo, datos compartidos)
-- Pegá TODO esto en: Supabase -> SQL Editor -> New query -> Run
-- ============================================================

-- ---------- PERFILES (vendedores / admin) ----------
create table if not exists public.profiles (
  id         uuid primary key default gen_random_uuid(),
  email      text,
  full_name  text not null,
  role       text not null default 'vendedor' check (role in ('admin','vendedor')),
  created_at timestamptz default now()
);

-- Carga inicial del equipo (se puede editar después)
insert into public.profiles (full_name, role, email) values
  ('Administrador',     'admin',    'admin@tunegocio.com'),
  ('Bautista Rega',     'vendedor', 'bautista@tunegocio.com'),
  ('Mateo Ojeda',       'vendedor', 'mateo@tunegocio.com'),
  ('Joaquin Siffredi',  'vendedor', 'joaquin@tunegocio.com')
on conflict do nothing;

-- ---------- LEADS ----------
create table if not exists public.leads (
  id                    uuid primary key default gen_random_uuid(),
  nombre                text not null,
  apellido              text not null,
  empresa               text,
  instagram             text,
  facebook              text,
  sitio_web             text,
  whatsapp              text,
  email                 text,
  rubro                 text,
  ciudad                text,
  provincia             text,
  observaciones         text,
  fecha_carga           timestamptz default now(),
  fecha_ultimo_contacto timestamptz,
  vendedor_id           uuid references public.profiles(id) on delete set null,
  estado                text not null default 'lead_nuevo',
  metodo_contacto       text,
  producto_ofrecido     text,
  monto_presupuestado   numeric(12,2),
  probabilidad_cierre   int,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- ---------- ACTIVIDADES (timeline) ----------
create table if not exists public.activities (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.leads(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete set null,
  tipo        text default 'general',
  descripcion text not null,
  created_at  timestamptz default now()
);

-- ---------- NOTAS ----------
create table if not exists public.notes (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references public.leads(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete set null,
  contenido  text not null,
  privada    boolean default false,
  created_at timestamptz default now()
);

-- ---------- TAREAS ----------
create table if not exists public.tasks (
  id                uuid primary key default gen_random_uuid(),
  lead_id           uuid references public.leads(id) on delete cascade,
  user_id           uuid references public.profiles(id) on delete set null,
  titulo            text not null,
  descripcion       text,
  fecha_vencimiento date,
  hora              time,
  prioridad         text default 'media',
  completada        boolean default false,
  created_at        timestamptz default now()
);

-- ---------- VENTAS ----------
create table if not exists public.sales (
  id              uuid primary key default gen_random_uuid(),
  lead_id         uuid references public.leads(id) on delete set null,
  vendedor_id     uuid references public.profiles(id) on delete set null,
  producto        text not null,
  monto           numeric(12,2) not null,
  comision        numeric(12,2) not null,
  estado_comision text default 'pendiente',
  fecha_venta     date not null default current_date,
  created_at      timestamptz default now()
);

-- ============================================================
-- ACCESO (sin login): se permite acceso con la anon key.
-- La app es privada: solo quien tenga la URL de Vercel entra.
-- ============================================================
alter table public.profiles   enable row level security;
alter table public.leads      enable row level security;
alter table public.activities enable row level security;
alter table public.notes      enable row level security;
alter table public.tasks      enable row level security;
alter table public.sales      enable row level security;

-- Políticas: lectura y escritura para anon + authenticated
do $$
declare t text;
begin
  foreach t in array array['profiles','leads','activities','notes','tasks','sales'] loop
    execute format('drop policy if exists "%s_all" on public.%I;', t, t);
    execute format('create policy "%s_all" on public.%I for all to anon, authenticated using (true) with check (true);', t, t);
  end loop;
end $$;

-- ============================================================
-- TIEMPO REAL (cambios al instante entre vendedores)
-- ============================================================
alter publication supabase_realtime add table public.leads;
alter publication supabase_realtime add table public.sales;
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.activities;
alter publication supabase_realtime add table public.notes;

-- ============================================================
-- ÍNDICES
-- ============================================================
create index if not exists idx_leads_estado   on public.leads(estado);
create index if not exists idx_leads_vendedor  on public.leads(vendedor_id);
create index if not exists idx_activities_lead on public.activities(lead_id);
create index if not exists idx_tasks_user      on public.tasks(user_id);
create index if not exists idx_sales_vendedor  on public.sales(vendedor_id);

-- ============================================================
-- LISTO. No hay que crear usuarios ni contraseñas.
-- Copiá la URL y la anon key (Project Settings > API) a config.js
-- ============================================================
