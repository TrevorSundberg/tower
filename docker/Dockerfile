FROM node:22-bookworm-slim AS node
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates clang-19 cmake curl git libclang-rt-19-dev lld-19 \
    llvm-19-dev ninja-build python3 qemu-user xz-utils \
    && rm -rf /var/lib/apt/lists/*
COPY --from=node /usr/local/ /usr/local/
RUN npx --yes playwright@1.65.1 install-deps chromium \
    && rm -rf /var/lib/apt/lists/* /root/.npm
ENV PATH="/usr/lib/llvm-19/bin:${PATH}"

