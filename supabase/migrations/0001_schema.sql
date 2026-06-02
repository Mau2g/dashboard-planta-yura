-- Masters
create table tipo_cemento (
  id            bigint generated always as identity primary key,
  nombre        text not null unique,
  familia       text not null default 'OTRO',
  presentacion  text not null default 'bolsa42.5',
  peso_kg       numeric,
  activo        boolean not null default true,
  orden         int not null default 0
);

create table maquina (
  id          text primary key,         -- H1..H5, V
  nombre      text not null,
  ratio_ideal int not null
);

create table temporal (
  id        bigint generated always as identity primary key,
  nombre    text not null unique,
  capacidad numeric not null
);

-- Parte diario (cabecera)
create table parte_diario (
  id                bigint generated always as identity primary key,
  fecha             date not null unique,
  veh_llamado       int not null default 0,
  veh_proceso       int not null default 0,
  veh_playa         int not null default 0,
  acumulado_ajuste  numeric not null default 0,
  comentario        text not null default '',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Líneas operativas / comerciales
create table despacho (
  id        bigint generated always as identity primary key,
  parte_id  bigint not null references parte_diario(id) on delete cascade,
  tipo_id   bigint not null references tipo_cemento(id),
  bolsas    numeric not null default 0,
  tm        numeric not null default 0,
  unique (parte_id, tipo_id)
);

create table venta_diaria (
  parte_id        bigint primary key references parte_diario(id) on delete cascade,
  nacional_tm     numeric not null default 0,
  export_tm       numeric not null default 0,
  a_construir_tm  numeric not null default 0
);

create table maquina_registro (
  parte_id        bigint not null references parte_diario(id) on delete cascade,
  maquina_id      text not null references maquina(id),
  horas_maquina   numeric not null default 0,
  ratio_ecs       int not null default 0,
  operativos      int not null default 0,
  comentario      text not null default '',
  averia_critica  text not null default 'verde',
  primary key (parte_id, maquina_id)
);

create table temporal_registro (
  parte_id     bigint not null references parte_diario(id) on delete cascade,
  temporal_id  bigint not null references temporal(id),
  inventario   numeric not null default 0,
  primary key (parte_id, temporal_id)
);

create table compuerta_registro (
  parte_id   bigint not null references parte_diario(id) on delete cascade,
  numero     int not null,
  horas      numeric not null default 0,
  comentario text not null default '',
  primary key (parte_id, numero)
);

-- Planes
create table plan_semanal (
  dia text primary key,  -- Lunes..Domingo
  tm  numeric not null default 0
);

create table plan_especial (
  fecha date primary key,
  tm    numeric not null default 0
);

create table plan_anual (
  anio          int primary key,
  plan_mensual  numeric not null default 0,
  plan_anual    numeric not null default 0
);

create table plan_ventas_familia (
  anio    int not null,
  mes     int not null check (mes between 1 and 12),
  familia text not null,
  tm      numeric not null default 0,
  primary key (anio, mes, familia)
);

-- Histórico de despacho mensual (años sin captura en vivo)
create table resumen_mensual_historico (
  anio        int not null,
  mes         int not null check (mes between 1 and 12),
  despacho_tm numeric not null,
  primary key (anio, mes)
);

-- updated_at trigger
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger trg_parte_updated
  before update on parte_diario
  for each row execute function set_updated_at();

-- RLS permisiva (sin auth, paridad con la Vista A abierta). DEUDA DE SEGURIDAD conocida.
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security;', t);
    execute format($p$create policy "anon_all_%1$s" on public.%1$I for all to anon using (true) with check (true);$p$, t);
  end loop;
end $$;
