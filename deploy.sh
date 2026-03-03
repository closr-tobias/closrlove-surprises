#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Sync dashboard first
bash sync-surprises.sh

# Deploy
git add -A
git commit -m "New surprise: $(date '+%Y-%m-%d %H:%M')" 2>/dev/null || true
git push origin main

echo "Deployed to https://tobiasfrida.github.io/surprises/"
