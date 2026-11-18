#include "core.hpp"
#include <algorithm>
#include "compiler-generics.hpp"
#include <map>
#include <initializer_list>
#include <utility>
#include <set>

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
bool integer(CoreType t) { return core_integer(t); }
bool literal(TowerNode* n) {
  auto text = tokens(n);
  return !text.empty() && (text == "true" || text == "false" || text == "null" || text[0] == '\'' || text[0] == '"' || text[0] == '-' || (text[0] >= '0' && text[0] <= '9'));
}
enum Flow : unsigned { Next = 1, Break = 2, Continue = 4, Return = 8 };
struct Compiler {
  CoreProgram program;
  TowerNode* current = program.root;
  size_t prefix = 0, count = 0, loops = 0;
  unsigned value_depth = 0;
  std::map<std::string, TowerNode*> functions;
  std::map<std::string, TowerNode*> types;
  std::map<std::string, TowerNode*> globals;
  GenericContext* generics = nullptr;
  std::map<std::string, TowerNode*> templates, type_functions;
  std::map<TowerNode*, CoreType> type_results;
  std::vector<TowerNode*> type_arguments, generated;
  std::set<std::string> source_names;
  std::set<TowerNode*> template_nodes, fields_done, resolving_types;
  const char* source = "";
  unsigned type_depth = 0;
  std::map<TowerNode*, unsigned> layout_state;
  std::map<TowerNode*, unsigned> declaration_state;
  std::vector<TowerNode*> inferring;
  std::vector<std::map<std::string, TowerNode*>> scopes{1};
  explicit Compiler(unsigned width) : program(width), current(program.root) {
    for (auto* type : program.types) types.emplace(core_node(type).name, type);
    generics = generic_begin(program.root);
  }
  CoreNode& function() { return core_node(current); }
  size_t offset(TowerNode* n) { auto* m = match(n); auto start = m ? parser_match_get_start(m) : 0; return start > prefix ? start - prefix : 0; }
  void fail(TowerNode* n, const std::string& text) {
    if (!program.error.empty()) return;
    program.error = text; program.error_offset = offset(n);
    std::set<TowerNode*> seen;
    for (auto* use = generic_origin(generics, n); use && seen.size() < 8 && seen.insert(use).second; use = generic_origin(generics, use)) {
      const auto at = offset(use); size_t line = 1, column = 1;
      for (size_t i = 0; i < at && source[i]; ++i) { if (source[i] == '\n') { ++line; column = 1; } else ++column; }
      program.error += "\nInstantiated by " + tokens(use) + " at line " + std::to_string(line) + ", column " + std::to_string(column) + ".";
    }
  }
  bool generic_ok(TowerNode* at) { if (auto* error = generic_error(generics)) fail(at, error); return program.error.empty(); }
  TowerNode* type_entity(CoreType t) {
    for (auto* n : program.types) if (core_node(n).type == t) return n;
    for (auto* n : type_arguments) if (core_node(n).type == t) return n;
    auto* n = tower_node_create(); tower_node_attach(n, program.root);
    auto& value = core_attach(n, CoreKind::Type); value.type = t; value.name = core_type_name(t);
    type_arguments.push_back(n); tower_node_release_ref(n); return n;
  }
  std::string instance_name(TowerNode* definition, const std::vector<TowerNode*>& arguments) {
    auto name = identifier(tokens(member(definition, "name"))) + "(";
    for (size_t i = 0; i < arguments.size(); ++i) { if (i) name += ", "; name += core_type_name(core_node(arguments[i]).type); }
    name += ")"; auto unique = name; size_t suffix = 1;
    while (source_names.contains(unique) || types.contains(unique) || functions.contains(unique)) unique = name + "_" + std::to_string(++suffix);
    return unique;
  }
  void register_template(TowerNode* n) {
    auto kind = generic_register(generics, n); if (!generic_ok(n) || !kind) return;
    auto name = identifier(tokens(member(n, "name")));
    if (label(n) != "CoreFunction") { fail(n, "Templates cannot be extern or export declarations; export a concrete wrapper"); return; }
    std::set<std::string> names;
    for (auto* parameter : collect(member(n, "params"), "CoreParameter")) {
      auto value = identifier(tokens(member(parameter, "name")));
      if (!names.insert(value).second) { fail(parameter, "Duplicate template parameter '" + value + "'"); return; }
    }
    auto& registry = kind == 2 ? type_functions : templates;
    if (!registry.emplace(name, n).second) { fail(n, "Duplicate template '" + name + "'"); return; }
    for (const auto& definition : core_builtins()) if (name == definition.name) fail(n, "Template name '" + name + "' already names a foundation builtin");
    template_nodes.insert(n);
  }
  CoreType type_call(TowerNode* n) {
    auto name = identifier(tokens(member(n, "name"))); auto found = type_functions.find(name);
    CoreType invalid{CoreScalar::I32, 0, nullptr, program.pointer_bytes};
    if (found == type_functions.end()) { fail(n, "Unknown type constructor '" + name + "'"); return invalid; }
    auto args = collect(member(n, "args"), label(n) == "CoreCall" ? "CoreCallArgument" : "CoreType");
    if (args.size() != generic_parameter_count(generics, found->second)) { fail(n, "Wrong argument count for type constructor '" + name + "'"); return invalid; }
    std::vector<TowerNode*> arguments;
    for (auto* arg : args) { arguments.push_back(type_entity(type(arg))); if (!program.error.empty()) return invalid; }
    auto* instance = generic_instantiate(generics, found->second, n, arguments.data(), arguments.size());
    if (!generic_ok(n) || !instance) return invalid;
    if (auto result = type_results.find(instance); result != type_results.end()) return result->second;
    if (!resolving_types.insert(instance).second) { fail(n, "Recursive type constructor '" + name + "' has no concrete struct to resolve"); return invalid; }
    auto* result = generic_type_result(generics, instance);
    if (!generic_ok(n) || !result) return invalid;
    if (label(result) == "CoreStruct") {
      type_header(result, instance_name(found->second, arguments));
      if (!program.error.empty()) return invalid;
      auto t = core_node(result).type; type_results[instance] = t; generated.push_back(result);
      type_fields(result); resolving_types.erase(instance); return t;
    }
    auto t = type(result); type_results[instance] = t; resolving_types.erase(instance); return t;
  }
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
    struct Depth { unsigned& value; ~Depth() { --value; } } depth{type_depth};
    if (++type_depth > 128) { fail(n, "Type construction nesting exceeds 128; check recursive type arguments"); return {}; }
    while ((label(n) == "CoreCallArgument" || label(n) == "CoreOperand") && tower_node_get_child_count(n) == 1) n = child(n, 0);
    if ((label(n) == "CoreType" || label(n) == "CoreCall") && member(n, "args")) return type_call(n);
    // Types are ordinary identifier references. This bootstrap registry is the
    // first semantic namespace; type spellings are absent from the grammar.
    if (auto* base = member(n, "base")) {
      auto t = type(base);
      auto* count = member(n, "count"); if (!count) count = member(n, "index");
      if (count) {
        auto digits = tokens(count);
        if (digits.empty() || digits.find_first_not_of("0123456789") != std::string::npos) { fail(n, "Array type requires a constant positive length"); return t; }
        uint64_t length = 0;
        for (char c : tokens(count)) { length = length * 10 + (c - '0'); if (length > 1048576) break; }
        if (!length || length > 1048576) { fail(n, "Array length must be between 1 and 1,048,576"); return t; }
        if (!t.pointers && t.scalar == CoreScalar::Void) { fail(n, "An array cannot have void elements"); return t; }
        auto name = core_type_name(t) + "[" + std::to_string(length) + "]";
        // Composite identity is semantic, not its display spelling. A quoted
        // user struct named `i32[2]` must not alias the fixed array i32[2].
        for (auto* candidate : program.types) {
          auto& a = core_node(candidate);
          if (a.type.scalar == CoreScalar::Array && a.element == t && a.length == length) return a.type;
        }
        auto* entity = tower_node_create(); tower_node_attach(entity, program.root);
        auto& a = core_attach(entity, CoreKind::Type); a.name = name; a.element = t; a.length = size_t(length);
        a.type = {CoreScalar::Array, 0, entity, program.pointer_bytes}; program.types.push_back(entity);
        tower_node_release_ref(entity); return a.type;
      }
      if (member(n, "field")) { fail(n, "Expected a type name, not field access"); return t; }
      if (++t.pointers > 16) fail(n, "Foundation pointer nesting limit is 16");
      return t;
    }
    auto text = identifier(tokens(n)); CoreType t{CoreScalar::I32, 0, nullptr, program.pointer_bytes};
    // A type constructor's local struct retains its lexical self name, even
    // though canonical output gives the instance a unique concrete name.
    if (generic_origin(generics, n))
      for (auto* parent = tower_node_get_parent(n); parent; parent = tower_node_get_parent(parent)) {
        if (label(parent) == "CoreStruct" && core_get(parent) && text == identifier(tokens(member(parent, "name")))) return core_node(parent).type;
      }
    if (auto* bound = generic_lookup(generics, n, n)) return core_node(bound).type;
    if (text == "type") { fail(n, "Type values currently require a template parameter or a type-constructor result"); return t; }
    auto found = types.find(text);
    if (found == types.end()) fail(n, "Unknown type '" + text + "'");
    else t = core_node(found->second).type;
    return t;
  }
  void type_header(TowerNode* n, const std::string& name = {}) {
    if (!shape(n, {"name", "fields"})) return;
    auto& t = node(n, CoreKind::Type); t.name = name.empty() ? identifier(tokens(member(n, "name"))) : name;
    if (t.name.empty() || t.name == "type" || types.contains(t.name) || type_functions.contains(t.name)) { fail(n, "Missing or duplicate type '" + t.name + "'"); return; }
    if (program.types.size() >= 260) { fail(n, "Foundation struct type limit is 256"); return; }
    t.type = {CoreScalar::Struct, 0, n, program.pointer_bytes}; types[t.name] = n; program.types.push_back(n);
  }
  void type_fields(TowerNode* n) {
    if (!fields_done.insert(n).second) return;
    auto& t = core_node(n); std::map<std::string, bool> names;
    for (auto* field : collect(member(n, "fields"), "CoreField")) {
      if (!shape(field, {"name", "type"})) return;
      auto& f = node(field, CoreKind::FieldDeclaration); f.name = identifier(tokens(member(field, "name"))); f.type = type(member(field, "type"));
      if (f.name.empty() || names.contains(f.name)) fail(field, "Missing or duplicate field '" + f.name + "'");
      if (!f.type.pointers && f.type.scalar == CoreScalar::Void) fail(field, "A field cannot have void type");
      names[f.name] = true; t.items.push_back(field);
      if (t.items.size() > 256) { fail(field, "Foundation field limit is 256"); return; }
    }
  }
  void layout(TowerNode* n, unsigned depth = 0) {
    if (!program.error.empty() || layout_state[n] == 2) return;
    if (layout_state[n] == 1) { fail(n, "Recursive by-value layout for '" + core_node(n).name + "'; use a pointer"); return; }
    if (depth > 128) { fail(n, "Foundation type nesting limit is 128"); return; }
    layout_state[n] = 1; auto& t = core_node(n); t.size = 0;
    if (t.type.scalar == CoreScalar::Array) {
      if (core_aggregate(t.element)) layout(t.element.record, depth + 1);
      auto size = core_type_size(t.element);
      if (size > CORE_STACK_BYTES / t.length) fail(n, "Array storage exceeds 4 MiB");
      t.size = size * t.length; t.alignment = core_type_alignment(t.element); layout_state[n] = 2; return;
    }
    for (auto* field : t.items) {
      auto& f = core_node(field);
      if (core_aggregate(f.type)) layout(f.type.record, depth + 1);
      if (!program.error.empty()) return;
      auto alignment = core_type_alignment(f.type);
      t.alignment = std::max(t.alignment, alignment);
      f.byte_offset = (t.size + alignment - 1) / alignment * alignment;
      t.size = f.byte_offset + core_type_size(f.type);
      if (t.size > CORE_STACK_BYTES) { fail(field, "Foundation struct storage exceeds 4 MiB"); return; }
    }
    t.size = std::max(size_t(1), (t.size + t.alignment - 1) / t.alignment * t.alignment);
    layout_state[n] = 2;
  }
  void add_local(TowerNode* n) {
    auto& local = core_node(n);
    if (core_aggregate(local.type)) layout(local.type.record);
    auto alignment = core_type_alignment(local.type);
    local.index = function().locals.size(); local.byte_offset = (function().frame_size + alignment - 1) / alignment * alignment;
    function().frame_size = local.byte_offset + core_type_size(local.type);
    if (function().frame_size > CORE_STACK_BYTES) fail(n, "Foundation local storage exceeds 4 MiB");
    function().locals.push_back(n);
  }
  TowerNode* lookup(TowerNode* n) {
    auto name = identifier(tokens(n));
    for (auto it = scopes.rbegin(); it != scopes.rend(); ++it) {
      auto found = it->find(name);
      if (found != it->end()) return declaration_type(found->second) ? found->second : nullptr;
    }
    if (auto found = globals.find(name); found != globals.end()) return declaration_type(found->second) ? found->second : nullptr;
    fail(n, "Unknown local '" + name + "'"); return nullptr;
  }
  bool declaration_type(TowerNode* n) {
    auto& value = core_node(n);
    if (value.kind != CoreKind::Declare || declaration_state[n] == 2) return true;
    if (declaration_state[n] == 1) {
      std::string chain;
      auto begin = std::find(inferring.begin(), inferring.end(), n);
      for (auto it = begin; it != inferring.end(); ++it) chain += core_node(*it).name + " -> ";
      fail(n, "Cannot infer the type of '" + value.name + "': initializer dependency cycle " + chain + value.name + "; add an explicit type annotation");
      return false;
    }
    if (auto* annotation = member(n, "type")) value.type = type(annotation);
    else {
      auto* initial = member(n, "value");
      if (!initial) { fail(n, "Variable '" + value.name + "' requires a type annotation or an initializer"); return false; }
      if (inferring.size() >= 128) { fail(n, "Foundation inferred-type dependency limit is 128"); return false; }
      declaration_state[n] = 1; inferring.push_back(n);
      value.value = expression(initial);
      inferring.pop_back();
      if (!program.error.empty() || !value.value) return false;
      value.type = core_node(value.value).type;
      value.type.pointer_bytes = program.pointer_bytes;
    }
    if (!value.type.pointers && value.type.scalar == CoreScalar::Void) fail(n, "A variable cannot have void type");
    if (!program.error.empty()) return false;
    declaration_state[n] = 2; return true;
  }
  TowerNode* location(TowerNode* n, unsigned depth = 0) {
    while ((label(n) == "CoreCallArgument" || label(n) == "CoreOperand") && tower_node_get_child_count(n) == 1) n = child(n, 0);
    if (label(n) == "CorePointerArgument") { node(n, CoreKind::Operand); fail(n, "Expected a value argument, got a type spelling"); return n; }
    if (depth > 128) { node(n, CoreKind::Operand); fail(n, "Foundation field path limit is 128"); return n; }
    if (core_get(n)) return n;
    if (label(n) != "CoreLocation" || !member(n, "base")) {
      auto* name = label(n) == "CoreLocation" ? member(n, "name") : n;
      if (!name) { fail(n, "Malformed CoreLocation tree: missing capture 'name'"); return n; }
      auto& value = node(n, CoreKind::Operand); value.binding = lookup(name);
      if (value.binding) value.type = core_node(value.binding).type;
      return n;
    }
    if (auto* index = member(n, "index")) {
      auto& value = node(n, CoreKind::Index); value.left = location(member(n, "base"), depth + 1);
      if (!program.error.empty()) return n;
      auto parent = core_node(value.left).type; value.indirect = parent.pointers != 0;
      if (parent.pointers) { --parent.pointers; value.type = parent; }
      else if (parent.scalar == CoreScalar::Array) value.type = core_node(parent.record).element;
      else { fail(n, "Indexing requires a pointer or an array"); return n; }
      if (core_aggregate(value.type)) layout(value.type.record);
      if (!core_type_size(value.type)) { fail(n, "Cannot index a void pointer"); return n; }
      CoreType size{CoreScalar::USize, 0, nullptr, program.pointer_bytes};
      value.right = operand(index, literal(index) ? &size : nullptr);
      if (!program.error.empty()) return n;
      if (!integer(core_node(value.right).type)) fail(index, "An index must be an integer");
      return n;
    }
    if (!shape(n, {"base", "field"})) return n;
    auto& value = node(n, CoreKind::Field); value.left = location(member(n, "base"), depth + 1);
    if (!program.error.empty()) return n;
    auto parent = core_node(value.left).type;
    value.name = identifier(tokens(member(n, "field"))); value.indirect = parent.pointers == 1;
    if (parent.scalar != CoreScalar::Struct || parent.pointers > 1) { fail(n, "Field access requires a struct or a single pointer to a struct"); return n; }
    layout(parent.record); if (!program.error.empty()) return n;
    for (auto* field : core_node(parent.record).items) if (core_node(field).name == value.name) value.binding = field;
    if (!value.binding) { fail(n, "Unknown field '" + value.name + "' in '" + core_node(parent.record).name + "'"); return n; }
    value.type = core_node(value.binding).type; value.byte_offset = core_node(value.binding).byte_offset;
    return n;
  }
  TowerNode* operand(TowerNode* n, const CoreType* expected = nullptr) {
    if (!n) { fail(n, "Missing operand"); return nullptr; }
    struct Depth { unsigned& value; ~Depth() { --value; } } depth{value_depth};
    if (++value_depth > 128) { fail(n, "Foundation expression nesting limit is 128"); return n; }
    while ((label(n) == "CoreCallArgument" || label(n) == "CoreOperand") && tower_node_get_child_count(n) == 1) n = child(n, 0);
    if (label(n) == "CoreCall") {
      if ((!core_get(n) && !call(n)) || !program.error.empty()) return n;
      if (!core_node(n).type.pointers && core_node(n).type.scalar == CoreScalar::Void) {
        fail(n, "A void call cannot be used as a value"); return n;
      }
    } else if (label(n) == "CoreAddress" || label(n) == "CoreLoad") {
      if (!shape(n, {"name"})) return n;
      const bool address = label(n) == "CoreAddress";
      auto& value = node(n, address ? CoreKind::Address : CoreKind::Load);
      value.value = address ? location(member(n, "name")) : operand(member(n, "name"));
      if (!program.error.empty()) return n;
      value.type = core_node(value.value).type;
      if (address) ++value.type.pointers;
      else if (!value.type.pointers) { fail(n, "Load requires a pointer"); return n; }
      else --value.type.pointers;
    } else if (!literal(n)) n = location(n);
    if (!program.error.empty()) return n;
    auto& value = core_get(n) ? core_node(n) : node(n, CoreKind::Operand); auto text = tokens(n);
    if (literal(n)) {
      value.constant = true;
      if (text == "true" || text == "false") { value.type = {CoreScalar::Bool}; value.bits = text == "true"; }
      else if (text == "null") {
        value.type = expected ? *expected : CoreType{CoreScalar::Void, 1, nullptr, program.pointer_bytes};
        value.bits = 0; if (!value.type.pointers) fail(n, "null requires a pointer type");
      } else if (text[0] == '\'' || text[0] == '"') {
        value.kind = CoreKind::String; value.type = {CoreScalar::U8, 1, nullptr, program.pointer_bytes};
        for (size_t i = 1; i + 1 < text.size(); ++i) {
          char c = text[i]; if (c == '\\' && i + 2 < text.size()) { c = text[++i]; if (c == 'n') c = '\n'; else if (c == 'r') c = '\r'; else if (c == 't') c = '\t'; }
          value.name += c;
        }
      }
      else {
        value.type = expected ? *expected : CoreType{};
        if (!integer(value.type)) { fail(n, "An integer literal needs an integer type"); return n; }
        bool negative = text[0] == '-'; uint64_t number = 0;
        for (size_t i = negative ? 1 : 0; i < text.size(); ++i) {
          auto digit = unsigned(text[i] - '0');
          if (digit > 9 || number > (UINT64_MAX - digit) / 10) { fail(n, "Integer literal out of range"); break; }
          number = number * 10 + digit;
        }
        uint64_t limit = core_signed(value.type) ? (uint64_t(1) << (core_width(value.type) - 1)) - (negative ? 0 : 1) : core_mask(value.type);
        if (number > limit || (negative && !core_signed(value.type))) fail(n, "Integer literal out of range for " + core_type_name(value.type));
        value.bits = (negative ? uint64_t(0) - number : number) & core_mask(value.type);
      }
    }
    if (core_aggregate(value.type)) fail(n, "Struct values require field access or a pointer; aggregate copies are not implemented");
    if (expected && value.type != *expected) fail(n, "Expected " + core_type_name(*expected) + ", got " + core_type_name(value.type) + "; use an explicit conversion");
    return n;
  }
  TowerNode* builtin(TowerNode* n, const CoreBuiltin& definition, const std::vector<TowerNode*>& args) {
    auto& value = node(n, definition.kind); value.type = {CoreScalar::Void};
    if (args.size() != definition.arguments) { fail(n, "Wrong argument count for '" + std::string(definition.name) + "': expected " + std::to_string(definition.arguments)); return n; }
    CoreType size{CoreScalar::USize, 0, nullptr, program.pointer_bytes}, byte{CoreScalar::U8};
    switch (value.kind) {
      case CoreKind::Print: value.value = operand(args[0]); break;
      case CoreKind::Free: case CoreKind::Copy: case CoreKind::Fill:
        value.left = operand(args[0]); if (!program.error.empty()) return n;
        if (!core_node(value.left).type.pointers) fail(n, "Memory operations require a pointer");
        if (value.kind != CoreKind::Free) {
          value.value = operand(args[2], &size);
          value.right = operand(args[1], value.kind == CoreKind::Fill ? &byte : nullptr);
          if (!program.error.empty()) return n;
          if (value.kind == CoreKind::Copy && !core_node(value.right).type.pointers) fail(n, "copy requires source and destination pointers");
        }
        break;
      case CoreKind::SizeOf: case CoreKind::AlignOf:
        value.element = type(args[0]); if (core_aggregate(value.element)) layout(value.element.record); value.type = size; break;
      case CoreKind::Allocate: case CoreKind::Reallocate:
        value.element = type(args[0]); if (core_aggregate(value.element)) layout(value.element.record);
        if (!core_type_size(value.element)) { fail(n, "Cannot allocate void elements"); return n; }
        value.type = value.element; ++value.type.pointers;
        value.right = operand(args.back(), &size);
        if (value.kind == CoreKind::Reallocate) value.left = operand(args[1], &value.type);
        break;
      case CoreKind::Convert: case CoreKind::Bits: {
        value.type = type(args[0]); value.value = operand(args[1]); if (!program.error.empty()) return n;
        auto from = core_node(value.value).type;
        if (core_aggregate(value.type) || (!value.type.pointers && value.type.scalar == CoreScalar::Void)) fail(n, "Conversion requires scalar values");
        if (value.kind == CoreKind::Convert && (value.type.pointers || from.pointers)) fail(n, "Pointer reinterpretation requires bits");
        if (value.kind == CoreKind::Bits && (core_width(value.type) != core_width(from) || (!integer(value.type) && !value.type.pointers) || (!integer(from) && !from.pointers)))
          fail(n, "bits requires equal-width integers or pointers");
        break;
      }
      default: fail(n, "Unsupported foundation builtin"); break;
    }
    return n;
  }
  TowerNode* call(TowerNode* n) {
    if (!shape(n, {"name"})) return nullptr;
    auto name = identifier(tokens(member(n, "name")));
    auto args = collect(member(n, "args"), "CoreCallArgument");
    for (const auto& definition : core_builtins()) if (name == definition.name) return builtin(n, definition, args);
    if (type_functions.contains(name)) { fail(n, "Type constructor '" + name + "' produces a type, not a runtime value"); return n; }
    if (auto found = templates.find(name); found != templates.end()) {
      auto* definition = found->second;
      if (args.size() != generic_parameter_count(generics, definition)) { fail(n, "Wrong argument count for template '" + name + "'"); return n; }
      std::vector<TowerNode*> arguments, values;
      for (size_t i = 0; i < args.size(); ++i) {
        if (generic_type_parameter(generics, definition, i)) arguments.push_back(type_entity(type(args[i])));
        else values.push_back(args[i]);
        if (!program.error.empty()) return n;
      }
      auto* instance = generic_instantiate(generics, definition, n, arguments.data(), arguments.size());
      if (!generic_ok(n) || !instance) return n;
      if (!core_get(instance)) {
        header(instance, instance_name(definition, arguments), definition);
        if (!program.error.empty()) return n;
        generated.push_back(instance);
      }
      auto& value = node(n, CoreKind::Call); auto& callee = core_node(instance);
      value.binding = instance; value.type = callee.type;
      for (size_t i = 0; i < values.size(); ++i) value.items.push_back(operand(values[i], &core_node(callee.parameters[i]).type));
      return n;
    }
    auto& value = node(n, CoreKind::Call);
    auto found = functions.find(name);
    if (found == functions.end()) { fail(n, "Unknown function '" + name + "'"); return n; }
    value.binding = found->second; auto& callee = core_node(value.binding); value.type = callee.type;
    if (args.size() != callee.parameters.size()) { fail(n, "Wrong argument count for '" + name + "'"); return n; }
    for (size_t i = 0; i < args.size(); ++i) value.items.push_back(operand(args[i], &core_node(callee.parameters[i]).type));
    return n;
  }
  TowerNode* expression(TowerNode* n, const CoreType* expected = nullptr) {
    if (label(n) == "CoreValue" && tower_node_get_child_count(n) == 1) n = child(n, 0);
    auto kind = label(n);
    if (kind == "CoreOperand" || kind == "CoreAddress" || kind == "CoreLoad") return operand(n, expected);
    if (!n) { fail(n, "Missing expression"); return nullptr; }
    if (kind == "CoreCall") { if (!call(n)) return nullptr; }
    else if (kind == "CoreBinary") {
      if (!shape(n, {"left", "op", "right"})) return nullptr;
      auto& value = node(n, CoreKind::Binary); auto op = tokens(member(n, "op")); bool found = false;
      for (unsigned i = 0; i <= unsigned(CoreOp::Ge); ++i) if (op == core_operator(CoreOp(i))) { value.op = CoreOp(i); found = true; break; }
      if (!found) fail(n, "Unknown foundation binary operation");
      CoreType input = expected ? *expected : CoreType{}; bool comparison = value.op >= CoreOp::Eq;
      auto* left = member(n, "left"); auto* right = member(n, "right");
      if (comparison || !expected) {
        // Concrete operand types constrain literal peers. Two bare numeric
        // literals default to i32; there is no widening between typed values.
        auto* anchor = !literal(left) ? left : !literal(right) ? right : left;
        auto* known = operand(anchor);
        if (!program.error.empty() || !known) return n;
        input = core_node(known).type;
      }
      value.left = operand(left, &input);
      if (!program.error.empty()) return n;
      bool pointer_offset = input.pointers && (value.op == CoreOp::Add || value.op == CoreOp::Sub);
      CoreType size{CoreScalar::USize, 0, nullptr, program.pointer_bytes};
      value.right = operand(right, pointer_offset ? literal(right) ? &size : nullptr : &input);
      if (!program.error.empty()) return n;
      value.type = comparison ? CoreType{CoreScalar::Bool} : input;
      if (pointer_offset) {
        if (!integer(core_node(value.right).type)) fail(n, "A pointer offset must be an integer");
        auto element = input; --element.pointers; if (core_aggregate(element)) layout(element.record);
        if (!core_type_size(element)) fail(n, "Cannot offset a void pointer");
      } else if (!integer(input) && value.op != CoreOp::Eq && value.op != CoreOp::Ne) fail(n, "This operation requires integer operands");
    } else { fail(n, "Unsupported foundation expression '" + kind + "'"); return nullptr; }
    if (core_aggregate(core_node(n).type)) fail(n, "Struct values require field access or a pointer; aggregate copies are not implemented");
    if (expected && core_node(n).type != *expected) fail(n, "Expected " + core_type_name(*expected) + ", got " + core_type_name(core_node(n).type));
    return n;
  }
  void header(TowerNode* n, const std::string& name = {}, TowerNode* definition = nullptr) {
    bool external = label(n) == "CoreExternal";
    if (!shape(n, {"name", "type"}) || (!external && !shape(n, {"body"}))) return;
    auto& fn = node(n, CoreKind::Function); fn.name = name.empty() ? identifier(tokens(member(n, "name"))) : name; fn.type = type(member(n, "type"));
    for (const auto& definition : core_builtins()) if (fn.name == definition.name) fail(n, "Function name '" + fn.name + "' already names a foundation builtin");
    fn.external = external; fn.exported = label(n) == "CoreExport";
    if (core_aggregate(fn.type)) fail(n, "Struct returns require a pointer; by-value returns are not implemented");
    if (fn.name.empty() || functions.contains(fn.name) || templates.contains(fn.name) || type_functions.contains(fn.name)) { fail(n, "Missing or duplicate function '" + fn.name + "'"); return; }
    if (program.functions.size() >= 256) { fail(n, "Foundation function limit is 256"); return; }
    fn.index = program.functions.size(); functions[fn.name] = n; program.functions.push_back(n);
    std::map<std::string, bool> names;
    size_t parameter_index = 0;
    for (auto* p : collect(member(n, "params"), "CoreParameter")) {
      if (definition && generic_type_parameter(generics, definition, parameter_index++)) continue;
      if (!shape(p, {"name", "type"})) return;
      auto& param = node(p, CoreKind::Parameter); param.name = identifier(tokens(member(p, "name"))); param.type = type(member(p, "type"));
      if ((!param.type.pointers && param.type.scalar == CoreScalar::Void) || param.name.empty() || names.contains(param.name)) fail(p, "Invalid or duplicate function parameter");
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
      if (!shape(n, {"name"})) return Next;
      auto& value = node(n, CoreKind::Declare); value.name = identifier(tokens(member(n, "name")));
      if (value.name.empty() || (!value.global && scopes.back().contains(value.name))) { fail(n, "Missing or duplicate local '" + value.name + "'"); return Next; }
      if (!value.global) scopes.back()[value.name] = n;
      if (!declaration_type(n)) return Next;
      if (!value.global) add_local(n);
      if (auto* initial = member(n, "value"); initial && !value.value) value.value = expression(initial, &value.type);
    } else if (kind == "CoreAssign") {
      if (!shape(n, {"target", "value"}) || !shape(member(n, "target"), {"name"})) return Next;
      auto& value = node(n, CoreKind::Assign); auto* target = member(n, "target");
      value.target = location(member(target, "name")); if (!program.error.empty()) return Next;
      auto expected = core_node(value.target).type;
      if (tokens(child(target, 0)) == "*") {
        auto& dest = node(target, CoreKind::Load); dest.value = value.target; dest.type = expected;
        if (!expected.pointers) fail(target, "Store requires a pointer"); else --expected.pointers;
        dest.type = expected; value.target = target;
      }
      if (core_aggregate(expected)) fail(target, "Struct values require field access or a pointer; aggregate copies are not implemented");
      value.value = expression(member(n, "value"), &expected);
    } else if (kind == "CoreCallStatement") call(member(n, "call"));
    else if (kind == "CoreReturn") {
      auto& value = node(n, CoreKind::Return); auto* returned = member(n, "value");
      bool present = !tokens(returned).empty();
      if (!function().type.pointers && function().type.scalar == CoreScalar::Void) { if (present) fail(n, "A void function cannot return a value"); }
      else if (!present) fail(n, "A non-void function must return a value");
      else {
        // The optional capture owns a list wrapper, not the operand itself.
        auto operands = collect(returned, "CoreOperand");
        if (operands.size() != 1) fail(n, "A return value must contain one Foundation operand");
        else value.value = operand(operands.front(), &function().type);
      }
      return Return;
    } else if (kind == "CoreFunction" || kind == "CoreExternal" || kind == "CoreExport") fail(n, "Functions must be declared at top level");
    else if (kind == "CoreStruct") fail(n, "Struct types must be declared at top level");
    else if (kind == "CoreBlock") return block(n, depth);
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
CoreProgram compile(const char* source, size_t prefix, unsigned width) {
  Compiler compiler(width); compiler.prefix = prefix; compiler.source = source; auto* session = syntax_create(source); size_t count = 0;
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
  for (auto* n : statements) {
    if (auto* name = member(n, "name")) compiler.source_names.insert(identifier(tokens(name)));
    if (compiler.program.error.empty() && (label(n) == "CoreFunction" || label(n) == "CoreExternal" || label(n) == "CoreExport")) compiler.register_template(n);
  }
  statements.erase(std::remove_if(statements.begin(), statements.end(), [&](auto* n) { return compiler.template_nodes.contains(n); }), statements.end());
  for (auto* n : statements) if (compiler.program.error.empty() && label(n) == "CoreStruct") compiler.type_header(n);
  for (size_t i = 8; i < compiler.program.types.size() && compiler.program.error.empty(); ++i)
    if (core_node(compiler.program.types[i]).type.scalar == CoreScalar::Struct) compiler.type_fields(compiler.program.types[i]);
  for (size_t i = 8; i < compiler.program.types.size() && compiler.program.error.empty(); ++i) compiler.layout(compiler.program.types[i]);
  for (auto* n : statements) if (compiler.program.error.empty() && (label(n) == "CoreFunction" || label(n) == "CoreExternal" || label(n) == "CoreExport")) compiler.header(n);
  // Module declarations bind across the entire file. Initializers and other
  // effects still execute in source order; forward lookup does not initialize.
  for (auto* n : statements) if (compiler.program.error.empty() && label(n) == "CoreDeclare") {
    if (!compiler.shape(n, {"name"})) break;
    auto& value = compiler.node(n, CoreKind::Declare); value.global = true;
    value.name = identifier(tokens(member(n, "name")));
    if (!compiler.globals.emplace(value.name, n).second) { compiler.fail(n, "Duplicate module variable '" + value.name + "'"); break; }
  }
  // Resolve initializer type dependencies after all module names are known.
  // Allocate in source order even when inference visits a later declaration.
  for (auto* n : statements) if (compiler.program.error.empty() && label(n) == "CoreDeclare") {
    if (!compiler.declaration_type(n)) break;
    compiler.add_local(n);
  }
  for (auto*& n : statements) if (label(n) != "CoreFunction" && label(n) != "CoreExternal" && label(n) != "CoreExport" && label(n) != "CoreStruct") {
    compiler.statement(n); if (label(n) == "CoreCallStatement") n = member(n, "call");
  }
  for (size_t i = 1; i < compiler.program.functions.size() && compiler.program.error.empty(); ++i) {
    auto* n = compiler.program.functions[i]; auto& fn = core_node(n); compiler.current = n;
    if (fn.external) continue;
    compiler.scopes = {std::map<std::string, TowerNode*>{}}; compiler.loops = 0;
    for (auto* p : fn.parameters) compiler.scopes.back()[core_node(p).name] = p;
    fn.body = member(n, "body"); auto flow = compiler.block(fn.body, 0);
    if ((fn.type.pointers || fn.type.scalar != CoreScalar::Void) && (flow & Next)) compiler.fail(n, "Function '" + fn.name + "' can finish without returning a value");
  }
  for (size_t i = 8; i < compiler.program.types.size() && compiler.program.error.empty(); ++i) compiler.layout(compiler.program.types[i]);
  statements.insert(statements.begin(), compiler.generated.begin(), compiler.generated.end());
  return std::move(compiler.program);
}
}
CoreProgram core_compile(const char* source, unsigned pointer_bytes) { return compile(source, 0, pointer_bytes); }
void core_set_foundation(const std::string& grammar) { foundation_grammar = syntax_set_bootstrap(grammar.c_str()); }
CoreProgram core_compile_foundation(const char* source, unsigned pointer_bytes) {
  if (!foundation_grammar.empty()) { CoreProgram p; p.error = foundation_grammar; return p; }
  return compile(source, 0, pointer_bytes);
}
#if defined(__wasm__)
extern "C" __attribute__((export_name("tw_set_foundation"))) int tw_set_foundation(const char* source, size_t length) {
  if (!source || length > 131072) return 0; core_set_foundation(std::string(source, length)); return 1;
}
#endif
