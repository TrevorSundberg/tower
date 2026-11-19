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
      foreign(std::move(other.foreign)),
      error(std::move(other.error)), output(std::move(other.output)) {
  other.memory_storage = {};
  other.allocations = {}; other.free_blocks = {}; other.strings = {};
  other.sequenced = {}; other.frames = {};
}
void CoreMachine::fail(const std::string &text, size_t offset) {
  if (error.empty()) {
    error = text;
    failed = true;
    error_offset = offset;
  }
}
void CoreMachine::step(size_t budget) {
  failed = !error.empty();
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

extern "C" size_t im_pointer_bytes(void *host) {
  return static_cast<CoreMachine *>(static_cast<CoreMachineState *>(host))
      ->program.pointer_bytes;
}
extern "C" void *im_root(void *host) {
  return static_cast<CoreMachine *>(static_cast<CoreMachineState *>(host))
      ->program.root;
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
