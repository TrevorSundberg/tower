// Host allocation primitives for Tower code linked into the compiler itself.
// Use the host's allocator (wasi-libc in browser reactors), not the guest runtime.
#include <cstddef>
#include <cstdint>
#include <cstdlib>

#ifdef TOWER_BOOTSTRAP_HOST
// Only the pre-Tower seed needs the native policy below. Production calls Tower.
extern "C" void* tower_reallocate(void* pointer, size_t count, size_t size) {
  if (size && count > SIZE_MAX / size) return nullptr;
  if (!count || !size) {
    std::free(pointer);
    return nullptr;
  }
  return std::realloc(pointer, count * size);
}
extern "C" void tower_deallocate(void* pointer) {
  std::free(pointer);
}
extern "C" void* tower_allocate(size_t count, size_t size) {
  return tower_reallocate(nullptr, count, size);
}
#else
// Temporary ABI adapters: Tower's backend currently reserves tower_* runtime
// symbols and cannot bind the C allocator's realloc/free names directly.
struct HostMemoryObservation { size_t live, calls, remaining; bool failing; };
extern "C" void* host_memory_resize(HostMemoryObservation*, void*, size_t, size_t);
extern "C" void host_memory_release(HostMemoryObservation*, void*);
extern "C" void host_memory_fail_after(HostMemoryObservation*, size_t);
extern "C" void* compiler_host_reallocate(void* pointer, size_t bytes) { return std::realloc(pointer, bytes); }
extern "C" void compiler_host_free(void* pointer) { std::free(pointer); }
#ifdef TOWER_COMPILER_MEMORY_TESTS
static HostMemoryObservation observation{};
static auto* const memory_observation = &observation;
extern "C" size_t tower_test_buffer_count() { return observation.live; }
extern "C" size_t tower_test_buffer_allocations() { return observation.calls; }
extern "C" void tower_test_buffer_fail_next() { host_memory_fail_after(&observation, 0); }
extern "C" void tower_test_buffer_fail_after(size_t count) { host_memory_fail_after(&observation, count); }
#else
static HostMemoryObservation* const memory_observation = nullptr;
#endif
extern "C" void* tower_reallocate(void* pointer, size_t count, size_t size) {
  return host_memory_resize(memory_observation, pointer, count, size);
}
extern "C" void tower_deallocate(void* pointer) { host_memory_release(memory_observation, pointer); }
extern "C" void* tower_allocate(size_t count, size_t size) { return tower_reallocate(nullptr, count, size); }
#endif
