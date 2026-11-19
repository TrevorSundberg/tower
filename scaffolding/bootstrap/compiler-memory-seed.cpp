// Frozen host allocator from 586078b, linked only into towerc-seed to break the
// bootstrap cycle. Production policy is scaffolding/host/memory.tower.
// Use the host's allocator (wasi-libc in browser reactors), not the guest runtime.
#include <cstddef>
#include <cstdint>
#include <cstdlib>

#ifdef TOWER_COMPILER_MEMORY_TESTS
static size_t live_buffers = 0, allocation_calls = 0;
static size_t fail_after = SIZE_MAX;
extern "C" size_t tower_test_buffer_count() { return live_buffers; }
extern "C" size_t tower_test_buffer_allocations() { return allocation_calls; }
extern "C" void tower_test_buffer_fail_next() { fail_after = 0; }
extern "C" void tower_test_buffer_fail_after(size_t count) { fail_after = count; }
#endif

extern "C" void* tower_reallocate(void* pointer, size_t count, size_t size) {
  if (size && count > SIZE_MAX / size) return nullptr;
#ifdef TOWER_COMPILER_MEMORY_TESTS
  ++allocation_calls;
  if (fail_after != SIZE_MAX) {
    if (!fail_after) { fail_after = SIZE_MAX; return nullptr; }
    --fail_after;
  }
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
extern "C" void* tower_allocate(size_t count, size_t size) {
  return tower_reallocate(nullptr, count, size);
}
