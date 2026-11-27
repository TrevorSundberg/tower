#!/usr/bin/env bash
# The published portable recorder gives each pthread its own device and owner.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
source "$D/e/env.sh"
dir=$D/native-threads
mkdir "$dir"
cd "$dir"
pin=397a659f4e1cfedf9d44dd96eeee61c477f52284
v=scaffolding/library/graphics/vulkan
git init --bare -q inputs.git
git -C inputs.git fetch --depth=1 --no-tags "$TOWER_READER" "$pin"
git -C inputs.git archive "$pin" "$v/osd_checks/"memory_{cases.tower,client.c,driver.c} \
    "$v/"{image_memory.h,image_memory.tower,readback_abi.tower} | tar x
cmp "$v/image_memory.tower" "$here/../../image_memory.tower"
cmp "$v/image_memory.h" "$here/../../image_memory.h"
cc=(clang --target=x86_64-linux-gnu -idirafter "$SDK/usr/include" -idirafter "$SDK/usr/include/x86_64-linux-gnu"
    -fsanitize=thread,undefined -fsanitize-trap=undefined -O1 -g -Wall -Wextra -Werror)
res=$SDK/usr/lib/llvm-19/lib/clang/19/lib/linux
export LD_LIBRARY_PATH=$res:$LIB
set -x
"$CC" --library --jobs 1 "$P/inputs/parallel.tower" -o parallel.o
"$CC" --library --jobs 1 "$v/osd_checks/memory_cases.tower" -o cases.o
llvm-objcopy --redefine-sym main=record_suite cases.o suite.o
opt '-passes=forceattrs,tsan-module,function(tsan)' -force-attribute=sanitize_thread "$D/native-memory/memory.ll" -o provider.bc
llc -filetype=obj -relocation-model=pic provider.bc -o provider.o
for unit in client driver; do "${cc[@]}" -c "$v/osd_checks/memory_$unit.c" -o "$unit.o"; done
ld.lld -Map=thread.map --dynamic-linker /lib64/ld-linux-x86-64.so.2 -o threaded "$LIB/crt1.o" "$LIB/crti.o" \
    parallel.o suite.o client.o driver.o provider.o "$res/libclang_rt.tsan-x86_64.so" "$P/inputs/rt.o" \
    /lib/x86_64-linux-gnu/libgcc_s.so.1 /lib/x86_64-linux-gnu/libc.so.6 "$LIB/crtn.o"
llvm-objdump -dr provider.o >provider.asm
llvm-readelf -d threaded >needed
rg '__tsan_unaligned_write8|__tsan_write8' provider.asm
for attempt in {1..32}; do
    rc=0
    timeout 30 ./threaded >"$attempt.out" 2>"$attempt.err" || rc=$?
    echo "$rc" >"$attempt.exit"
    if ((rc == 0)); then
        test ! -s "$attempt.err" && test "$(rg -c '^return .* ok=1$' "$attempt.out")" = 96 || exit 1
        exit 0
    fi
    rg -q 'ADDR_NO_RANDOMIZE|unexpected memory mapping' "$attempt.err" || exit "$rc"
done
echo 'TSan could not start after 32 attempts; see the individual stderr files' >&2
exit "$rc"
