#include "interpreter-abi.hpp"
#include <cstdio>
#include <cstdlib>
#include <utility>

CoreMachine::CoreMachine(CoreProgram source) : program(std::move(source)) {
  error = program.error;
  error_offset = program.error_offset;
  done = !error.empty();
  failed = done;
  interpreter_init(static_cast<CoreMachineState *>(this));
}
CoreMachine::~CoreMachine() { interpreter_storage_dispose(static_cast<CoreMachineState*>(this)); }
CoreMachine::CoreMachine(CoreMachine&& other) noexcept
    : CoreMachineState(other), program(std::move(other.program)),
      allocations(std::move(other.allocations)), free_blocks(std::move(other.free_blocks)),
      strings(std::move(other.strings)), foreign(std::move(other.foreign)),
      frames(std::move(other.frames)), sequenced(std::move(other.sequenced)),
      error(std::move(other.error)), output(std::move(other.output)) {
  other.memory_storage = {};
}
void CoreMachine::fail(const std::string &text, size_t offset) {
  if (error.empty()) {
    error = text;
    failed = true;
    error_offset = offset;
  }
}
void CoreMachine::step(size_t budget) {
  // Refresh derived storage observations at the public entry boundary.
  failed = !error.empty();
  frame_count = frames.size();
  task_count = frames.empty() ? 0 : frames.back().tasks.size();
  interpreter_step(static_cast<CoreMachineState *>(this), budget);
}
uint8_t *CoreMachine::bytes(uint64_t at, size_t count, size_t offset) {
  return interpreter_bytes(static_cast<CoreMachineState *>(this), at, count,
                           offset);
}
CoreValue CoreMachine::load(uint64_t at, CoreType type, size_t offset) {
  return {interpreter_load(static_cast<CoreMachineState *>(this), at, &type,
                           offset)};
}
void CoreMachine::write(uint64_t at, CoreValue value, CoreType type,
                        size_t offset) {
  interpreter_write(static_cast<CoreMachineState *>(this), at, value.bits,
                    &type, offset);
}
uint64_t CoreMachine::allocate(size_t count) {
  return interpreter_allocate(static_cast<CoreMachineState *>(this), count);
}
uint64_t CoreMachine::reallocate(uint64_t at, size_t count) {
  return interpreter_reallocate(static_cast<CoreMachineState *>(this), at,
                                count);
}
void CoreMachine::deallocate(uint64_t at) {
  interpreter_deallocate(static_cast<CoreMachineState *>(this), at);
}

extern "C" CoreNode *im_node(void *node) {
  return &core_node(static_cast<TowerNode *>(node));
}
extern "C" void *im_binding(void *node) {
  return core_binding(static_cast<TowerNode *>(node));
}
extern "C" size_t im_type_size(const CoreType *type) {
  return core_type_size(*type);
}
extern "C" size_t im_type_alignment(const CoreType *type) {
  return core_type_alignment(*type);
}
extern "C" uint64_t im_type_mask(const CoreType *type) {
  return core_mask(*type);
}
extern "C" bool im_type_signed(const CoreType *type) {
  return core_signed(*type);
}
extern "C" size_t im_pointer_bytes(void *host) {
  return static_cast<CoreMachine *>(static_cast<CoreMachineState *>(host))
      ->program.pointer_bytes;
}
extern "C" void *im_root(void *host) {
  return static_cast<CoreMachine *>(static_cast<CoreMachineState *>(host))
      ->program.root;
}
extern "C" size_t im_base(void *host) {
  return static_cast<CoreMachine *>(static_cast<CoreMachineState *>(host))
      ->frames.back()
      .base;
}
extern "C" void *im_frame_call(void *host) {
  return static_cast<CoreMachine *>(static_cast<CoreMachineState *>(host))
      ->frames.back()
      .call;
}
extern "C" bool im_has_foreign(void *host) {
  return bool(static_cast<CoreMachine *>(static_cast<CoreMachineState *>(host))
                  ->foreign);
}
extern "C" void im_fail(void *host, uint8_t *text, size_t offset) {
  static_cast<CoreMachine *>(static_cast<CoreMachineState *>(host))
      ->fail(reinterpret_cast<const char *>(text), offset);
}
extern "C" void im_missing_foreign(void *host, void *node, size_t offset) {
  static_cast<CoreMachine *>(static_cast<CoreMachineState *>(host))
      ->fail(
          "No interpreter implementation registered for external function '" +
              core_node(static_cast<TowerNode *>(node)).name + "'",
          offset);
}
extern "C" void im_append(void *host, uint8_t *text, size_t count) {
  auto &m = *static_cast<CoreMachine *>(static_cast<CoreMachineState *>(host));
  m.output.append(reinterpret_cast<const char *>(text), count);
  m.output_bytes += count;
}

extern "C" void im_frame_push(void *host, void *function, size_t base,
                              size_t offset, void *call) {
  auto &m = *static_cast<CoreMachine *>(static_cast<CoreMachineState *>(host));
  CoreMachine::Frame f;
  f.function = static_cast<TowerNode *>(function);
  f.base = base;
  f.call_offset = offset;
  f.call = static_cast<TowerNode *>(call);
  m.frames.push_back(std::move(f));
  m.frame_count = m.frames.size();
  m.task_count = 0;
}
extern "C" void im_frame_pop(void *host) {
  auto &m = *static_cast<CoreMachine *>(static_cast<CoreMachineState *>(host));
  m.frames.pop_back();
  m.frame_count = m.frames.size();
  m.task_count = m.frames.empty() ? 0 : m.frames.back().tasks.size();
}
extern "C" void im_task_push(void *host, void *node, bool loop_resume,
                             size_t phase, size_t offset) {
  auto &m = *static_cast<CoreMachine *>(static_cast<CoreMachineState *>(host));
  m.frames.back().tasks.push_back({static_cast<TowerNode *>(node), loop_resume,
                                   static_cast<CoreMachine::Phase>(phase),
                                   offset});
  m.task_count = m.frames.back().tasks.size();
}
extern "C" void im_task_pop(void *host, InterpreterTask *task) {
  auto &m = *static_cast<CoreMachine *>(static_cast<CoreMachineState *>(host));
  auto &tasks = m.frames.back().tasks;
  auto t = tasks.back();
  tasks.pop_back();
  *task = {t.node, t.loop_resume, size_t(t.phase), t.offset};
  m.task_count = tasks.size();
}
extern "C" void im_cache_clear(void *host) {
  auto &f = static_cast<CoreMachine *>(static_cast<CoreMachineState *>(host))
                ->frames.back();
  f.values.clear();
  f.addresses.clear();
}

extern "C" uint64_t im_free_neighbor(void *host, uint64_t key, bool previous,
                                     uint64_t *count) {
  auto &blocks =
      static_cast<CoreMachine *>(static_cast<CoreMachineState *>(host))
          ->free_blocks;
  auto it = blocks.lower_bound(key);
  if (previous) {
    if (it == blocks.begin())
      return 0;
    --it;
  }
  if (it == blocks.end())
    return 0;
  *count = it->second;
  return it->first;
}
extern "C" uint64_t im_foreign(void *host, void *node, uint64_t *args,
                               size_t count) {
  auto &m = *static_cast<CoreMachine *>(static_cast<CoreMachineState *>(host));
  std::vector<CoreValue> values;
  for (size_t i = 0; i < count; ++i)
    values.push_back({args[i]});
  auto result = m.foreign(m, static_cast<TowerNode *>(node), values).bits;
  m.failed = !m.error.empty();
  return result;
}

extern "C" size_t im_pointee_size(const CoreType *type) {
  auto element = *type;
  --element.pointers;
  return core_type_size(element);
}

// A trap here signals an invariant failure in compiler-owned Tower code. Guest
// arithmetic errors are diagnosed in Tower before invoking these operations.
extern "C" void tower_trap(const char *message, size_t offset) {
  std::fprintf(stderr, "Tower interpreter internal trap at %zu: %s\n", offset,
               message);
  std::abort();
}

// Container extract primitive: return and erase one exact key in one lookup.

extern "C" uint64_t im_allocations_get(void *host, uint64_t key, bool *found) {
  auto &m = *static_cast<CoreMachine *>(static_cast<CoreMachineState *>(host));
  auto &map = m.allocations;
  auto it = map.find(key);
  *found = it != map.end();
  if (!*found)
    return 0;
  return it->second;
}

extern "C" uint64_t im_strings_get(void *host, uint64_t key, bool *found) {
  auto &m = *static_cast<CoreMachine *>(static_cast<CoreMachineState *>(host));
  auto &map = m.strings;
  auto it = map.find(reinterpret_cast<TowerNode *>(uintptr_t(key)));
  *found = it != map.end();
  if (!*found)
    return 0;
  return it->second;
}

extern "C" uint64_t im_sequenced_get(void *host, uint64_t key, bool *found) {
  auto &m = *static_cast<CoreMachine *>(static_cast<CoreMachineState *>(host));
  auto &map = m.sequenced;
  auto it = map.find(reinterpret_cast<TowerNode *>(uintptr_t(key)));
  *found = it != map.end();
  if (!*found)
    return 0;
  return it->second;
}

extern "C" uint64_t im_values_get(void *host, uint64_t key, bool *found) {
  auto &m = *static_cast<CoreMachine *>(static_cast<CoreMachineState *>(host));
  auto &map = m.frames.back().values;
  auto it = map.find(reinterpret_cast<TowerNode *>(uintptr_t(key)));
  *found = it != map.end();
  if (!*found)
    return 0;
  return it->second.bits;
}

extern "C" uint64_t im_addresses_get(void *host, uint64_t key, bool *found) {
  auto &m = *static_cast<CoreMachine *>(static_cast<CoreMachineState *>(host));
  auto &map = m.frames.back().addresses;
  auto it = map.find(reinterpret_cast<TowerNode *>(uintptr_t(key)));
  *found = it != map.end();
  if (!*found)
    return 0;
  return it->second.bits;
}

extern "C" void im_allocations_set(void *host, uint64_t key, uint64_t value) {
  auto &m = *static_cast<CoreMachine *>(static_cast<CoreMachineState *>(host));
  auto &map = m.allocations;
  map[key] = value;
}

extern "C" void im_free_blocks_set(void *host, uint64_t key, uint64_t value) {
  auto &m = *static_cast<CoreMachine *>(static_cast<CoreMachineState *>(host));
  auto &map = m.free_blocks;
  map[key] = value;
}

extern "C" void im_strings_set(void *host, uint64_t key, uint64_t value) {
  auto &m = *static_cast<CoreMachine *>(static_cast<CoreMachineState *>(host));
  auto &map = m.strings;
  map[reinterpret_cast<TowerNode *>(uintptr_t(key))] = value;
}

extern "C" void im_sequenced_set(void *host, uint64_t key, uint64_t value) {
  auto &m = *static_cast<CoreMachine *>(static_cast<CoreMachineState *>(host));
  auto &map = m.sequenced;
  map[reinterpret_cast<TowerNode *>(uintptr_t(key))] = value;
}

extern "C" void im_values_set(void *host, uint64_t key, uint64_t value) {
  auto &m = *static_cast<CoreMachine *>(static_cast<CoreMachineState *>(host));
  auto &map = m.frames.back().values;
  map[reinterpret_cast<TowerNode *>(uintptr_t(key))] = CoreValue{value};
}

extern "C" void im_addresses_set(void *host, uint64_t key, uint64_t value) {
  auto &m = *static_cast<CoreMachine *>(static_cast<CoreMachineState *>(host));
  auto &map = m.frames.back().addresses;
  map[reinterpret_cast<TowerNode *>(uintptr_t(key))] = CoreValue{value};
}

extern "C" void im_free_blocks_erase(void *host, uint64_t key) {
  auto &m = *static_cast<CoreMachine *>(static_cast<CoreMachineState *>(host));
  auto &map = m.free_blocks;
  map.erase(key);
}

extern "C" uint64_t im_allocations_take(void *host, uint64_t key, bool *found) {
  auto &m = *static_cast<CoreMachine *>(static_cast<CoreMachineState *>(host));
  auto &map = m.allocations;
  auto it = map.find(key);
  *found = it != map.end();
  if (!*found)
    return 0;
  auto value = it->second;
  map.erase(it);
  return value;
}

// Ordered-container queries only. Tower decides whether/how to merge blocks.
extern "C" void im_free_neighbors(void *host, uint64_t key,
                                  InterpreterNeighbors *result) {
  auto &blocks =
      static_cast<CoreMachine *>(static_cast<CoreMachineState *>(host))
          ->free_blocks;
  *result = {};
  auto next = blocks.lower_bound(key);
  if (next != blocks.end()) {
    result->next = next->first;
    result->next_count = next->second;
  }
  if (next != blocks.begin()) {
    --next;
    result->previous = next->first;
    result->previous_count = next->second;
  }
}
extern "C" uint64_t im_free_first(void *host, uint64_t *count) {
  auto &blocks =
      static_cast<CoreMachine *>(static_cast<CoreMachineState *>(host))
          ->free_blocks;
  if (blocks.empty())
    return 0;
  auto first = blocks.begin();
  *count = first->second;
  return first->first;
}
