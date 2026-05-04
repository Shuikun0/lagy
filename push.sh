#!/usr/bin/env bash
cd "$(dirname "$0")"
exec bash scripts/push-github.sh "$@"
