#pragma once
#include <cstddef>
#include <cstdint>

// Borrowed argv text; only links is owned. This view is temporary until the
// driver itself can consume the frontend and backend's Tower APIs.
struct DriverOptions {
  const char *source, *output, *target, *emit, *cc, *linker, *sysroot;
  const char *raw, *optimized, *bedrock, *foundation, *depfile;
  const char **links;
  size_t link_count;
  bool optimize, interpret, library, timings, help, version, fast;
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
const char* driver_version();
bool driver_resource_root(struct TowerByteBuffer*, const char*);
void driver_source_position(const char*, size_t, size_t, size_t*, size_t*);
const char* driver_output_name(const char*, bool, bool);
bool driver_output_valid(const char*);
bool driver_read_file(const char*, struct TowerByteBuffer*);
bool driver_write_file(const char*, const char*, size_t);
void driver_dispose(DriverOptions*);
void* compiler_memory_reallocate(CompilerMemoryState*, void*, size_t, size_t);
void compiler_memory_deallocate(CompilerMemoryState*, void*);
void* compiler_node_allocate(CompilerNodeMemoryState*, size_t, bool);
void compiler_node_free(CompilerNodeMemoryState*, void*, bool);
}
