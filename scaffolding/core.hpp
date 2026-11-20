#pragma once
#include "syntax.hpp"
#include "format.hpp"
#include "foundation-values.hpp"
#include <cstdint>
#include <string>
#include <vector>
#include <functional>
#include <map>
#include <memory>

enum class CoreScalar { I32, U32, Bool, Void, Struct, U8, I64, U64, USize, Array };
struct CoreType {
  CoreScalar scalar = CoreScalar::I32;
  unsigned pointers = 0;
  TowerNode* record = nullptr; // nominal struct identity; owned by the program
  unsigned pointer_bytes = 4; // explicit compilation target, never compiler-host sizeof
  bool operator==(const CoreType& b) const;
};
enum class CoreOp { Add, Sub, Mul, Div, Rem, And, Or, Xor, Eq, Ne, Lt, Le, Gt, Ge };
enum class CoreKind {
  Program, Function, Parameter, Declare, Assign, Operand, Binary, Address, Load,
  Convert, Bits, Call, Block, If, Loop, Break, Continue, Print, Return, Type, FieldDeclaration, Field,
  Index, String, SizeOf, AlignOf, Allocate, Reallocate, Free, Copy, Fill, Label, Jump, Trap
};
struct CoreBuiltin { const char* name; CoreKind kind; size_t arguments; };
const std::vector<CoreBuiltin>& core_builtins();
const char* core_builtin_name(CoreKind kind);

// Temporary native ABI view of compiler/foundation-nodes.tower's component ON
// the expanded parser entity. Tower owns initialization and dynamic field storage.
// References below are non-owning edges within CoreProgram's tree.
// Both backends and the formatter consume these same nodes, not a copied IR.
struct CoreNode {
  CoreKind kind = CoreKind::Program;
  CoreType type;
  CoreOp op = CoreOp::Add;
  CoreName name;
  TowerNode *binding = nullptr, *left = nullptr, *right = nullptr,
    *value = nullptr, *target = nullptr, *body = nullptr, *otherwise = nullptr;
  CoreNodes items;
  CoreNodes locals; // derived function storage index
  CoreNodes parameters;
  CoreType element; // array element / allocation / size-query type
  size_t size = 0, alignment = 1, length = 0, byte_offset = 0, frame_size = 0;
  size_t index = 0, start = 0, end = 0;
  uint64_t bits = 0;
  bool constant = false, indirect = false, external = false, exported = false, global = false;
  CoreName comments;
};
extern "C" TowerNode* core_component_type();
CoreNode* core_get(TowerNode* node);
CoreNode& core_node(TowerNode* node);
CoreNode& core_attach(TowerNode* node, CoreKind kind);
TowerNode* core_binding(TowerNode* node);

struct CoreProgram {
  unsigned pointer_bytes = 4;
  TowerNode* root = nullptr;
  std::vector<TowerNode*> functions;
  std::vector<TowerNode*> types; // built-ins and user types share CoreKind::Type metadata
  std::string error;
  size_t error_offset = 0;
  explicit CoreProgram(unsigned pointer_bytes = 4);
  ~CoreProgram();
  CoreProgram(CoreProgram&&) noexcept;
  CoreProgram& operator=(CoreProgram&&) noexcept;
  CoreProgram(const CoreProgram&) = delete;
  CoreProgram& operator=(const CoreProgram&) = delete;
};
CoreProgram core_compile(const char* source, unsigned pointer_bytes = 4);
// Ordered project sources share module bindings, but each parser starts from
// Foundation. Diagnostic offsets index their UTF-8 texts separated by one byte.
CoreProgram core_compile_files(const std::vector<std::string>& sources, unsigned pointer_bytes = 4);
void core_set_foundation(const std::string& grammar);
CoreProgram core_compile_foundation(const char* source, unsigned pointer_bytes = 4);
std::string core_type_name(CoreType type);
size_t core_type_size(CoreType type);
size_t core_type_alignment(CoreType type);
bool core_aggregate(CoreType type);
bool core_integer(CoreType type);
bool core_signed(CoreType type);
unsigned core_width(CoreType type);
uint64_t core_mask(CoreType type);
std::string core_number(uint64_t bits, CoreType type);
std::string core_place_name(TowerNode* node);
const char* core_operator(CoreOp op);
using CoreSourceSpan = TowerSourceSpan;
using CoreText = TowerText;
CoreText core_format(const CoreProgram& program);
CoreText core_c_source(const CoreProgram& program, bool comments = true);
CoreText core_roku_source(const CoreProgram& program, bool comments = true);
void core_strip_comments(CoreProgram& program);
inline constexpr size_t CORE_MAX_FRAMES = 128, CORE_STACK_BYTES = 4 * 1024 * 1024;

// Execution values are scalar bits or a raw target byte address. No safety handle.
struct CoreValue { uint64_t bits = 0; };
// Non-owning native ABI views. Tower owns their storage and all operations.
template<class T> struct CoreMachineArray {
  T* data = nullptr;
  size_t length = 0, capacity = 0;
  size_t size() const { return length; }
  const T* begin() const { return data; }
  const T* end() const { return data ? data + length : data; }
  const T& operator[](size_t i) const { return data[i]; }
};
struct CoreMachineEntry { uint64_t key, value; };
struct CoreMachineTask { TowerNode* node; uint64_t loop_resume; size_t phase, offset; };
struct CoreMachineFrame {
  TowerNode* function;
  size_t base, call_offset;
  TowerNode* call;
  CoreMachineArray<CoreMachineTask> tasks;
  CoreMachineArray<CoreMachineEntry> values, addresses;
};
// State and derived execution indexes are shared directly with Tower.
struct CoreMachineState {
  size_t stack = 16, heap = CORE_STACK_BYTES;
  size_t error_offset = 0, output_bytes = 0;
  uint64_t steps = 0;
  bool done = false, output_truncated = false;
  bool failed = false;
  size_t frame_count = 0, task_count = 0;
  bool cached = false; // current task may read suspended per-statement results
  TowerByteBuffer memory_storage{}; // owned by interpreter-storage.tower
  CoreMachineArray<CoreMachineEntry> allocations, free_blocks, strings, sequenced;
  CoreMachineArray<CoreMachineFrame> frames;
  CoreMachineArray<CoreMachineEntry> node_cache;
};
struct CoreMachine : CoreMachineState {
  void* fast = nullptr; // Tower-owned private execution cache, never serialized
  CoreProgram program;
  using Foreign = std::function<CoreValue(CoreMachine&, TowerNode*, const std::vector<CoreValue>&)>;
  Foreign foreign;
  enum class Phase { Statement, Resume, Value, Address, FinishValue, FinishAddress };
  std::string error, output;
  explicit CoreMachine(CoreProgram source);
  ~CoreMachine();
  CoreMachine(CoreMachine&&) noexcept;
  CoreMachine(const CoreMachine&) = delete;
  CoreMachine& operator=(const CoreMachine&) = delete;
  uint8_t* memory_data() { return memory_storage.data; }
  const uint8_t* memory_data() const { return memory_storage.data; }
  size_t memory_size() const { return memory_storage.length; }
  void step(size_t budget);
  bool use_fast();
  void fail(const std::string&, size_t);
  uint8_t* bytes(uint64_t address, size_t count, size_t offset = 0);
  CoreValue load(uint64_t address, CoreType, size_t offset = 0);
  void write(uint64_t address, CoreValue, CoreType, size_t offset = 0);
  uint64_t allocate(size_t bytes);
  uint64_t reallocate(uint64_t address, size_t bytes);
  void deallocate(uint64_t address);
};
std::unique_ptr<CoreMachine> core_load_bytecode(const uint8_t*, size_t, std::string& error);
std::vector<uint8_t> core_encode_bytecode(const CoreProgram&, std::string& error, unsigned optimization_profile = 0);
