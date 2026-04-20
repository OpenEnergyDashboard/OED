#!/bin/bash

printf "\n\n***** Starting install of OED at $(date) *****\n\n"

# ----------------------------------------------------
# Prevent Node OOM (safe baseline)
# ----------------------------------------------------
export NODE_OPTIONS="--max-old-space-size=4096"

USAGE="Usage: $0 [--production] [--nostart] [--keep_node_modules] [--skip_db_initialize]"

production=no
dostart=yes
keep_node_modules=no
skip_db_initialize=no

usernameTest="test"
usernameTestEmail="test@example.com"

# ----------------------------------------------------
# Args
# ----------------------------------------------------
while test $# -gt 0; do
  case "$1" in
    --production) production=yes ;;
    --nostart) dostart=no ;;
    --keep_node_modules) keep_node_modules=yes ;;
    --skip_db_initialize) skip_db_initialize=yes ;;
    *) echo "Unknown argument: $1"; echo "$USAGE"; exit 1 ;;
  esac
  shift
done

# ----------------------------------------------------
# Load env
# ----------------------------------------------------
[ -f ".env" ] && source .env

# ----------------------------------------------------
# NPM install
# ----------------------------------------------------
if [ "$keep_node_modules" = "yes" ]; then
  echo "Skipping npm install"
else
  echo "Running npm ci..."
  npm ci --loglevel=warn || {
    echo "npm ci failed"
    exit 2
  }
fi

# ----------------------------------------------------
# DB initialization (NO RETRY LOOP)
# ----------------------------------------------------
if [ "$skip_db_initialize" != "yes" ]; then

  echo "Running database creation..."

  set +e
  npm run createdb 2>&1 | tee /tmp/oed.error
  createdb_code=${PIPESTATUS[0]}
  set -e

  echo ""
  echo "----- DB OUTPUT -----"
  cat /tmp/oed.error
  echo "---------------------"

  # detect OOM explicitly
  if grep -q "heap out of memory" /tmp/oed.error; then
    echo "Node heap OOM detected"
    echo "Fix required: circular dependency in models/db layer"
    exit 3
  fi

  # detect connection issues
  if grep -q "ECONNREFUSED" /tmp/oed.error; then
    echo "DB not ready (connection refused)"
    exit 4
  fi

  # fail fast (NO RETRY)
  if [ $createdb_code -ne 0 ]; then
    echo "Database creation failed"
    exit 5
  fi

  echo "Database initialized successfully"

  # ----------------------------------------------------
  # Create dev users only if DB succeeded
  # ----------------------------------------------------
  if [ "$production" = "no" ] && [ "$OED_PRODUCTION" != "yes" ]; then
    npm run createUser -- $usernameTest password || true
    npm run createUser -- $usernameTestEmail password || true
    npm run developerdb || true
  fi
fi

# ----------------------------------------------------
# Build frontend
# ----------------------------------------------------
if [ "$production" = "yes" ] || [ "$OED_PRODUCTION" = "yes" ]; then
  npm run webpack:build
elif [ "$dostart" = "no" ]; then
  npm run webpack
fi

echo "OED install finished"

# ----------------------------------------------------
# Start server
# ----------------------------------------------------
if [ "$dostart" = "yes" ]; then
  if [ "$production" = "yes" ] || [ "$OED_PRODUCTION" = "yes" ]; then
    npm run start
  else
    ./src/scripts/devstart.sh
  fi
fi