#!/usr/bin/env bash
set -euo pipefail

# Windows / macOS / Linux: логика в scripts/infra-prepare.cjs
root="$(cd "$(dirname "$0")/.." && pwd)"
exec node "$root/scripts/infra-prepare.cjs" "$@"
