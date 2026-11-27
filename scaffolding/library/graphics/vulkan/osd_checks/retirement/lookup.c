#include <windows.h>
#include <stdio.h>

int main(void) {
    HMODULE dll = LoadLibraryW(L"tower_graphics.dll");
    if (!dll || !GetProcAddress(dll, "tower_vk_bind_image_memory_zero_v1")) return 1;
    FARPROC entry = GetProcAddress(dll, "tower_vk_destroy_retired_image_v1");
    if (!entry) {
        DWORD error = GetLastError();
        printf("missing retirement entry, Win32 error %lu\n", error);
        return error == ERROR_PROC_NOT_FOUND ? 16 : 2;
    }
    return entry == GetProcAddress(dll, MAKEINTRESOURCEA(16)) ? 0 : 3;
}
