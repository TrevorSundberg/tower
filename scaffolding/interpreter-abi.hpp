#pragma once
// Transitional host storage/callback ABI. Semantic algorithms live in
// interpreter.tower.
#include "core.hpp"
struct InterpreterTask {
  void *node;
  uint64_t loop_resume;
  size_t phase, offset;
};
extern "C" CoreNode *im_node(void *node);
extern "C" void *im_binding(void *node);
extern "C" size_t im_type_size(const CoreType *type);
extern "C" size_t im_type_alignment(const CoreType *type);
extern "C" uint64_t im_type_mask(const CoreType *type);
extern "C" bool im_type_signed(const CoreType *type);
extern "C" size_t im_pointer_bytes(void *host);
extern "C" void *im_root(void *host);
extern "C" size_t im_memory_size(void *host);
extern "C" uint8_t *im_memory(void *host);
extern "C" size_t im_base(void *host);
extern "C" void *im_frame_call(void *host);
extern "C" bool im_has_foreign(void *host);
extern "C" bool im_memory_resize(void *host, size_t count);
extern "C" void interpreter_storage_dispose(void *host);
extern "C" void im_fail(void *host, uint8_t *text, size_t offset);
extern "C" void im_missing_foreign(void *host, void *node, size_t offset);
extern "C" void im_append(void *host, uint8_t *text, size_t count);
extern "C" void im_frame_push(void *host, void *function, size_t base,
                              size_t offset, void *call);
extern "C" void im_frame_pop(void *host);
extern "C" void im_task_push(void *host, void *node, bool loop_resume,
                             size_t phase, size_t offset);
extern "C" void im_task_pop(void *host, InterpreterTask *task);
extern "C" void im_cache_clear(void *host);
extern "C" uint64_t im_free_neighbor(void *host, uint64_t key, bool previous,
                                     uint64_t *count);
extern "C" uint64_t im_foreign(void *host, void *node, uint64_t *args,
                               size_t count);
extern "C" void interpreter_init(void *);
extern "C" void interpreter_step(void *, size_t);
extern "C" uint8_t *interpreter_bytes(void *, uint64_t, size_t, size_t);
extern "C" uint64_t interpreter_load(void *, uint64_t, const CoreType *,
                                     size_t);
extern "C" void interpreter_write(void *, uint64_t, uint64_t, const CoreType *,
                                  size_t);
extern "C" uint64_t interpreter_allocate(void *, size_t);
extern "C" uint64_t interpreter_reallocate(void *, uint64_t, size_t);
extern "C" void interpreter_deallocate(void *, uint64_t);
extern "C" size_t im_pointee_size(const CoreType *);

extern "C" uint64_t im_allocations_get(void *host, uint64_t key, bool *found);
extern "C" uint64_t im_strings_get(void *host, uint64_t key, bool *found);
extern "C" uint64_t im_sequenced_get(void *host, uint64_t key, bool *found);
extern "C" uint64_t im_values_get(void *host, uint64_t key, bool *found);
extern "C" uint64_t im_addresses_get(void *host, uint64_t key, bool *found);
extern "C" void im_allocations_set(void *host, uint64_t key, uint64_t value);
extern "C" void im_free_blocks_set(void *host, uint64_t key, uint64_t value);
extern "C" void im_strings_set(void *host, uint64_t key, uint64_t value);
extern "C" void im_sequenced_set(void *host, uint64_t key, uint64_t value);
extern "C" void im_values_set(void *host, uint64_t key, uint64_t value);
extern "C" void im_addresses_set(void *host, uint64_t key, uint64_t value);
extern "C" void im_free_blocks_erase(void *host, uint64_t key);
extern "C" uint64_t im_allocations_take(void *host, uint64_t key, bool *found);

extern "C" size_t interpreter_state_size();
extern "C" size_t interpreter_state_offset(size_t);
static_assert(size_t(CoreMachine::Phase::Statement) == 0 &&
              size_t(CoreMachine::Phase::Resume) == 1 &&
              size_t(CoreMachine::Phase::Value) == 2 &&
              size_t(CoreMachine::Phase::Address) == 3 &&
              size_t(CoreMachine::Phase::FinishValue) == 4 &&
              size_t(CoreMachine::Phase::FinishAddress) == 5);

struct InterpreterNeighbors {
  uint64_t next, next_count, previous, previous_count;
};
extern "C" void im_free_neighbors(void *, uint64_t, InterpreterNeighbors *);
extern "C" uint64_t im_free_first(void *, uint64_t *);
// Keep bootstrap limits in lockstep until these declarations live in Tower.
static_assert(CORE_STACK_BYTES == 4194304 && CORE_MAX_FRAMES == 128);
