#!/usr/bin/env bash
# Native Linux ASan/UBSan of the same SDK C recording owner and raw call sites.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
source "$D/e/env.sh"
mkdir "$D/native-memory"
cd "$D/native-memory"
cc=(clang --target=x86_64-linux-gnu -idirafter "$SDK/usr/include" -idirafter "$SDK/usr/include/x86_64-linux-gnu" -O1 -g -Wall -Wextra -Werror)
set -x
res=$SDK/usr/lib/llvm-19/lib/clang/19/lib/linux
export LD_LIBRARY_PATH=$res:$LIB
"${cc[@]}" -fsanitize=address,undefined -fsanitize-trap=undefined -c "$here/sdk.c" -o sdk.o
"${cc[@]}" -fsanitize=address,undefined -fsanitize-trap=undefined \
    -Drecord_requirements=vkGetImageMemoryRequirements -Drecord_allocate=vkAllocateMemory \
    -Drecord_bind=vkBindImageMemory -Drecord_view=vkCreateImageView -Drecord_free=vkFreeMemory \
    -Drecord_destroy_view=vkDestroyImageView -Drecord_destroy_image=vkDestroyImage \
    -c "$here/recorder.c" -o recorder.o
ld.lld --dynamic-linker /lib64/ld-linux-x86-64.so.2 -Map=asan.map -o record "$LIB/crt1.o" "$LIB/crti.o" \
    recorder.o sdk.o "$PRIOR/evidence/first/linux-plan.o" "$res/libclang_rt.asan-x86_64.so" \
    /lib/x86_64-linux-gnu/libc.so.6 "$LIB/crtn.o"
llvm-objdump -dr sdk.o recorder.o >instrumentation.txt
llvm-readelf -d record >needed
for c in small wide allocate-error clobber bind-error; do
    rc=0
    ASAN_OPTIONS=detect_leaks=1 ./record sdk "$c" >"$c.out" 2>"$c.err" || rc=$?
    echo "$rc" >"$c.exit"
    cmp "$D/memory/sdk-regular/record/$c.row" "$c.out"
    cmp "$D/memory/sdk-regular/record/$c.diagnostic" "$c.err"
    cmp "$D/memory/sdk-regular/record/$c.exit" "$c.exit"
done
