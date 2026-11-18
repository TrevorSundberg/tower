// Host allocation primitives for Tower code linked into the compiler itself.
// Use the host's allocator (wasi-libc in browser reactors), not the guest runtime.
#include <cstddef>
#include <cstdint>
#include <cstdlib>

#ifdef TOWER_COMPILER_MEMORY_TESTS
static size_t live_buffers = 0, allocation_calls = 0;
static bool fail_next = false;
extern "C" size_t tower_test_buffer_count() { return live_buffers; }
extern "C" size_t tower_test_buffer_allocations() { return allocation_calls; }
extern "C" void tower_test_buffer_fail_next() { fail_next = true; }
#endif

extern "C" void* tower_reallocate(void* pointer, size_t count, size_t size) {
  if (size && count > SIZE_MAX / size) return nullptr;
#ifdef TOWER_COMPILER_MEMORY_TESTS
  ++allocation_calls;
  if (fail_next) { fail_next = false; return nullptr; }
#endif
  if (!count || !size) {
    std::free(pointer);
#ifdef TOWER_COMPILER_MEMORY_TESTS
    if (pointer) --live_buffers;
#endif
    return nullptr;
  }
  const bool fresh = pointer == nullptr;
  auto* result = std::realloc(pointer, count * size);
#ifdef TOWER_COMPILER_MEMORY_TESTS
  if (fresh && result) ++live_buffers;
#endif
  return result;
}
extern "C" void tower_deallocate(void* pointer) {
#ifdef TOWER_COMPILER_MEMORY_TESTS
  if (pointer) --live_buffers;
#endif
  std::free(pointer);
}
