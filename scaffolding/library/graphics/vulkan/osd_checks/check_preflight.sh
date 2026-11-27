#!/usr/bin/env bash
# Build the Win64 recording control on Linux x64. Keep each run for inspection.
set -euo pipefail
if (( $# < 1 || $# > 2 )); then
    echo "usage: $0 NEW_OUTPUT_DIRECTORY [EXTERNAL_PROVIDER.c]" >&2
    exit 2
fi
: "${MINGW_SYSROOT:?path to the x86_64-w64-mingw32 sysroot}"
: "${MINGW_GCC_LIB:?path to the target directory containing libgcc.a}"
: "${VULKAN_INCLUDE:?path to the parent of vulkan/vulkan.h}"
here=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$here/../../../../.." && pwd)
provider=
if (( $# == 2 )); then provider=$(realpath -e -- "$2"); fi
mkdir -- "$1"
cd -- "$1"
(cd "$root/bootstrap/linux-x64" && sha256sum --check --quiet SHA256SUMS)
"$root/bootstrap/linux-x64/towerc" "$here/preflight_cases.tower" --library --jobs 1 \
    --target x86_64-w64-windows-gnu --foundation "$root/scaffolding/foundation.tower" -o cases.obj

target=(clang --target=x86_64-w64-windows-gnu --sysroot="$MINGW_SYSROOT")
cc=("${target[@]}" -idirafter "$VULKAN_INCLUDE" -std=c11 -O2 -Wall -Wextra -Werror)
link=("${target[@]}" -fuse-ld=lld -L"$MINGW_GCC_LIB" -Wl,--no-insert-timestamp)
query=vkGetPhysicalDeviceImageFormatProperties
entry=tower_vk_image_format_preflight_v1
for unit in driver record sdk; do
    "${cc[@]}" -c "$here/preflight_$unit.c" -o "$unit.obj"
done
printf 'LIBRARY vulkan-1.dll\nEXPORTS\n%s\n%s\n' "$query" osd_observe_query > loader.def
"${link[@]}" -shared driver.obj loader.def -Wl,--out-implib,loader.lib,-Map,loader.map -o vulkan-1.dll
"${link[@]}" cases.obj record.obj sdk.obj loader.lib -Wl,-Map,sdk.map -o sdk.exe

# Keep the PE tables and check each symbol under its owning image.
imports() { llvm-readobj --coff-imports "$1" > "$1.imports"; }
require_import() {
    awk -v owner="$2" -v symbol="$3" '
        /^Import \{/ { dll = "" }
        $1 == "Name:" { dll = $2 }
        dll == owner && $1 == "Symbol:" && $2 == symbol { found++ }
        END { exit found != 1 }
    ' "$1.imports" || { echo "expected $1 to import $3 once from $2" >&2; return 1; }
}
imports sdk.exe
require_import sdk.exe vulkan-1.dll "$query"
require_import sdk.exe vulkan-1.dll osd_observe_query
llvm-readobj --coff-exports vulkan-1.dll > loader.exports

run_matrix() {
    local arm=$1 status=0
    WINEDLLOVERRIDES="vulkan-1=n" WINEDEBUG=+loaddll "${WINE64:-wine64}" "./$arm.exe" \
        > "$arm.rows" 2> "$arm.wine.log" || status=$?
    echo "$status" > "$arm.exit"
    if (( status != 0 )); then
        echo "$arm.exe exited $status (see $PWD/$arm.wine.log)" >&2
        return "$status"
    fi
    awk '/^case=.* query=1 .* guards=intact\r?$/ { checked++ }
         END { exit !(NR == 28 && checked == NR) }' "$arm.rows" || {
        echo "expected 28 checked rows in $PWD/$arm.rows" >&2; return 1;
    }
}
run_matrix sdk

if [[ -n $provider ]]; then
    # Consumer-supplied C translation unit; import it through a distinct test DLL.
    "${cc[@]}" -c "$provider" -o provider.obj
    printf 'LIBRARY preflight_provider.dll\nEXPORTS\n%s\n' "$entry" > provider.def
    "${link[@]}" -shared provider.obj provider.def loader.lib \
        -Wl,--out-implib,provider.lib,-Map,provider.map -o preflight_provider.dll
    "${cc[@]}" -c "$here/preflight_client.c" -o client.obj
    "${link[@]}" cases.obj record.obj client.obj provider.lib loader.lib -Wl,-Map,external.map -o external.exe
    llvm-readobj --coff-exports preflight_provider.dll > provider.exports
    imports external.exe
    imports preflight_provider.dll
    require_import external.exe preflight_provider.dll "$entry"
    require_import external.exe vulkan-1.dll osd_observe_query
    require_import preflight_provider.dll vulkan-1.dll "$query"
    run_matrix external
    cmp sdk.rows external.rows
fi
echo "Passed 28 Win64 recording cases per selected arm. Receipts in $PWD"
