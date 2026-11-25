#!/bin/sh
set -eu
cd "$(dirname "$0")/../.."
bun run node_modules/vite/bin/vite.js build --config apps/mobile/client/vite.config.ts
