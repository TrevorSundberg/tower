#!/usr/bin/env bash
set -euo pipefail
repo="$(cd "$(dirname "$0")" && pwd)"
cache="${TOWER_DOCKER_CACHE:-$HOME/.cache/tower-docker}"
mkdir -p "$cache"
docker build --progress=plain -t tower_build "$repo/docker"
if [ "$#" -eq 0 ]; then set -- bash ./internal.sh; fi
# Preserve checkout paths embedded in the transitional native compiler.
docker run --rm --init --shm-size=1g --user "$(id -u):$(id -g)" \
  -e HOME=/tmp/tower-home -e npm_config_cache=/tmp/tower-home/.cache/npm \
  -e TOWER_BUILD_JOBS="${TOWER_BUILD_JOBS:-2}" \
  -v "$repo:$repo" -v "$cache:/tmp/tower-home/.cache" -w "$repo" \
  tower_build "$@"

