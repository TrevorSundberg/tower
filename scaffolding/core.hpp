#pragma once
#include "syntax.hpp"
#include "format.hpp"
#include <cstdint>
#include <string>
#include <vector>

enum class CoreScalar { I32, U32, Bool, Void, Struct };
struct CoreType {
  CoreScalar scalar = CoreScalar::I32;
  unsigned pointers = 0;
  TowerNode* record = nullptr; // nominal struct identity; owned by the program
  bool operator==(const CoreType&) const = default;
};
enum class CoreOp { Add, Sub, Mul, Div, Rem, And, Or, Xor, Eq, Ne, Lt, Le, Gt, Ge };
enum class CoreKind {
  Program, Function, Parameter, Declare, Assign, Operand, Binary, Address, Load,
  Convert, Bits, Call, Block, If, Loop, Break, Continue, Print, Return, Type, FieldDeclaration, Field
};
struct CoreSlot { TowerNode* local; CoreType type; };

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
  std::vector<TowerNode*> locals; // derived function slots / block lifetime index
  std::vector<TowerNode*> parameters;
  std::vector<CoreSlot> slots; // derived scalar storage, not independent operations
  size_t size = 0, alignment = 1, cell_count = 1, byte_offset = 0;
  size_t index = 0, name_id = 0, start = 0, end = 0;
  uint32_t bits = 0;
  bool constant = false, indirect = false, address_taken = false;
};
TowerNode* core_component_type();
CoreNode* core_get(TowerNode* node);
CoreNode& core_node(TowerNode* node);
CoreNode& core_attach(TowerNode* node, CoreKind kind);
TowerNode* core_binding(TowerNode* node);

struct CoreProgram {
  TowerNode* root = nullptr;
  std::vector<TowerNode*> functions;
  std::vector<TowerNode*> types; // built-ins and user types share CoreKind::Type metadata
  std::vector<std::string> names;
  std::string error;
  size_t error_offset = 0;
  CoreProgram();
  ~CoreProgram();
  CoreProgram(CoreProgram&&) noexcept;
  CoreProgram& operator=(CoreProgram&&) noexcept;
  CoreProgram(const CoreProgram&) = delete;
  CoreProgram& operator=(const CoreProgram&) = delete;
};
CoreProgram core_compile(const char* source);
void core_set_foundation(const std::string& grammar);
CoreProgram core_compile_foundation(const char* source);
std::string core_type_name(CoreType type);
size_t core_type_size(CoreType type);
size_t core_type_alignment(CoreType type);
size_t core_type_cells(CoreType type);
bool core_aggregate(CoreType type);
std::string core_place_name(TowerNode* node);
const char* core_operator(CoreOp op);
using CoreSourceSpan = TowerSourceSpan;
using CoreText = TowerText;
CoreText core_format(const CoreProgram& program);
inline constexpr size_t CORE_MAX_FRAMES = 128, CORE_MAX_CELLS = 65536;

struct CoreValue { uint32_t bits = 0; size_t slot = 0; uint64_t generation = 0; size_t name_id = 0; };
struct CoreCell { CoreValue value; uint64_t generation = 0; bool active = false, initialized = false; };
struct CoreMachine {
  CoreProgram program;
  std::vector<CoreCell> cells;
  struct Task { TowerNode* node; bool exit = false, loop_resume = false; };
  struct Frame {
    TowerNode* function = nullptr;
    size_t base = 0, call_offset = 0;
    TowerNode* destination = nullptr;
    CoreValue pointer;
    std::vector<Task> tasks;
  };
  std::vector<Frame> frames;
  size_t error_offset = 0, output_bytes = 0;
  uint64_t steps = 0, lifetime = 0;
  std::string error, output;
  bool done = false, output_truncated = false;
  explicit CoreMachine(CoreProgram source);
  void step(size_t budget);
private:
  void fail(const std::string&, size_t);
  CoreCell* dereference(CoreValue, size_t);
  CoreValue read(TowerNode*, size_t);
  CoreValue address(TowerNode*, size_t);
  CoreValue evaluate(TowerNode*, size_t);
  void store(TowerNode*, CoreValue, size_t, const CoreValue* = nullptr);
  void enter(TowerNode*);
  void leave(TowerNode*);
  void returned(CoreValue = {});
  void call(TowerNode*, TowerNode*, size_t);
  uint64_t generation(size_t);
};
