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
CoreMachine::~CoreMachine() {
  if (fast) fast_interpreter_dispose(fast);
  interpreter_storage_dispose(static_cast<CoreMachineState*>(this));
}
CoreMachine::CoreMachine(CoreMachine&& other) noexcept
    : CoreMachineState(other), fast(std::exchange(other.fast, nullptr)), program(std::move(other.program)),
      foreign(std::move(other.foreign)),
      error(std::move(other.error)), output(std::move(other.output)) {
  other.memory_storage = {};
  other.allocations = {}; other.free_blocks = {}; other.strings = {};
  other.sequenced = {}; other.frames = {};
  other.node_cache = {};
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
  if (fast) fast_interpreter_step(static_cast<CoreMachineState *>(this), fast, budget);
  else interpreter_step(static_cast<CoreMachineState *>(this), budget);
}
bool CoreMachine::use_fast() {
  if (steps) return false;
  if (!fast) fast = fast_interpreter_create(static_cast<CoreMachineState*>(this));
  return fast != nullptr;
}

std::unique_ptr<CoreMachine> core_load_bytecode(const uint8_t* data, size_t size, std::string& error) {
  // Hosts install the bundled canonical grammar for package reconstruction.
  error.clear();
  const auto invalid = bytecode_validate(data, size);
  if (invalid) { error = bytecode_error(invalid); return {}; }
  const std::string source(reinterpret_cast<const char*>(data + 56), bytecode_source_size(data));
  if (source.find('\0') != std::string::npos) { error = "NUL in .towerbc Foundation source"; return {}; }
  auto machine = std::make_unique<CoreMachine>(core_compile_foundation(source.c_str(), unsigned(bytecode_pointer_bytes(data))));
  if (!machine->error.empty()) { error = machine->error; return {}; }
  machine->use_fast();
  if (!bytecode_matches(machine->fast, data)) { error = bytecode_error(9); return {}; }
  return machine;
}

std::vector<uint8_t> core_encode_bytecode(const CoreProgram& program, std::string& error) {
  // The checked input graph can originate in an edited grammar. The host must
  // install bundled Foundation before reconstructing its canonical spelling.
  error.clear();
  if (!program.error.empty()) { error = program.error; return {}; }
  // Encode the actual canonical reconstruction, so parser spelling, comments and
  // replacement provenance cannot affect cache identity or leak host addresses.
  const auto text = core_format(program).source;
  CoreMachine canonical(core_compile_foundation(text.c_str(), program.pointer_bytes));
  if (!canonical.error.empty()) { error = canonical.error; return {}; }
  canonical.use_fast();
  size_t size = 0;
  auto* data = bytecode_encode(canonical.fast, text.data(), text.size(), program.pointer_bytes, &size);
  if (!data) { error = "Cannot allocate .towerbc package"; return {}; }
  std::vector<uint8_t> bytes(data, data + size);
  bytecode_free(data);
  return bytes;
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
