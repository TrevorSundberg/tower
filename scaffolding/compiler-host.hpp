#pragma once
#include <cstddef>
struct CompilerNodeMemoryState {
  size_t live_allocations;
};
extern "C" {
void* compiler_node_allocate(CompilerNodeMemoryState*, size_t, bool);
void compiler_node_free(CompilerNodeMemoryState*, void*, bool);
}
