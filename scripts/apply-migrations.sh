#!/usr/bin/env bash
# Apply pending database migrations to TiDB Cloud (reads credentials from .env).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "❌ .env not found at $ROOT/.env"
  exit 1
fi

# Last assignment wins so a cleaned .env with TiDB after any leftover Hostgator block is safe.
env_last() {
  local key="$1"
  grep "^${key}=" .env | tail -n 1 | cut -d'=' -f2- | sed 's/^"//; s/"$//'
}

DB_PASS=$(env_last DB_PASSWORD)
DB_HOST=$(env_last DB_HOST)
DB_PORT=$(env_last DB_PORT)
DB_USER=$(env_last DB_USER)
DB_NAME=$(env_last DB_NAME)

if [[ -z "$DB_HOST" || -z "$DB_USER" || -z "$DB_NAME" ]]; then
  echo "❌ Missing DB_HOST / DB_USER / DB_NAME in .env"
  exit 1
fi

MYSQL=(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME"
  --ssl-mode=REQUIRED --protocol=TCP)

echo "🔍 Connecting to ${DB_HOST}:${DB_PORT} / ${DB_NAME} ..."
"${MYSQL[@]}" -e "SELECT DATABASE() AS db, COUNT(*) AS table_count FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE();"

shopt -s nullglob
files=(database/migrations/*.sql)
if [[ ${#files[@]} -eq 0 ]]; then
  echo "ℹ️  No files in database/migrations/"
  exit 0
fi

for file in "${files[@]}"; do
  echo ""
  echo "▶ Applying $(basename "$file") ..."
  if "${MYSQL[@]}" < "$file"; then
    echo "✅ $(basename "$file")"
  else
    echo "❌ $(basename "$file") failed — aborting to avoid schema drift."
    exit 1
  fi
done

echo ""
echo "🎉 Migrations applied."
