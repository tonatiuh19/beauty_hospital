#!/usr/bin/env bash
# Bootstrap TiDB from database/schema.sql (phpMyAdmin dump).
# TiDB cannot ALTER a column onto AUTO_INCREMENT after create, so we rewrite first.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "❌ .env not found"
  exit 1
fi

env_last() {
  local key="$1"
  grep "^${key}=" .env | tail -n 1 | cut -d'=' -f2- | sed 's/^"//; s/"$//'
}

DB_PASS=$(env_last DB_PASSWORD)
DB_HOST=$(env_last DB_HOST)
DB_PORT=$(env_last DB_PORT)
DB_USER=$(env_last DB_USER)
DB_NAME=$(env_last DB_NAME)
OUT="/tmp/beauty_hospital_schema_tidb.sql"

node scripts/transform-schema-tidb.mjs database/schema.sql "$OUT"

echo "▶ Applying transformed schema.sql to ${DB_NAME} ..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
  --ssl-mode=REQUIRED --protocol=TCP \
  < "$OUT"
echo "✅ schema applied"
