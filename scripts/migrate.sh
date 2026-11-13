#!/usr/bin/env bash
# Aplica las migraciones de supabase/migrations que todavía no se corrieron.
# Usa la misma tabla de control que el CLI de Supabase, así son compatibles.
#   npm run db:migrate            aplica las pendientes
#   npm run db:migrate -- --dry   las prueba en una transacción y la deshace
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -f .env.local ]; then set -a; . ./.env.local; set +a; fi
: "${SUPABASE_DB_URL:?Falta SUPABASE_DB_URL en .env.local}"
DB="${SUPABASE_DB_URL}?sslmode=require"
DRY="${1:-}"

has_table=$(psql "$DB" -X -A -t -c "select to_regclass('supabase_migrations.schema_migrations') is not null")

# La tabla de control se crea dentro de la misma transacción que las migraciones.
args=(-c "
  create schema if not exists supabase_migrations;
  create table if not exists supabase_migrations.schema_migrations (
    version text primary key, statements text[], name text
  );")
pending=0
for f in supabase/migrations/*.sql; do
  base=$(basename "$f" .sql)
  version=${base%%_*}
  name=${base#*_}
  if [ "$has_table" = "t" ] && [ -n "$(psql "$DB" -X -A -t -c "select 1 from supabase_migrations.schema_migrations where version = '$version'")" ]; then
    echo "  = $base (ya aplicada)"
    continue
  fi
  echo "  → $base"
  args+=(-f "$f" -c "insert into supabase_migrations.schema_migrations (version, name) values ('$version', '$name')")
  pending=$((pending + 1))
done

if [ "$pending" -eq 0 ]; then
  echo "No hay migraciones pendientes."
  exit 0
fi

if [ "$DRY" = "--dry" ]; then
  psql "$DB" -X -q -v ON_ERROR_STOP=1 -c "begin" "${args[@]}" -c "rollback" >/dev/null
  echo "Prueba OK: $pending migración(es) corren sin errores (no se aplicó nada)."
else
  psql "$DB" -X -q -v ON_ERROR_STOP=1 --single-transaction "${args[@]}" >/dev/null
  echo "Listo: $pending migración(es) aplicada(s)."
fi
