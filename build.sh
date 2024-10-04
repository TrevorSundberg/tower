#!/bin/bash
docker run --rm -it --user 1000:1000 -v `pwd`:/src -w /src ghcr.io/webassembly/wasi-sdk ./internal.sh

