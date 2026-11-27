#!/usr/bin/env bash
# Rebuild only the retained planner fixture, then build and run its new callers.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
packet=$(realpath -e "${ORDINAL13_PACKET:?84bd5154-65b1-4ee8-bc56-c709b6a487a8.tar.gz}")
sdk=$(realpath -e "${PREPARED_SDK:?Linux LLVM19/MinGW x64/Wine 8 SDK root}")
reader=${TOWER_READER:?authorized Tower reader containing a2b0899a}
echo "3d38e8877a39da809658ce7274f050fa8e24ca05ea9e2ef7e583cce209dfbcfc  $packet" | sha256sum --check -
export D=$(mktemp -d "${TMPDIR:-/tmp}/tower-image-memory.XXXXXXXX")
echo "results $D"
export PRIOR=$D/prior P=$D/prior/control
mkdir -p "$PRIOR" "$D/e/bin" "$D/release"
ln -s "$sdk" "$D/sdk"
tar -xzf "$packet" -C "$PRIOR"
(cd "$PRIOR" && sha256sum --quiet -c SHA256SUMS)
git init -q -b main "$D/src"
git -C "$D/src" fetch -q --no-tags --depth=1 "$reader" "$(cat "$PRIOR/base")"
git -C "$D/src" bundle verify "$PRIOR/source.bundle"
git -C "$D/src" fetch -q "$PRIOR/source.bundle" refs/heads/rendering/win64-image-allocation-84bd5154
git -C "$D/src" checkout -q --detach FETCH_HEAD
test "$(git -C "$D/src" rev-parse HEAD)" = 61ebea411f92bc8e750181aaa543aca42a955818
cp "$PRIOR/scripts/"{env,session,package-env}.sh "$D/e/"
cp "$PRIOR/evidence/release/"tower_graphics.{lib,dll} "$D/release/"
(cd "$D/release" && rg 'tower_graphics\.(dll|lib)$' "$PRIOR/scripts/release.sha256" | sha256sum --check -)
phase() {
    local name=$1 rc=0; shift
    bash "$@" >"$D/e/$name.phase" 2>&1 || rc=$?
    echo "$rc" >"$D/e/$name.exit"
    if ((rc)); then tail -35 "$D/e/$name.phase" >&2; echo "Failed $name. See $D" >&2; exit "$rc"; fi
}
phase fixture "$PRIOR/scripts/build_hardware.sh"
phase build "$here/build.sh"
phase wine "$D/e/session.sh" "$here/check.sh"
phase native "$here/native.sh"
test -z "$(git -C "$D/src" status --porcelain)"
echo "Completed. Results in $D"
