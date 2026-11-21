#pragma once
#include "syntax.hpp"
#include "format.hpp"
#include "foundation-values.hpp"
#include <cstdint>
#include <string>
#include <vector>

enum class CoreScalar { I32, U32, Bool, Void, Struct, U8, I64, U64, USize, Array };
struct CoreType {
  CoreScalar scalar = CoreScalar::I32;
  unsigned pointers = 0;
  TowerNode* record = nullptr; // nominal struct identity; owned by the program
  unsigned pointer_bytes = 4; // explicit compilation target, never compiler-host sizeof
};
enum class CoreOp { Add, Sub, Mul, Div, Rem, And, Or, Xor, Eq, Ne, Lt, Le, Gt, Ge };
enum class CoreKind {
  Program, Function, Parameter, Declare, Assign, Operand, Binary, Address, Load,
  Convert, Bits, Call, Block, If, Loop, Break, Continue, Print, Return, Type, FieldDeclaration, Field,
  Index, String, SizeOf, AlignOf, Allocate, Reallocate, Free, Copy, Fill, Label, Jump, Trap
};
const char* core_builtin_name(CoreKind kind);

// Temporary native ABI view of compiler/foundation_nodes.tower's component ON
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
std::string core_type_name(CoreType type);
std::string core_number(uint64_t bits, CoreType type);
const char* core_operator(CoreOp op);
using CoreSourceSpan = TowerSourceSpan;
using CoreText = TowerText;
CoreText core_format(const CoreProgram& program);
