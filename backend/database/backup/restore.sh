#!/bin/bash
set -e

# Restore script for Veyora / Panga Pangisha PostgreSQL databases
# Usage:
#   ./restore.sh
# or from root:
#   ./backend/database/backup/restore.sh

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_CONTAINER="${DB_CONTAINER:-backend-db-1}"
DB_USER="${POSTGRES_USER:-panga}"

echo "==> Restoring 'panga_pangisha' database..."
docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d panga_pangisha < "$DIR/panga_pangisha.sql"

echo "==> Restoring 'realtime_chat_db' database..."
docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d realtime_chat_db < "$DIR/realtime_chat_db.sql"

echo "==> Databases successfully restored!"
