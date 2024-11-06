#!/bin/bash
set -ex
docker buildx build --progress=plain -t tower_build ./docker
docker run --rm -it --user 1000:1000 -v `pwd`:/src -w /src tower_build ./internal.sh

