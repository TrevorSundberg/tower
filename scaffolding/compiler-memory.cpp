// Temporary foreign-call and reserved runtime-symbol bridges only. Allocation
// policy and failure instrumentation live in host/memory.tower.
#include "compiler-host.hpp"
#include <cstdlib>

#ifdef TOWER_COMPILER_MEMORY_TESTS
static CompilerMemoryState instrumentation{0, 0, SIZE_MAX};
static auto* state = &instrumentation;
extern "C" size_t tower_test_buffer_count() { return state->live_buffers; }
extern "C" size_t tower_test_buffer_allocations() { return state->allocation_calls; }
extern "C" void tower_test_buffer_fail_next() { state->fail_after = 0; }
extern "C" void tower_test_buffer_fail_after(size_t count) { state->fail_after = count; }
#else
static CompilerMemoryState* state = nullptr;
#endif

extern "C" void* tower_reallocate(void* pointer, size_t count, size_t size) {
  return compiler_memory_reallocate(state, pointer, count, size);
}
extern "C" void tower_deallocate(void* pointer) {
  compiler_memory_deallocate(state, pointer);
}
extern "C" void* tower_allocate(size_t count, size_t size) {
  return compiler_memory_reallocate(state, nullptr, count, size);
}
extern "C" void* compiler_host_reallocate(void* pointer, size_t bytes) { return std::realloc(pointer, bytes); }
extern "C" void compiler_host_deallocate(void* pointer) { std::free(pointer); }
