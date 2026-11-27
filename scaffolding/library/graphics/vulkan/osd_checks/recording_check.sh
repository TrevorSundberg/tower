#!/usr/bin/env bash
# Build the Win64 recording control on Linux x64. Keep each run for inspection.
set -euo pipefail
suite=$1
shift
here=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$here/../../../../.." && pwd)
case "$suite" in
    preflight)
        ordinal=12; rows=28; entry=tower_vk_image_format_preflight_v1; query=vkGetPhysicalDeviceImageFormatProperties
        observers=(osd_observe_query); blocked=() ;;
    allocation)
        ordinal=13; rows=10; entry=tower_vk_plan_image_allocation_v1; query=vkGetImageMemoryRequirements
        observers=(osd_begin_query osd_query_count); blocked=(vkAllocateMemory vkBindImageMemory) ;;
    *) echo "unknown recording suite $suite" >&2; exit 2 ;;
esac
provider= release=
if [[ $# == 3 && $2 == --release ]]; then
    release=$(realpath -e -- "$3")
elif [[ $# == 2 && $2 != --release ]]; then
    provider=$(realpath -e -- "$2")
elif (( $# != 1 )); then
    echo "usage: $0 $suite NEW_OUTPUT_DIRECTORY [PROVIDER.c_OR_obj]" >&2
    echo "       or append --release GRAPHICS_BUILD_DIRECTORY" >&2
    exit 2
fi
: "${MINGW_SYSROOT:?path to the x86_64-w64-mingw32 sysroot}"
: "${MINGW_GCC_LIB:?path to the target directory containing libgcc.a}"
: "${VULKAN_INCLUDE:?path to the parent of vulkan/vulkan.h}"
mkdir -- "$1"
cd -- "$1"
dll=${suite}_provider.dll
implib=provider.lib
client_flags=()
imports() { llvm-readobj --coff-imports "$1" > "$1.imports"; }
if [[ -n $release ]]; then
    dll=tower_graphics.dll
    implib=tower_graphics.lib
    cp -- "$release/$dll" "$release/$implib" .
    sha256sum "$dll" "$implib" > release.sha256
    imports "$dll"
    if [[ $suite == preflight ]]; then
        client_flags=(-I"$here/.." '-DOSD_PREFLIGHT_PROVIDER_HEADER="image_format_preflight.h"')
    fi
fi
(cd "$root/bootstrap/linux-x64" && sha256sum --check --quiet SHA256SUMS)
"$root/bootstrap/linux-x64/towerc" "$here/${suite}_cases.tower" --library --jobs 1 \
    --target x86_64-w64-windows-gnu --foundation "$root/scaffolding/foundation.tower" -o cases.obj

target=(clang --target=x86_64-w64-windows-gnu --sysroot="$MINGW_SYSROOT")
cc=("${target[@]}" -idirafter "$VULKAN_INCLUDE" -std=c11 -O2 -Wall -Wextra -Werror)
link=("${target[@]}" -fuse-ld=lld -L"$MINGW_GCC_LIB" -Wl,--no-insert-timestamp)
for unit in driver record sdk; do
    "${cc[@]}" -c "$here/${suite}_$unit.c" -o "$unit.obj"
done
{ printf 'LIBRARY vulkan-1.dll\nEXPORTS\n'; printf '%s\n' "$query" "${observers[@]}" "${blocked[@]}"; } > loader.def
if [[ -n $release ]]; then
    # Keep the query and forbidden planner calls bound to the recording driver.
    awk -v local_symbols="$query ${blocked[*]}" 'BEGIN {
            n = split(local_symbols, names); for (i = 1; i <= n; i++) reserved[names[i]] = 1
        } $1 == "Name:" { owner = $2 }
        owner == "vulkan-1.dll" && $1 == "Symbol:" && !($2 in reserved) {print $2 "=winevulkan." $2}' \
        "$dll.imports" >> loader.def
fi
"${link[@]}" -shared driver.obj loader.def -Wl,--out-implib,loader.lib,-Map,loader.map -o vulkan-1.dll
"${link[@]}" cases.obj record.obj sdk.obj loader.lib -Wl,-Map,sdk.map -o sdk.exe

# Keep the PE tables and check each symbol under its owning image.
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
for observer in "${observers[@]}"; do require_import sdk.exe vulkan-1.dll "$observer"; done
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
    awk -v rows="$rows" '/^case=.* query=1 .* guards=intact\r?$/ { checked++ }
         END { exit !(NR == rows && checked == NR) }' "$arm.rows" || {
        echo "expected $rows checked rows in $PWD/$arm.rows" >&2; return 1;
    }
}
run_matrix sdk

if [[ -z $release && ( -n $provider || $suite == allocation ) ]]; then
    if [[ -z $provider ]]; then
        # Test-only DLL exposing the SDK control through the agreed C name.
        "${cc[@]}" "-Dosd_check_allocation=$entry" -c "$here/allocation_sdk.c" -o provider.obj
    elif [[ $provider == *.obj ]]; then
        cp -- "$provider" provider.obj
    else
        "${cc[@]}" -c "$provider" -o provider.obj
    fi
    printf 'LIBRARY %s\nEXPORTS\n%s\n' "$dll" "$entry" > provider.def
    "${link[@]}" -shared provider.obj provider.def loader.lib \
        -Wl,--out-implib,provider.lib,-Map,provider.map -o "$dll"
fi
if [[ -n $release || -n $provider || $suite == allocation ]]; then
    "${cc[@]}" "${client_flags[@]}" -c "$here/${suite}_client.c" -o client.obj
    llvm-objdump -dr client.obj > client.asm
    grep -E "IMAGE_REL_AMD64_REL32[[:space:]]+$entry$" client.asm
    "${link[@]}" cases.obj record.obj client.obj "$implib" loader.lib -Wl,-Map,external.map -o external.exe
    llvm-readobj --coff-exports "$dll" > provider.exports
    imports external.exe
    if [[ -n $release ]]; then
        awk -v entry="$entry" -v ordinal="$ordinal" '$1 == "Ordinal:" { ord = $2 }
            $1 == "Name:" && $2 == entry && ord == ordinal { found++ }
            END { exit found != 1 }' provider.exports || {
            echo "expected $dll to export $entry at ordinal $ordinal" >&2; exit 1;
        }
    else
        imports "$dll"
    fi
    require_import external.exe "$dll" "$entry"
    for observer in "${observers[@]}"; do require_import external.exe vulkan-1.dll "$observer"; done
    require_import "$dll" vulkan-1.dll "$query"
    run_matrix external
    cmp sdk.rows external.rows
fi
echo "Passed $rows Win64 recording cases per selected arm. Receipts in $PWD"
