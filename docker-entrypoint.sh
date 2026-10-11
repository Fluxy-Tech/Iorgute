#!/bin/sh
set -e

if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "▶ Aplicando migrations do banco..."
  (cd /app/migrate && node node_modules/prisma/build/index.js migrate deploy)
fi

exec "$@"
