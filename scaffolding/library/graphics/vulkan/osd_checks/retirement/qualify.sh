#!/usr/bin/env bash
# Reuse sealed inputs in a new directory, including a private Wine prefix.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
src=$(cd "$here/../../../../../.." && pwd)
if (( $# != 1 )); then echo "usage: $0 NEW_OUTPUT_DIRECTORY" >&2; exit 2; fi
sdk=$(realpath -e "${PREPARED_SDK:?Linux LLVM19 + MinGW x64 + Wine 8 SDK}")
packet=$(realpath -e "${ORDINAL15_PACKET:?sealed b805c1a9 archive}")
export D
D=$(realpath -m "$1")
mkdir "$D"
mkdir -p "$D"/{p15,p13,e,results/standalone}
ln -s "$sdk" "$D/sdk"
ln -s "$src" "$D/src"
cd "$D"
echo "c155b239d1a7eae47b6f1a500ced6845c5b0d73edd31779e203a712c4813c090  $packet" | sha256sum -c -
tar xf "$packet" -C p15
(cd p15 && sha256sum --quiet -c SHA256SUMS)
echo '3d38e8877a39da809658ce7274f050fa8e24ca05ea9e2ef7e583cce209dfbcfc  p15/inputs/ordinal13.tar.gz' | sha256sum -c -
tar xf p15/inputs/ordinal13.tar.gz -C p13
(cd p13 && sha256sum --quiet -c SHA256SUMS)
cp p15/dll/e/{env,package-env,session}.sh e/
source "$D/e/env.sh"
cd "$D/results"
(cd "$S/bootstrap/linux-x64" && sha256sum --quiet -c SHA256SUMS)
"$CC" --library --jobs 1 --foundation "$S/scaffolding/foundation.tower" "$V/image_retirement.tower" --target x86_64-w64-windows-gnu -o standalone/retired.obj
echo 'bf3fa4e119e7a71469f1e6eb6739e63a88f147b516fd27adda2541efaf0d8b57  standalone/retired.obj' | sha256sum -c -
phase() {
    local name=$1 rc=0; shift
    "$@" >"$name.log" 2>&1 || rc=$?
    echo "$rc" >"$name.exit"
    if (( rc )); then tail -40 "$name.log" >&2; echo "Failed $name, see $PWD" >&2; exit "$rc"; fi
}
phase release-build bash -x "$V/build_graphics_dll.sh" "$PWD/release"
phase build bash "$here/build.sh"
phase controls bash "$here/controls.sh"
phase wine bash "$D/e/session.sh" "$here/run.sh"
phase native bash "$here/native.sh"
find . -type f \( -name '*.exe' -o -name '*.dll' -o -name '*.lib' -o -name '*.obj' \) -print0 | sort -z | xargs -0 sha256sum >products.sha256
echo "Results in $PWD"
