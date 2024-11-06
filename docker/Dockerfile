FROM ghcr.io/webassembly/wasi-sdk:sha-3866d29

RUN apt-get update && apt-get install -y \
    ccache \
    clang \
    git \
    gnupg2 \
    python3 \
    software-properties-common \
    wget

ENV CCACHE_COMPRESS=1
ENV CCACHE_COMPRESSLEVEL=9
ENV CCACHE_DIR=/src/cache/
ENV CCACHE_SLOPPINESS=pch_defines,time_macros,random_seed,system_headers

