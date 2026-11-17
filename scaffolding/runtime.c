// Minimal raw-memory runtime. Allocation metadata is not pointer safety metadata.
#include <stddef.h>
#include <stdint.h>

#if defined(__wasm__)
extern unsigned char __heap_base;
typedef struct Block { size_t size; struct Block* next; size_t reserved[2]; } Block;
static Block* available;
static uintptr_t cursor;
void* malloc(size_t n) {
  if (n > SIZE_MAX - 31) return 0;
  n = (n + 15) & ~(size_t)15; if (!n) n = 16;
  Block** link = &available;
  while (*link) {
    Block* block = *link;
    if (block->size >= n) {
      if (block->size >= n + sizeof(Block) + 16) {
        Block* remainder = (Block*)((unsigned char*)(block + 1) + n);
        remainder->size = block->size - n - sizeof(Block); remainder->next = block->next; *link = remainder; block->size = n;
      } else *link = block->next;
      return block + 1;
    }
    link = &block->next;
  }
  if (!cursor) cursor = ((uintptr_t)&__heap_base + 15) & ~(uintptr_t)15;
  if (n > SIZE_MAX - sizeof(Block) - cursor) return 0;
  uintptr_t end = cursor + sizeof(Block) + n;
  size_t pages = __builtin_wasm_memory_size(0), needed = (end + 65535ULL) / 65536ULL;
  if (needed > pages && __builtin_wasm_memory_grow(0, needed - pages) == (size_t)-1) return 0;
  Block* block = (Block*)cursor; block->size = n; cursor = end; return block + 1;
}
void free(void* p) {
  if (!p) return;
  Block* block = (Block*)p - 1; Block** link = &available;
  while (*link && (uintptr_t)*link < (uintptr_t)block) link = &(*link)->next;
  block->next = *link; *link = block;
  for (Block* at = available; at && at->next;) {
    if ((unsigned char*)(at + 1) + at->size == (unsigned char*)at->next) { at->size += sizeof(Block) + at->next->size; at->next = at->next->next; }
    else at = at->next;
  }
}
void* memcpy(void* dest, const void* source, size_t n) { unsigned char* d = dest; const unsigned char* s = source; for (size_t i = 0; i < n; ++i) d[i] = s[i]; return dest; }
void* memmove(void* dest, const void* source, size_t n) {
  unsigned char* d = dest; const unsigned char* s = source;
  if ((uintptr_t)d < (uintptr_t)s) for (size_t i = 0; i < n; ++i) d[i] = s[i];
  else for (size_t i = n; i; --i) d[i - 1] = s[i - 1]; return dest;
}
void* memset(void* dest, int value, size_t n) { unsigned char* d = dest; for (size_t i = 0; i < n; ++i) d[i] = (unsigned char)value; return dest; }
void* realloc(void* p, size_t n) {
  if (!p) return malloc(n); if (!n) { free(p); return 0; }
  size_t old = ((Block*)p - 1)->size; if (old >= n) return p;
  void* result = malloc(n); if (result) { memcpy(result, p, old); free(p); } return result;
}
#elif defined(TOWER_FREESTANDING_LINUX)
#if defined(__x86_64__)
static long system_call(long n, long a, long b, long c, long d, long e, long f) {
  register long r10 __asm__("r10") = d, r8 __asm__("r8") = e, r9 __asm__("r9") = f;
  long result; __asm__ volatile("syscall" : "=a"(result) : "a"(n), "D"(a), "S"(b), "d"(c), "r"(r10), "r"(r8), "r"(r9) : "rcx", "r11", "memory"); return result;
}
#define SYS_WRITE 1
#define SYS_EXIT 60
#define SYS_MMAP 9
#define SYS_MUNMAP 11
#elif defined(__aarch64__)
static long system_call(long n, long a, long b, long c, long d, long e, long f) {
  register long x8 __asm__("x8") = n, x0 __asm__("x0") = a, x1 __asm__("x1") = b, x2 __asm__("x2") = c;
  register long x3 __asm__("x3") = d, x4 __asm__("x4") = e, x5 __asm__("x5") = f;
  __asm__ volatile("svc 0" : "+r"(x0) : "r"(x8), "r"(x1), "r"(x2), "r"(x3), "r"(x4), "r"(x5) : "memory"); return x0;
}
#define SYS_WRITE 64
#define SYS_EXIT 93
#define SYS_MMAP 222
#define SYS_MUNMAP 215
#else
#error Unsupported freestanding Linux architecture
#endif
static void* malloc(size_t n) {
  if (n > SIZE_MAX - 16) return 0;
  long result = system_call(SYS_MMAP, 0, (long)(n + 16), 3, 0x22, -1, 0);
  if ((unsigned long)result >= (unsigned long)-4095) return 0;
  size_t* memory = (size_t*)result; memory[0] = n + 16; return (unsigned char*)memory + 16;
}
static void free(void* p) { if (p) { size_t* base = (size_t*)((unsigned char*)p - 16); system_call(SYS_MUNMAP, (long)base, (long)base[0], 0, 0, 0, 0); } }
void* memcpy(void* dest, const void* source, size_t n) { unsigned char* d = dest; const unsigned char* s = source; for (size_t i = 0; i < n; ++i) d[i] = s[i]; return dest; }
void* memmove(void* dest, const void* source, size_t n) { unsigned char* d = dest; const unsigned char* s = source; if ((uintptr_t)d < (uintptr_t)s) for (size_t i = 0; i < n; ++i) d[i] = s[i]; else for (size_t i = n; i; --i) d[i - 1] = s[i - 1]; return dest; }
void* memset(void* dest, int value, size_t n) { unsigned char* d = dest; for (size_t i = 0; i < n; ++i) d[i] = (unsigned char)value; return dest; }
static void* realloc(void* p, size_t n) {
  if (!p) return malloc(n); if (!n) { free(p); return 0; }
  size_t old = ((size_t*)((unsigned char*)p - 16))[0] - 16;
  void* result = malloc(n); if (result) { memcpy(result, p, old < n ? old : n); free(p); } return result;
}
#elif defined(TOWER_MACOS)
extern void* malloc(size_t);
extern void* realloc(void*, size_t);
extern void free(void*);
extern long write(int, const void*, size_t);
extern __attribute__((noreturn)) void exit(int);
#elif defined(_WIN32)
__declspec(dllimport) void* __stdcall GetProcessHeap(void);
__declspec(dllimport) void* __stdcall HeapAlloc(void*, unsigned long, size_t);
__declspec(dllimport) void* __stdcall HeapReAlloc(void*, unsigned long, void*, size_t);
__declspec(dllimport) int __stdcall HeapFree(void*, unsigned long, void*);
__declspec(dllimport) void* __stdcall GetStdHandle(unsigned long);
__declspec(dllimport) int __stdcall WriteFile(void*, const void*, unsigned long, unsigned long*, void*);
__declspec(dllimport) __attribute__((noreturn)) void __stdcall ExitProcess(unsigned int);
static void* malloc(size_t n) { return HeapAlloc(GetProcessHeap(), 0, n ? n : 1); }
static void free(void* p) { if (p) HeapFree(GetProcessHeap(), 0, p); }
static void* realloc(void* p, size_t n) { if (!p) return malloc(n); if (!n) { free(p); return 0; } return HeapReAlloc(GetProcessHeap(), 0, p, n); }
void* memcpy(void* dest, const void* source, size_t n) { unsigned char* d = dest; const unsigned char* s = source; for (size_t i = 0; i < n; ++i) d[i] = s[i]; return dest; }
void* memmove(void* dest, const void* source, size_t n) { unsigned char* d = dest; const unsigned char* s = source; if ((uintptr_t)d < (uintptr_t)s) for (size_t i = 0; i < n; ++i) d[i] = s[i]; else for (size_t i = n; i; --i) d[i - 1] = s[i - 1]; return dest; }
void* memset(void* dest, int value, size_t n) { unsigned char* d = dest; for (size_t i = 0; i < n; ++i) d[i] = (unsigned char)value; return dest; }
#else
#include <stdio.h>
#include <stdlib.h>
#endif

void* tower_allocate(size_t count, size_t size) { if (size && count > SIZE_MAX / size) return 0; return malloc(count * size); }
void* tower_reallocate(void* pointer, size_t count, size_t size) { if (size && count > SIZE_MAX / size) return 0; return realloc(pointer, count * size); }
void tower_deallocate(void* pointer) { free(pointer); }

#if !defined(__wasm__)
int64_t platform_write(uint32_t stream, const uint8_t* data, size_t length) {
  if (stream != 1 && stream != 2) return -1;
#if defined(_WIN32)
  size_t total = 0;
  while (total < length) {
    unsigned long written = 0, count = length - total > 0xffffffffu ? 0xffffffffu : (unsigned long)(length - total);
    if (!WriteFile(GetStdHandle(stream == 2 ? (unsigned long)-12 : (unsigned long)-11), data + total, count, &written, 0)) return total ? (int64_t)total : -1;
    total += written; if (!written) break;
  }
  return (int64_t)total;
#elif defined(TOWER_FREESTANDING_LINUX)
  long result = system_call(SYS_WRITE, stream, (long)data, (long)length, 0, 0, 0);
  return result < 0 ? -1 : result;
#elif defined(TOWER_MACOS)
  return write((int)stream, data, length);
#else
  size_t written = fwrite(data, 1, length, stream == 2 ? stderr : stdout);
  return written == 0 && length ? -1 : (int64_t)written;
#endif
}
static void output(const char* data, size_t n, int error) {
#if defined(_WIN32)
  unsigned long written; WriteFile(GetStdHandle(error ? (unsigned long)-12 : (unsigned long)-11), data, (unsigned long)n, &written, 0);
#elif defined(TOWER_FREESTANDING_LINUX)
  system_call(SYS_WRITE, error ? 2 : 1, (long)data, (long)n, 0, 0, 0);
#elif defined(TOWER_MACOS)
  write(error ? 2 : 1, data, n);
#else
  fwrite(data, 1, n, error ? stderr : stdout);
#endif
}
void tower_print(uint32_t kind, uint64_t bits, uint32_t pointer_bytes) {
  char buffer[80]; size_t n = 0;
  if (kind == 2) { const char* value = bits ? "true\n" : "false\n"; output(value, bits ? 5 : 6, 0); return; }
  if (kind == 3) {
    const char* hex = "0123456789abcdef"; buffer[n++] = '0'; buffer[n++] = 'x';
    for (int i = (int)pointer_bytes * 2 - 1; i >= 0; --i) buffer[n++] = hex[(bits >> (i * 4)) & 15];
  } else {
    if (kind == 0) bits &= UINT32_MAX;
    if ((kind == 0 && (bits & 0x80000000ULL)) || (kind == 6 && (bits >> 63))) { buffer[n++] = '-'; bits = 0 - bits; if (kind == 0) bits &= UINT32_MAX; }
    char digits[24]; size_t count = 0; do { digits[count++] = (char)('0' + bits % 10); bits /= 10; } while (bits);
    while (count) buffer[n++] = digits[--count];
  }
  buffer[n++] = '\n'; output(buffer, n, 0);
}
void tower_trap(const char* message, size_t offset) {
  (void)offset; size_t length = 0; while (message[length]) ++length; output(message, length, 1); output("\n", 1, 1);
#if defined(_WIN32)
  ExitProcess(1);
#elif defined(TOWER_FREESTANDING_LINUX)
  system_call(SYS_EXIT, 1, 0, 0, 0, 0, 0); __builtin_unreachable();
#else
  exit(1);
#endif
}
#ifndef TOWER_NO_MAIN
extern void tower_main(void);
#if defined(_WIN32)
void mainCRTStartup(void) { tower_main(); ExitProcess(0); }
#elif defined(TOWER_FREESTANDING_LINUX)
__attribute__((used, noreturn)) void tower_start(void) { tower_main(); system_call(SYS_EXIT, 0, 0, 0, 0, 0, 0); __builtin_unreachable(); }
#if defined(__x86_64__)
__attribute__((naked, noreturn)) void _start(void) { __asm__ volatile("xor %rbp, %rbp\n\tand $-16, %rsp\n\tcall tower_start"); }
#else
__attribute__((naked, noreturn)) void _start(void) { __asm__ volatile("bl tower_start"); }
#endif
#else
int main(void) { tower_main(); return 0; }
#endif
#endif
#endif
