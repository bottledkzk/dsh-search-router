#!/bin/bash
# Build dsh-search-router:
#   - host bundle (lib/index.js) with tsc
#   - client settings card (lib/client.js) with tsdown
#
# Prefer the repo-local devDependencies (pnpm install). If DSH_CHECKOUT is
# set, use the dsh checkout's tsc/tsdown instead.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TSC="${DSH_CHECKOUT:+$DSH_CHECKOUT/node_modules/.bin/tsc}"
TSDOWN="${DSH_CHECKOUT:+$DSH_CHECKOUT/node_modules/.bin/tsdown}"

if [ -z "$TSC" ] || [ ! -x "$TSC" ]; then
  if [ -x "./node_modules/.bin/tsc" ]; then
    TSC="./node_modules/.bin/tsc"
  elif command -v npx >/dev/null 2>&1; then
    TSC="npx tsc"
  fi
fi

if [ -z "$TSDOWN" ] || [ ! -x "$TSDOWN" ]; then
  if [ -x "./node_modules/.bin/tsdown" ]; then
    TSDOWN="./node_modules/.bin/tsdown"
  elif command -v npx >/dev/null 2>&1; then
    TSDOWN="npx tsdown"
  fi
fi

if [ -z "$TSC" ]; then
  echo "build: tsc not found; run pnpm install or set DSH_CHECKOUT" >&2
  exit 1
fi
if [ -z "$TSDOWN" ]; then
  echo "build: tsdown not found; run pnpm install or set DSH_CHECKOUT" >&2
  exit 1
fi

echo "=== Compiling host src -> lib ($TSC) ==="
$TSC -p tsconfig.json

echo "=== Building client settings card ($TSDOWN) ==="
$TSDOWN --config tsdown.config.mjs

ls -la lib/index.js lib/client.js 2>/dev/null
