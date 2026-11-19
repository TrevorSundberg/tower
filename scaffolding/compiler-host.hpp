#pragma once
#include <cstddef>
#include <cstdint>

// Borrowed argv text; only links is owned. This view is temporary until the
// driver itself can consume the frontend and backend's Tower APIs.
struct DriverOptions {
  const char *source, *output, *target, *emit, *cc, *linker, *sysroot;
  const char *raw, *optimized, *bedrock, *foundation;
  const char **links;
  size_t link_count;
  bool optimize, interpret, library, timings, help;
  uint32_t error;
  const char *argument;
};
struct CompilerMemoryState {
  size_t live_buffers, allocation_calls, fail_after;
};
struct CompilerNodeMemoryState {
  size_t live_allocations;
};
extern "C" {
bool driver_parse(DriverOptions*, size_t, const char* const*, const char*);
const char* driver_help();
void driver_dispose(DriverOptions*);
void* compiler_memory_reallocate(CompilerMemoryState*, void*, size_t, size_t);
void compiler_memory_deallocate(CompilerMemoryState*, void*);
void* compiler_node_allocate(CompilerNodeMemoryState*, size_t, bool);
void compiler_node_free(CompilerNodeMemoryState*, void*, bool);
}
