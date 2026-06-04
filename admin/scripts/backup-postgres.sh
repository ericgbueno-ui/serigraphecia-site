#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required"
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-./backups}"
S3_BUCKET="${S3_BACKUP_BUCKET:-}"
TIMESTAMP="$(date -u +%Y%m%d-%H%M%S)"
BACKUP_FILE="multitrip-${TIMESTAMP}.dump"

mkdir -p "$BACKUP_DIR"

echo "Creating PostgreSQL backup..."
pg_dump --format=custom --no-owner --no-privileges --dbname="$DATABASE_URL" --file="$BACKUP_DIR/$BACKUP_FILE"

echo "Backup created at $BACKUP_DIR/$BACKUP_FILE"

if [[ -n "$S3_BUCKET" ]]; then
  echo "Uploading backup to s3://$S3_BUCKET/$BACKUP_FILE"
  aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" "s3://$S3_BUCKET/$BACKUP_FILE"
fi

echo "Backup completed successfully."
