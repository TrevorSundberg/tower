#include "core.hpp"
#include <algorithm>
#include <map>
#include <initializer_list>
#include <utility>

namespace {
std::string foundation_grammar;
Match* match(TowerNode* n) { return n ? static_cast<Match*>(tower_node_get_component_userdata(n, parser_match_get_type())) : nullptr; }
std::string label(TowerNode* n) { auto* m = match(n); return m ? parser_match_get_label(m) : ""; }
TowerNode* child(TowerNode* n, size_t i) { return n ? tower_node_get_child(n, i) : nullptr; }
TowerNode* member(TowerNode* n, const char* name) { return n ? tower_node_get_child_member(n, name) : nullptr; }
TowerNode* unwrap(TowerNode* n) { return label(n) == "Statement" && tower_node_get_child_count(n) == 1 ? child(n, 0) : n; }
std::string tokens(TowerNode* n) {
  std::string out; std::vector<TowerNode*> pending; if (n) pending.push_back(n);
  while (!pending.empty()) {
    auto* at = pending.back(); pending.pop_back(); auto* m = match(at);
    if (m && parser_match_get_rule_index(m) == TOWER_INVALID_INDEX) out += label(at);
    else for (size_t i = tower_node_get_child_count(at); i; --i) pending.push_back(child(at, i - 1));
  }
  return out;
}
std::vector<TowerNode*> collect(TowerNode* n, const std::string& wanted) {
  std::vector<TowerNode*> result, pending; if (n) pending.push_back(n);
  while (!pending.empty()) {
    auto* at = pending.back(); pending.pop_back();
    if (label(at) == wanted) result.push_back(at);
    else for (size_t i = tower_node_get_child_count(at); i; --i) pending.push_back(child(at, i - 1));
  }
  return result;
}
// Quoted identifiers preserve names introduced by an extended lexer when the
// shared formatter emits canonical foundation source for another backend.
std::string identifier(std::string text) {
  return tower_identifier_value(text);
}
bool integer(CoreType t) { return !t.pointers && (t.scalar == CoreScalar::I32 || t.scalar == CoreScalar::U32); }
bool literal(TowerNode* n) {
  auto text = tokens(n);
  return !text.empty() && (text == "true" || text == "false" || text[0] == '-' || (text[0] >= '0' && text[0] <= '9'));
}
enum Flow : unsigned { Next = 1, Break = 2, Continue = 4, Return = 8 };
struct Compiler {
  CoreProgram program;
  TowerNode* current = program.root;
  size_t prefix = 0, count = 0, loops = 0;
  std::map<std::string, TowerNode*> functions;
  std::map<std::string, TowerNode*> types;
  std::map<TowerNode*, unsigned> layout_state;
  std::vector<std::map<std::string, TowerNode*>> scopes{1};
  Compiler() { for (auto* type : program.types) types.emplace(core_node(type).name, type); }
  CoreNode& function() { return core_node(current); }
  size_t offset(TowerNode* n) { auto* m = match(n); auto start = m ? parser_match_get_start(m) : 0; return start > prefix ? start - prefix : 0; }
  void fail(TowerNode* n, const std::string& text) { if (program.error.empty()) { program.error = text; program.error_offset = offset(n); } }
  bool shape(TowerNode* n, std::initializer_list<const char*> captures) {
    if (!n) { fail(n, "Missing foundation tree"); return false; }
    for (auto* name : captures) if (!member(n, name)) {
      fail(n, "Malformed " + label(n) + " tree: missing capture '" + name + "'"); return false;
    }
    return true;
  }
  CoreNode& node(TowerNode* n, CoreKind kind) {
    bool fresh = !core_get(n);
    auto& result = core_attach(n, kind); result.start = offset(n);
    auto* m = match(n); result.end = result.start + (m ? parser_match_get_length(m) : 0);
    if (fresh && ++count > 65536) fail(n, "Foundation node limit is 65,536");
    return result;
  }
  CoreType type(TowerNode* n) {
    // Types are ordinary identifier references. This bootstrap registry is the
    // first semantic namespace; type spellings are absent from the grammar.
    auto text = tokens(n); CoreType t;
    while (!text.empty() && text.back() == '*') { ++t.pointers; text.pop_back(); }
    text = identifier(text);
    auto found = types.find(text);
    if (found == types.end()) fail(n, "Unknown type '" + text + "'");
    else { auto pointers = t.pointers; t = core_node(found->second).type; t.pointers = pointers; }
    if (t.pointers > 16) fail(n, "Foundation pointer nesting limit is 16");
    if (t.pointers && t.scalar == CoreScalar::Void) fail(n, "void pointers are not supported");
    return t;
  }
  void type_header(TowerNode* n) {
    if (!shape(n, {"name", "fields"})) return;
    auto& t = node(n, CoreKind::Type); t.name = identifier(tokens(member(n, "name")));
    if (t.name.empty() || types.contains(t.name)) { fail(n, "Missing or duplicate type '" + t.name + "'"); return; }
    if (program.types.size() >= 260) { fail(n, "Foundation struct type limit is 256"); return; }
    t.type = {CoreScalar::Struct, 0, n}; types[t.name] = n; program.types.push_back(n);
  }
  void type_fields(TowerNode* n) {
    auto& t = core_node(n); std::map<std::string, bool> names;
    for (auto* field : collect(member(n, "fields"), "CoreField")) {
      if (!shape(field, {"name", "type"})) return;
      auto& f = node(field, CoreKind::FieldDeclaration); f.name = identifier(tokens(member(field, "name"))); f.type = type(member(field, "type"));
      if (f.name.empty() || names.contains(f.name)) fail(field, "Missing or duplicate field '" + f.name + "'");
      if (f.type.scalar == CoreScalar::Void) fail(field, "A field cannot have void type");
      names[f.name] = true; t.items.push_back(field);
      if (t.items.size() > 256) { fail(field, "Foundation field limit is 256"); return; }
    }
  }
  void layout(TowerNode* n, unsigned depth = 0) {
    if (!program.error.empty() || layout_state[n] == 2) return;
    if (layout_state[n] == 1) { fail(n, "Recursive by-value layout for '" + core_node(n).name + "'; use a pointer"); return; }
    if (depth > 128) { fail(n, "Foundation type nesting limit is 128"); return; }
    layout_state[n] = 1; auto& t = core_node(n); t.size = 0; t.cell_count = 0;
    for (auto* field : t.items) {
      auto& f = core_node(field);
      if (core_aggregate(f.type)) layout(f.type.record, depth + 1);
      if (!program.error.empty()) return;
      auto alignment = core_type_alignment(f.type);
      t.alignment = std::max(t.alignment, alignment);
      f.byte_offset = (t.size + alignment - 1) / alignment * alignment;
      t.size = f.byte_offset + core_type_size(f.type);
      f.index = t.cell_count; t.cell_count += core_type_cells(f.type);
      if (t.cell_count > 4096) { fail(field, "Foundation struct storage limit is 4,096 cells"); return; }
    }
    t.size = std::max(size_t(1), (t.size + t.alignment - 1) / t.alignment * t.alignment);
    t.cell_count = std::max(size_t(1), t.cell_count); layout_state[n] = 2;
  }
  void storage(TowerNode* local, CoreType type) {
    if (core_aggregate(type) && !core_node(type.record).items.empty()) {
      for (auto* field : core_node(type.record).items) storage(local, core_node(field).type);
    } else function().slots.push_back({local, core_aggregate(type) ? CoreType{} : type});
  }
  void add_local(TowerNode* n) {
    auto& local = core_node(n);
    if (function().slots.size() + core_type_cells(local.type) > 4096) { fail(n, "Foundation local storage limit is 4,096 cells"); return; }
    local.index = function().slots.size(); local.cell_count = core_type_cells(local.type);
    local.address_taken |= core_aggregate(local.type);
    function().locals.push_back(n); storage(n, local.type);
  }
  TowerNode* lookup(TowerNode* n) {
    auto name = identifier(tokens(n));
    for (auto it = scopes.rbegin(); it != scopes.rend(); ++it) { auto found = it->find(name); if (found != it->end()) return found->second; }
    fail(n, "Unknown local '" + name + "'"); return nullptr;
  }
  TowerNode* place(TowerNode* n, unsigned depth = 0) {
    if (label(n) == "CoreOperand" && tower_node_get_child_count(n) == 1) n = child(n, 0);
    if (depth > 128) { node(n, CoreKind::Operand); fail(n, "Foundation field path limit is 128"); return n; }
    if (core_get(n)) return n;
    if (label(n) != "CorePlace" || !member(n, "base")) {
      auto* name = label(n) == "CorePlace" ? member(n, "name") : n;
      if (!name) { fail(n, "Malformed CorePlace tree: missing capture 'name'"); return n; }
      auto& value = node(n, CoreKind::Operand); value.binding = lookup(name);
      if (value.binding) value.type = core_node(value.binding).type;
      return n;
    }
    if (!shape(n, {"base", "field"})) return n;
    auto& value = node(n, CoreKind::Field); value.left = place(member(n, "base"), depth + 1);
    if (!program.error.empty()) return n;
    auto parent = core_node(value.left).type;
    value.name = identifier(tokens(member(n, "field"))); value.indirect = parent.pointers == 1;
    if (parent.scalar != CoreScalar::Struct || parent.pointers > 1) { fail(n, "Field access requires a struct or a single pointer to a struct"); return n; }
    for (auto* field : core_node(parent.record).items) if (core_node(field).name == value.name) value.binding = field;
    if (!value.binding) { fail(n, "Unknown field '" + value.name + "' in '" + core_node(parent.record).name + "'"); return n; }
    value.type = core_node(value.binding).type; value.index = core_node(value.binding).index;
    value.name_id = program.names.size(); program.names.push_back(core_place_name(n));
    return n;
  }
  TowerNode* operand(TowerNode* n, const CoreType* expected = nullptr) {
    if (!n) { fail(n, "Missing operand"); return nullptr; }
    if (!literal(n)) n = place(n);
    if (!program.error.empty()) return n;
    auto& value = core_get(n) ? core_node(n) : node(n, CoreKind::Operand); auto text = tokens(n);
    if (literal(n)) {
      value.constant = true;
      if (text == "true" || text == "false") { value.type = {CoreScalar::Bool}; value.bits = text == "true"; }
      else {
        value.type = expected ? *expected : CoreType{};
        if (!integer(value.type)) fail(n, "An integer literal needs an integer type");
        bool negative = text[0] == '-'; uint64_t number = 0;
        for (size_t i = negative ? 1 : 0; i < text.size(); ++i) {
          if (text[i] < '0' || text[i] > '9' || number > 0xffffffffULL / 10) { fail(n, "Integer literal out of range"); break; }
          number = number * 10 + (text[i] - '0'); if (number > 0xffffffffULL) { fail(n, "Integer literal out of range"); break; }
        }
        uint64_t limit = value.type.scalar == CoreScalar::U32 ? 0xffffffffULL : negative ? 0x80000000ULL : 0x7fffffffULL;
        if (number > limit || (negative && value.type.scalar == CoreScalar::U32)) fail(n, "Integer literal out of range for " + core_type_name(value.type));
        value.bits = negative ? uint32_t(0) - uint32_t(number) : uint32_t(number);
      }
    }
    if (core_aggregate(value.type)) fail(n, "Struct values require field access or a pointer; aggregate copies are not implemented");
    if (expected && value.type != *expected) fail(n, "Expected " + core_type_name(*expected) + ", got " + core_type_name(value.type) + "; use an explicit conversion");
    return n;
  }
  TowerNode* call(TowerNode* n) {
    if (!shape(n, {"name"})) return nullptr;
    auto& value = node(n, CoreKind::Call); auto name = identifier(tokens(member(n, "name")));
    auto found = functions.find(name);
    if (found == functions.end()) { fail(n, "Unknown function '" + name + "'"); return n; }
    value.binding = found->second; auto& callee = core_node(value.binding); value.type = callee.type;
    auto args = collect(member(n, "args"), "CoreOperand");
    if (args.size() != callee.parameters.size()) { fail(n, "Wrong argument count for '" + name + "'"); return n; }
    for (size_t i = 0; i < args.size(); ++i) value.items.push_back(operand(args[i], &core_node(callee.parameters[i]).type));
    return n;
  }
  TowerNode* expression(TowerNode* n, CoreType expected) {
    if (label(n) == "CoreValue" && tower_node_get_child_count(n) == 1) n = child(n, 0);
    auto kind = label(n);
    if (kind == "CoreOperand") return operand(n, &expected);
    if (!n) { fail(n, "Missing expression"); return nullptr; }
    if (kind == "CoreCall") { if (!call(n)) return nullptr; }
    else if (kind == "CoreBinary") {
      if (!shape(n, {"left", "op", "right"})) return nullptr;
      auto& value = node(n, CoreKind::Binary); auto op = tokens(member(n, "op")); bool found = false;
      for (unsigned i = 0; i <= unsigned(CoreOp::Ge); ++i) if (op == core_operator(CoreOp(i))) { value.op = CoreOp(i); found = true; break; }
      if (!found) fail(n, "Unknown foundation binary operation");
      CoreType input = expected; bool comparison = value.op >= CoreOp::Eq;
      auto* left = member(n, "left"); auto* right = member(n, "right");
      if (comparison) {
        input = {};
        auto* named = !literal(left) ? left : !literal(right) ? right : nullptr;
        if (named) { auto* value = operand(named); if (value) input = core_node(value).type; }
        else if (tokens(left) == "true" || tokens(left) == "false") input = {CoreScalar::Bool};
      }
      value.left = operand(left, &input); value.right = operand(right, &input);
      value.type = comparison ? CoreType{CoreScalar::Bool} : input;
      if (!integer(input) && value.op != CoreOp::Eq && value.op != CoreOp::Ne) fail(n, "This operation requires integer operands");
    } else if (kind == "CoreAddress" || kind == "CoreLoad") {
      if (!shape(n, {"name"})) return nullptr;
      auto& value = node(n, kind == "CoreAddress" ? CoreKind::Address : CoreKind::Load);
      value.value = kind == "CoreAddress" ? place(member(n, "name")) : operand(member(n, "name"));
      if (!program.error.empty()) return n;
      value.type = core_node(value.value).type;
      if (value.kind == CoreKind::Address) {
        ++value.type.pointers;
        auto* base = value.value; while (core_node(base).kind == CoreKind::Field) base = core_node(base).left;
        auto* binding = core_node(base).binding; if (binding) core_node(binding).address_taken = true;
      } else if (!value.type.pointers) fail(n, "Load requires a pointer"); else --value.type.pointers;
    } else if (kind == "CoreConvert" || kind == "CoreBits") {
      if (!shape(n, {"type", "value"})) return nullptr;
      auto& value = node(n, kind == "CoreConvert" ? CoreKind::Convert : CoreKind::Bits);
      value.type = type(member(n, "type")); value.value = operand(member(n, "value")); auto from = core_node(value.value).type;
      if (value.type.pointers || from.pointers || value.type.scalar == CoreScalar::Void || core_aggregate(value.type)) fail(n, "Conversion requires matching scalar destination and scalar source");
      if (value.kind == CoreKind::Bits && (!integer(value.type) || !integer(from))) fail(n, "bits requires i32 or u32; pointer casts are not supported");
    } else { fail(n, "Unsupported foundation expression '" + kind + "'"); return nullptr; }
    if (core_aggregate(core_node(n).type)) fail(n, "Struct values require field access or a pointer; aggregate copies are not implemented");
    if (core_node(n).type != expected) fail(n, "Expected " + core_type_name(expected) + ", got " + core_type_name(core_node(n).type));
    return n;
  }
  void header(TowerNode* n) {
    if (!shape(n, {"name", "type", "body"})) return;
    auto& fn = node(n, CoreKind::Function); fn.name = identifier(tokens(member(n, "name"))); fn.type = type(member(n, "type"));
    if (core_aggregate(fn.type)) fail(n, "Struct returns require a pointer; by-value returns are not implemented");
    if (fn.name.empty() || functions.contains(fn.name)) { fail(n, "Missing or duplicate function '" + fn.name + "'"); return; }
    if (program.functions.size() >= 256) { fail(n, "Foundation function limit is 256"); return; }
    fn.index = program.functions.size(); functions[fn.name] = n; program.functions.push_back(n);
    std::map<std::string, bool> names;
    for (auto* p : collect(member(n, "params"), "CoreParameter")) {
      if (!shape(p, {"name", "type"})) return;
      auto& param = node(p, CoreKind::Parameter); param.name = identifier(tokens(member(p, "name"))); param.type = type(member(p, "type"));
      if (param.type.scalar == CoreScalar::Void || param.name.empty() || names.contains(param.name)) fail(p, "Invalid or duplicate function parameter");
      if (core_aggregate(param.type)) fail(p, "Struct parameters require a pointer; by-value arguments are not implemented");
      names[param.name] = true; auto* saved = current; current = n; add_local(p); current = saved; fn.parameters.push_back(p);
    }
    if (fn.parameters.size() > 64) fail(n, "Foundation parameter limit is 64");
  }
  unsigned block(TowerNode* n, unsigned depth) {
    if (!n || label(n) != "CoreBlock") { fail(n, "Expected a CoreBlock tree"); return Next; }
    auto& value = node(n, CoreKind::Block); scopes.emplace_back(); unsigned flow = Next;
    for (size_t i = 0; i < tower_node_get_child_count(n) && program.error.empty(); ++i) {
      auto* at = child(n, i);
      if (label(at) == "Statement") {
        at = unwrap(at); unsigned next = statement(at, depth + 1);
        if (label(at) == "CoreCallStatement") at = member(at, "call");
        value.items.push_back(at); if (flow & Next) flow = (flow & ~Next) | next;
      } else if (label(at) != "{" && label(at) != "}") fail(at, "Malformed CoreBlock tree");
    }
    for (auto& [name, local] : scopes.back()) value.locals.push_back(local);
    scopes.pop_back(); return flow;
  }
  unsigned statement(TowerNode* n, unsigned depth = 0) {
    if (depth > 128) { fail(n, "Foundation block nesting limit is 128"); return Next; }
    if (!program.error.empty()) return Next;
    auto kind = label(n);
    if (kind == "CoreDeclare") {
      if (!shape(n, {"name", "type"})) return Next;
      auto& value = node(n, CoreKind::Declare); value.name = identifier(tokens(member(n, "name"))); value.type = type(member(n, "type"));
      if (value.name.empty() || scopes.back().contains(value.name)) { fail(n, "Missing or duplicate local '" + value.name + "'"); return Next; }
      if (value.type.scalar == CoreScalar::Void) fail(n, "A local cannot have void type");
      add_local(n); scopes.back()[value.name] = n;
      if (auto* initial = member(n, "value")) value.value = expression(initial, value.type);
    } else if (kind == "CoreAssign") {
      if (!shape(n, {"target", "value"}) || !shape(member(n, "target"), {"name"})) return Next;
      auto& value = node(n, CoreKind::Assign); auto* target = member(n, "target");
      value.target = place(member(target, "name")); if (!program.error.empty()) return Next;
      auto expected = core_node(value.target).type;
      if (tokens(child(target, 0)) == "*") {
        auto& dest = node(target, CoreKind::Load); dest.value = value.target; dest.type = expected;
        if (!expected.pointers) fail(target, "Store requires a pointer"); else --expected.pointers;
        dest.type = expected; value.target = target;
      }
      if (core_aggregate(expected)) fail(target, "Struct values require field access or a pointer; aggregate copies are not implemented");
      value.value = expression(member(n, "value"), expected);
    } else if (kind == "CoreCallStatement") call(member(n, "call"));
    else if (kind == "CoreReturn") {
      auto& value = node(n, CoreKind::Return); auto* returned = member(n, "value");
      bool present = !tokens(returned).empty();
      if (function().type.scalar == CoreScalar::Void) { if (present) fail(n, "A void function cannot return a value"); }
      else if (!present) fail(n, "A non-void function must return a value");
      else value.value = operand(returned, &function().type);
      return Return;
    } else if (kind == "CoreFunction") fail(n, "Functions must be declared at top level");
    else if (kind == "CoreStruct") fail(n, "Struct types must be declared at top level");
    else if (kind == "CoreBlock") return block(n, depth);
    else if (kind == "CorePrint") { auto& value = node(n, CoreKind::Print); value.value = operand(member(n, "value")); }
    else if (kind == "CoreIf") {
      if (!shape(n, {"condition", "body"})) return Next;
      auto& value = node(n, CoreKind::If); CoreType boolean{CoreScalar::Bool}; value.value = operand(member(n, "condition"), &boolean);
      value.body = member(n, "body"); auto yes = block(value.body, depth); unsigned no = Next;
      value.otherwise = member(n, "otherwise"); if (value.otherwise) no = block(value.otherwise, depth);
      auto& condition = core_node(value.value); return condition.constant ? condition.bits ? yes : no : yes | no;
    } else if (kind == "CoreLoop") {
      auto& value = node(n, CoreKind::Loop); value.body = member(n, "body"); ++loops; auto flow = block(value.body, depth); --loops;
      return (flow & Return) | ((flow & Break) ? Next : 0);
    } else if (kind == "CoreBreak" || kind == "CoreContinue") {
      node(n, kind == "CoreBreak" ? CoreKind::Break : CoreKind::Continue);
      if (!loops) fail(n, kind + " requires an enclosing loop"); return kind == "CoreBreak" ? Break : Continue;
    } else fail(n, "No execution semantics for '" + kind + "'; replace it with a foundation operation");
    return Next;
  }
};
CoreProgram compile(const char* source, size_t prefix) {
  Compiler compiler; compiler.prefix = prefix; auto* session = syntax_create(source); size_t count = 0;
  auto& statements = core_node(compiler.program.root).items;
  while (compiler.program.error.empty()) {
    auto revision = syntax_get_revision(session); auto* root = syntax_next(session); if (!root) break;
    if (revision == syntax_get_revision(session)) {
      auto* n = unwrap(child(root, 0)); tower_node_attach(root, compiler.program.root); statements.push_back(n);
    }
    tower_node_release_ref(root);
    if (++count > 1024) compiler.fail(nullptr, "Foundation source limit is 1,024 top-level nodes");
  }
  if (compiler.program.error.empty() && *syntax_get_error(session)) {
    compiler.program.error = syntax_get_error(session); auto at = syntax_get_error_offset(session);
    compiler.program.error_offset = at > prefix ? at - prefix : 0;
  }
  syntax_destroy(session);
  for (auto* n : statements) if (compiler.program.error.empty() && label(n) == "CoreStruct") compiler.type_header(n);
  for (size_t i = 4; i < compiler.program.types.size() && compiler.program.error.empty(); ++i) compiler.type_fields(compiler.program.types[i]);
  for (size_t i = 4; i < compiler.program.types.size() && compiler.program.error.empty(); ++i) compiler.layout(compiler.program.types[i]);
  for (auto* n : statements) if (compiler.program.error.empty() && label(n) == "CoreFunction") compiler.header(n);
  for (auto*& n : statements) if (label(n) != "CoreFunction" && label(n) != "CoreStruct") {
    compiler.statement(n); if (label(n) == "CoreCallStatement") n = member(n, "call");
  }
  for (size_t i = 1; i < compiler.program.functions.size() && compiler.program.error.empty(); ++i) {
    auto* n = compiler.program.functions[i]; auto& fn = core_node(n); compiler.current = n;
    compiler.scopes = {std::map<std::string, TowerNode*>{}}; compiler.loops = 0;
    for (auto* p : fn.parameters) compiler.scopes.back()[core_node(p).name] = p;
    fn.body = member(n, "body"); auto flow = compiler.block(fn.body, 0);
    if (fn.type.scalar != CoreScalar::Void && (flow & Next)) compiler.fail(n, "Function '" + fn.name + "' can finish without returning a value");
  }
  for (auto* fn : compiler.program.functions) for (auto* local : core_node(fn).locals) {
    auto& value = core_node(local); value.name_id = compiler.program.names.size(); compiler.program.names.push_back(value.name);
  }
  return std::move(compiler.program);
}
}
CoreProgram core_compile(const char* source) { return compile(source, 0); }
void core_set_foundation(const std::string& grammar) { foundation_grammar = syntax_set_bootstrap(grammar.c_str()); }
CoreProgram core_compile_foundation(const char* source) {
  if (!foundation_grammar.empty()) { CoreProgram p; p.error = foundation_grammar; return p; }
  return compile(source, 0);
}
#if defined(__wasm__)
extern "C" __attribute__((export_name("tw_set_foundation"))) int tw_set_foundation(const char* source, size_t length) {
  if (!source || length > 131072) return 0; core_set_foundation(std::string(source, length)); return 1;
}
#endif
