#pragma once
#include "syntax.hpp"
#include "format.hpp"
#include <cstdint>
#include <string>
#include <vector>
#include <functional>
#include <map>

enum class CoreScalar { I32, U32, Bool, Void, Struct, U8, I64, U64, USize, Array };
struct CoreType {
  CoreScalar scalar = CoreScalar::I32;
  unsigned pointers = 0;
  TowerNode* record = nullptr; // nominal struct identity; owned by the program
  unsigned pointer_bytes = 4; // explicit compilation target, never compiler-host sizeof
  bool operator==(const CoreType& b) const {
    return scalar == b.scalar && pointers == b.pointers && record == b.record &&
      (!(pointers || scalar == CoreScalar::USize) || pointer_bytes == b.pointer_bytes);
  }
};
enum class CoreOp { Add, Sub, Mul, Div, Rem, And, Or, Xor, Eq, Ne, Lt, Le, Gt, Ge };
enum class CoreKind {
  Program, Function, Parameter, Declare, Assign, Operand, Binary, Address, Load,
  Convert, Bits, Call, Block, If, Loop, Break, Continue, Print, Return, Type, FieldDeclaration, Field,
  Index, String, SizeOf, AlignOf, Allocate, Reallocate, Free, Copy, Fill
};
struct CoreBuiltin { const char* name; CoreKind kind; size_t arguments; };
const std::vector<CoreBuiltin>& core_builtins();
const char* core_builtin_name(CoreKind kind);

// A semantic component ON the expanded parser node. References below are
// non-owning edges within CoreProgram's tree, including recursive calls.
// Both backends and the formatter consume these same nodes, not a copied IR.
struct CoreNode {
  CoreKind kind = CoreKind::Program;
  CoreType type;
  CoreOp op = CoreOp::Add;
  std::string name;
  TowerNode *binding = nullptr, *left = nullptr, *right = nullptr,
    *value = nullptr, *target = nullptr, *body = nullptr, *otherwise = nullptr;
  std::vector<TowerNode*> items;
  std::vector<TowerNode*> locals; // derived function storage index
  std::vector<TowerNode*> parameters;
  CoreType element; // array element / allocation / size-query type
  size_t size = 0, alignment = 1, length = 0, byte_offset = 0, frame_size = 0;
  size_t index = 0, start = 0, end = 0;
  uint64_t bits = 0;
  bool constant = false, indirect = false, external = false, exported = false, global = false;
};
TowerNode* core_component_type();
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
inline constexpr size_t CORE_MAX_FRAMES = 128, CORE_STACK_BYTES = 4 * 1024 * 1024;

// Execution values are scalar bits or a raw target byte address. No safety handle.
struct CoreValue { uint64_t bits = 0; };
struct CoreMachine {
  CoreProgram program;
  std::vector<uint8_t> memory;
  std::map<uint64_t, size_t> allocations, free_blocks;
  std::map<TowerNode*, uint64_t> strings;
  size_t stack = 16, heap = CORE_STACK_BYTES;
  using Foreign = std::function<CoreValue(CoreMachine&, TowerNode*, const std::vector<CoreValue>&)>;
  Foreign foreign;
  struct Task { TowerNode* node; bool loop_resume = false; };
  struct Frame {
    TowerNode* function = nullptr;
    size_t base = 0, call_offset = 0;
    TowerNode* destination = nullptr;
    CoreValue pointer;
    std::vector<Task> tasks;
  };
  std::vector<Frame> frames;
  size_t error_offset = 0, output_bytes = 0;
  uint64_t steps = 0;
  std::string error, output;
  bool done = false, output_truncated = false;
  explicit CoreMachine(CoreProgram source);
  void step(size_t budget);
  void fail(const std::string&, size_t);
  uint8_t* bytes(uint64_t address, size_t count, size_t offset = 0);
  CoreValue load(uint64_t address, CoreType, size_t offset = 0);
  void write(uint64_t address, CoreValue, CoreType, size_t offset = 0);
  uint64_t allocate(size_t bytes);
  uint64_t reallocate(uint64_t address, size_t bytes);
  void deallocate(uint64_t address);
private:
  CoreValue read(TowerNode*, size_t);
  CoreValue address(TowerNode*, size_t);
  CoreValue evaluate(TowerNode*, size_t);
  void store(TowerNode*, CoreValue, size_t, const CoreValue* = nullptr);
  void enter(TowerNode*);
  void returned(CoreValue = {});
  void call(TowerNode*, TowerNode*, size_t);
};
