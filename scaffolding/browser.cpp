// A small C ABI shared by browser workers and other WebAssembly hosts.
// JSON is a transport here; syntax, grammar activation and highlighting live in C++.
#include "syntax.hpp"
#include "core.hpp"
#include <algorithm>
#include <cstdlib>
#include <cstring>
#include <map>
#include <memory>
#include <string>
#include <vector>

#define EXPORT(name) extern "C" __attribute__((export_name(name)))

namespace {
struct Session {
  SyntaxSession* syntax;
  std::string response;
  ~Session() { syntax_destroy(syntax); }
};
std::map<uint32_t, std::unique_ptr<Session>> sessions;
uint32_t next_handle = 1;
std::string last_error;
std::map<uint32_t, std::unique_ptr<CoreMachine>> machines;
std::string execution_response;

constexpr size_t max_source = 128 * 1024;

void quote(std::string& out, const std::string& text) {
  out += '"';
  constexpr char hex[] = "0123456789abcdef";
  for (unsigned char c : text) {
    if (c == '"' || c == '\\') { out += '\\'; out += c; }
    else if (c < 32) { out += "\\u00"; out += hex[c >> 4]; out += hex[c & 15]; }
    else out += c;
  }
  out += '"';
}
void number(std::string& out, size_t value) { out += std::to_string(value); }
void field(std::string& out, const char* name, size_t value) {
  out += ','; quote(out, name); out += ':'; number(out, value);
}
void field(std::string& out, const char* name, const std::string& value) {
  out += ','; quote(out, name); out += ':'; quote(out, value);
}
Session* lookup(uint32_t handle) {
  auto it = sessions.find(handle);
  return it == sessions.end() ? nullptr : it->second.get();
}
Match* match(TowerNode* node) {
  return (Match*)tower_node_get_component_userdata(node, parser_match_get_type());
}
void grammar(std::string& out, SyntaxSession* syntax) {
  out += ",\"rules\":[";
  bool first = true;
  for (const auto& rule : syntax_get_rules(syntax)) {
    if (!first) out += ','; first = false;
    out += "{\"name\":"; quote(out, rule.name);
    field(out, "definition", rule.definition); out += rule.pending ? ",\"pending\":true}" : ",\"pending\":false}";
  }
  out += "],\"keywords\":[";
  first = true;
  for (const auto& keyword : syntax_get_keywords(syntax)) {
    if (!first) out += ','; first = false; quote(out, keyword);
  }
  out += "] ,\"tokens\":[";
  first = true;
  for (const auto& token : syntax_get_tokens(syntax)) {
    if (!first) out += ','; first = false;
    out += "{\"name\":"; quote(out, token.name);
    field(out, "pattern", token.pattern); field(out, "kind", token.kind);
    out += token.skip ? ",\"skip\":true" : ",\"skip\":false";
    out += token.contextual ? ",\"contextual\":true}" : ",\"contextual\":false}";
  }
  out += ']';
}
void status(std::string& out, SyntaxSession* syntax, const std::string& kind) {
  out = "{\"status\":"; quote(out, kind);
  field(out, "revision", syntax_get_revision(syntax));
  field(out, "offset", syntax_get_offset(syntax));
  field(out, "error", std::string(syntax_get_error(syntax)));
  field(out, "errorOffset", syntax_get_error_offset(syntax));
}
void tree(std::string& out, TowerNode* root) {
  struct Item { TowerNode* node; size_t parent; const char* role; };
  std::vector<Item> pending{{root, TOWER_INVALID_INDEX, tower_node_get_parent_member_name(root)}};
  size_t index = 0;
  std::map<const SyntaxExpansion*, size_t> trace_ids;
  std::vector<std::shared_ptr<const SyntaxExpansion>> traces;
  auto trace_id = [&](std::shared_ptr<const SyntaxExpansion> trace) {
    const auto* original = trace.get();
    while (trace && !trace_ids.contains(trace.get())) {
      trace_ids[trace.get()] = traces.size(); traces.push_back(trace); trace = trace->previous;
    }
    return original ? trace_ids.at(original) : TOWER_INVALID_INDEX;
  };
  out += ",\"nodes\":[";
  while (!pending.empty()) {
    auto [node, parent, role] = pending.back(); pending.pop_back();
    if (index) out += ',';
    auto* m = match(node);
    out += "{\"id\":"; number(out, tower_node_get_id(node));
    out += ",\"parent\":";
    if (parent == TOWER_INVALID_INDEX) out += "null"; else number(out, parent);
    field(out, "label", std::string(parser_match_get_label(m)));
    field(out, "role", std::string(role ? role : ""));
    if (auto* semantic = syntax_get(node)) field(out, "semantic", std::string(syntax_kind_name(semantic->kind)));
    field(out, "start", parser_match_get_start(m));
    field(out, "end", parser_match_get_start(m) + parser_match_get_length(m));
    out += ",\"production\":";
    size_t production = parser_match_get_rule_index(m);
    if (production == TOWER_INVALID_INDEX) out += "null"; else number(out, production);
    if (auto* origin = syntax_get_origin(node)) {
      out += origin->generated ? ",\"origin\":{\"generated\":true" : ",\"origin\":{\"generated\":false";
      field(out, "templateStart", origin->template_start); field(out, "templateEnd", origin->template_end);
      out += ",\"expansion\":";
      auto id = trace_id(origin->expansion);
      if (id == TOWER_INVALID_INDEX) out += "null"; else number(out, id);
      out += ",\"splices\":[";
      for (size_t i = 0; i < origin->splices.size(); ++i) {
        if (i) out += ','; number(out, trace_id(origin->splices[i]));
      }
      out += "]}";
    }
    out += '}';
    for (size_t i = tower_node_get_child_count(node); i > 0; --i)
      pending.push_back({tower_node_get_child(node, i - 1), index, tower_node_get_child_member_name(node, i - 1)});
    ++index;
  }
  out += "],\"expansions\":[";
  for (size_t i = 0; i < traces.size(); ++i) {
    if (i) out += ',';
    const auto& trace = traces[i];
    out += "{\"rule\":"; quote(out, trace->rule);
    field(out, "start", trace->start); field(out, "end", trace->end);
    field(out, "definitionStart", trace->definition_start); field(out, "definitionEnd", trace->definition_end);
    out += ",\"previous\":";
    if (trace->previous) number(out, trace_ids.at(trace->previous.get())); else out += "null";
    out += '}';
  }
  out += ']';
}
bool valid_utf8(const unsigned char* s, size_t size) {
  for (size_t i = 0; i < size;) {
    unsigned char c = s[i++];
    if (c == 0) return false;
    if (c < 128) continue;
    size_t n; uint32_t value, minimum;
    if (c >= 0xc2 && c <= 0xdf) { n = 1; value = c & 31; minimum = 0x80; }
    else if (c >= 0xe0 && c <= 0xef) { n = 2; value = c & 15; minimum = 0x800; }
    else if (c >= 0xf0 && c <= 0xf4) { n = 3; value = c & 7; minimum = 0x10000; }
    else return false;
    if (i + n > size) return false;
    while (n--) { c = s[i++]; if ((c & 0xc0) != 0x80) return false; value = (value << 6) | (c & 63); }
    if (value < minimum || value > 0x10ffff || (value >= 0xd800 && value <= 0xdfff)) return false;
  }
  return true;
}
bool valid_source(const char* source, size_t bytes) {
  last_error.clear();
  if (bytes > max_source) { last_error = "Playground source limit is 128 KiB"; return false; }
  if (!source || !valid_utf8((const unsigned char*)source, bytes)) {
    last_error = "Source must be valid UTF-8 without NUL bytes"; return false;
  }
  return true;
}
}

EXPORT("tw_abi_version") uint32_t tw_abi_version() { return 3; }
EXPORT("tw_alloc") void* tw_alloc(size_t bytes) { return malloc(bytes); }
EXPORT("tw_free") void tw_free(void* pointer) { free(pointer); }
EXPORT("tw_last_error") const char* tw_last_error() { return last_error.c_str(); }

EXPORT("tw_create") uint32_t tw_create(const char* source, size_t bytes) {
  if (!valid_source(source, bytes)) return 0;
  if (sessions.size() >= 32) { last_error = "Too many open parser sessions"; return 0; }
  std::string copy(source, bytes);
  auto session = std::make_unique<Session>();
  session->syntax = syntax_create(copy.c_str());
  if (*syntax_get_error(session->syntax)) { last_error = syntax_get_error(session->syntax); return 0; }
  uint32_t handle = next_handle++;
  if (!handle) handle = next_handle++;
  sessions.emplace(handle, std::move(session));
  return handle;
}

EXPORT("tw_create_foundation") uint32_t tw_create_foundation(const char* source, size_t bytes) {
  if (!valid_source(source, bytes)) return 0;
  if (sessions.size() >= 32) { last_error = "Too many open parser sessions"; return 0; }
  std::string copy(source, bytes);
  auto session = std::make_unique<Session>();
  session->syntax = syntax_create_foundation(copy.c_str());
  uint32_t handle = next_handle++;
  if (!handle) handle = next_handle++;
  sessions.emplace(handle, std::move(session));
  return handle;
}

EXPORT("tw_create_bedrock") uint32_t tw_create_bedrock(const char* source, size_t bytes) {
  if (!valid_source(source, bytes)) return 0;
  if (sessions.size() >= 32) { last_error = "Too many open parser sessions"; return 0; }
  std::string copy(source, bytes);
  auto session = std::make_unique<Session>(); session->syntax = syntax_create_bedrock(copy.c_str());
  uint32_t handle = next_handle++; if (!handle) handle = next_handle++;
  sessions.emplace(handle, std::move(session)); return handle;
}

EXPORT("tw_format") const char* tw_format(uint32_t handle) {
  auto* session = lookup(handle);
  if (!session) return "{\"error\":\"Invalid session handle\"}";
  auto& out = session->response; out = "{";
  if (!syntax_can_format(session->syntax)) {
    out += "\"error\":\"Formatting requires a complete, valid grammar declaration document\"}";
    return out.c_str();
  }
  const auto formatted = syntax_format(session->syntax);
  out += "\"source\":"; quote(out, formatted.source);
  out += ",\"spans\":[";
  for (size_t i = 0; i < formatted.spans.size(); ++i) {
    if (i) out += ',';
    const auto& span = formatted.spans[i];
    out += "{\"begin\":"; number(out, span.begin); field(out, "end", span.end); field(out, "source", span.source); out += '}';
  }
  out += "]}"; return out.c_str();
}

EXPORT("tw_reset") int tw_reset(uint32_t handle, const char* source, size_t bytes) {
  if (!valid_source(source, bytes)) return 0;
  auto* session = lookup(handle);
  if (!session) { last_error = "Invalid session handle"; return 0; }
  std::string copy(source, bytes);
  syntax_reset(session->syntax, copy.c_str());
  session->response.clear();
  if (*syntax_get_error(session->syntax)) { last_error = syntax_get_error(session->syntax); return 0; }
  return 1;
}

EXPORT("tw_destroy") void tw_destroy(uint32_t handle) { sessions.erase(handle); }

// Returned strings are borrowed until the next step/inspect on this handle.
EXPORT("tw_step") const char* tw_step(uint32_t handle) {
  auto* session = lookup(handle);
  if (!session) return "{\"status\":\"error\",\"error\":\"Invalid session handle\"}";
  auto* syntax = session->syntax;
  auto& out = session->response;
  size_t before = syntax_get_revision(syntax);
  auto* root = syntax_next(syntax);
  status(out, syntax, root ? (before == syntax_get_revision(syntax) ? "statement" : "declaration")
                          : (*syntax_get_error(syntax) ? "error" : "done"));
  field(out, "previousRevision", before);
  grammar(out, syntax);
  auto expansion_stats = syntax_get_expansion_stats(syntax);
  field(out, "replacementCount", expansion_stats.replacements);
  field(out, "generatedNodes", expansion_stats.generated_nodes);
  field(out, "copiedNodes", expansion_stats.copied_nodes);
  if (root) {
    auto* construct = tower_node_get_child(root, 0);
    tree(out, construct);
    tower_node_release_ref(root);
  }
  out += '}';
  return out.c_str();
}

EXPORT("tw_inspect") const char* tw_inspect(uint32_t handle) {
  auto* session = lookup(handle);
  if (!session) return "{\"status\":\"error\",\"error\":\"Invalid session handle\"}";
  auto& out = session->response;
  status(out, session->syntax, *syntax_get_error(session->syntax) ? "error" : "snapshot");
  auto stats = syntax_get_cache_stats(session->syntax);
  field(out, "grammarBuilds", stats.builds);
  field(out, "grammarCacheHits", stats.hits);
  field(out, "cachedGrammars", stats.entries);
  grammar(out, session->syntax);
  out += ",\"highlights\":[";
  bool first = true;
  for (const auto& token : syntax_get_highlights(session->syntax)) {
    if (!first) out += ','; first = false;
    out += "{\"start\":"; number(out, token.start);
    field(out, "end", token.end); field(out, "revision", token.revision); field(out, "kind", token.kind);
    out += '}';
  }
  out += "]}";
  return out.c_str();
}

EXPORT("tw_self_test") int tw_self_test() {
  tower_tests(); parser_tests(); syntax_tests();
  return 0;
}
EXPORT("tw_live_nodes") size_t tw_live_nodes() { return tower_node_get_allocated_count(); }
EXPORT("tw_live_allocations") size_t tw_live_allocations() { return tower_memory_get_allocated_count(); }

extern "C" __attribute__((import_module("tower_host"), import_name("call"))) uint64_t tw_foreign_call(uint32_t handle, const char* request);
void bind_foreign(uint32_t handle, CoreMachine& machine) {
  machine.foreign = [handle](CoreMachine& machine, TowerNode* function, const std::vector<CoreValue>& args) {
    auto& fn = core_node(function); std::string request = "{\"name\":"; quote(request, fn.name);
    field(request, "pointerBytes", machine.program.pointer_bytes);
    request += ",\"types\":[";
    for (size_t i = 0; i < fn.parameters.size(); ++i) { if (i) request += ','; quote(request, core_type_name(core_node(fn.parameters[i]).type)); }
    request += "],\"args\":[";
    for (size_t i = 0; i < args.size(); ++i) { if (i) request += ','; quote(request, std::to_string(args[i].bits)); }
    request += "]}"; return CoreValue{tw_foreign_call(handle, request.c_str())};
  };
}
EXPORT("tw_exec_memory") uint8_t* tw_exec_memory(uint32_t handle) { auto it = machines.find(handle); return it == machines.end() ? nullptr : it->second->memory.data(); }
EXPORT("tw_exec_memory_size") size_t tw_exec_memory_size(uint32_t handle) { auto it = machines.find(handle); return it == machines.end() ? 0 : it->second->memory.size(); }
EXPORT("tw_exec_allocate") uint32_t tw_exec_allocate(uint32_t handle, uint32_t size) { auto it = machines.find(handle); return it == machines.end() ? 0 : uint32_t(it->second->allocate(size)); }
EXPORT("tw_exec_deallocate") void tw_exec_deallocate(uint32_t handle, uint32_t pointer) { auto it = machines.find(handle); if (it != machines.end()) it->second->deallocate(pointer); }
EXPORT("tw_exec_fail") void tw_exec_fail(uint32_t handle, const char* error, size_t length) { auto it = machines.find(handle); if (it != machines.end()) it->second->fail(std::string(error, length), 0); }
EXPORT("tw_exec_output") void tw_exec_output(uint32_t handle, const char* data, size_t length) {
  auto it = machines.find(handle); if (it == machines.end()) return;
  auto& machine = *it->second;
  if (length > 65536 - machine.output_bytes) { machine.output_truncated = true; return; }
  machine.output.append(data, length); machine.output_bytes += length;
}

EXPORT("tw_exec_create_target") uint32_t tw_exec_create_target(const char* source, size_t bytes, unsigned pointer_bytes) {
  if (!valid_source(source, bytes)) return 0;
  if (pointer_bytes != 4 && pointer_bytes != 8) { last_error = "Unsupported target pointer width"; return 0; }
  if (machines.size() >= 8) { last_error = "Too many execution sessions"; return 0; }
  std::string copy(source, bytes);
  auto machine = std::make_unique<CoreMachine>(core_compile(copy.c_str(), pointer_bytes));
  uint32_t handle = next_handle++;
  if (!handle) handle = next_handle++;
  bind_foreign(handle, *machine);
  machines.emplace(handle, std::move(machine));
  return handle;
}
EXPORT("tw_exec_create") uint32_t tw_exec_create(const char* source, size_t bytes) { return tw_exec_create_target(source, bytes, 4); }
EXPORT("tw_exec_step") const char* tw_exec_step(uint32_t handle, uint32_t budget) {
  auto found = machines.find(handle);
  if (found == machines.end()) return "{\"status\":\"error\",\"error\":\"Invalid execution handle\"}";
  auto& machine = *found->second;
  machine.step(std::min(budget, uint32_t(100000)));
  auto& out = execution_response;
  out = "{\"status\":"; quote(out, !machine.error.empty() ? "error" : machine.done ? "done" : "executing");
  field(out, "error", machine.error); field(out, "errorOffset", machine.error_offset);
  out += ",\"outputBytes\":[";
  for (size_t i = 0; i < machine.output.size(); ++i) {
    if (i) out += ','; out += std::to_string(static_cast<unsigned char>(machine.output[i]));
  }
  out += ']'; machine.output.clear();
  out += ",\"steps\":" + std::to_string(machine.steps); 
  out += machine.output_truncated ? ",\"outputTruncated\":true}" : ",\"outputTruncated\":false}";
  return out.c_str();
}
EXPORT("tw_exec_foundation") const char* tw_exec_foundation(uint32_t handle) {
  auto found = machines.find(handle);
  auto formatted = found == machines.end() ? CoreText{} : core_format(found->second->program);
  auto& out = execution_response; out = "{\"source\":"; quote(out, formatted.source); out += ",\"spans\":[";
  for (size_t i = 0; i < formatted.spans.size(); ++i) {
    if (i) out += ','; const auto& span = formatted.spans[i];
    out += "{\"begin\":"; number(out, span.begin); field(out, "end", span.end); field(out, "source", span.source); out += '}';
  }
  out += "],\"types\":[";
  if (found != machines.end() && found->second->program.error.empty()) {
    bool first = true;
    for (auto* entity : found->second->program.types) {
      if (!first) out += ','; first = false; auto& type = core_node(entity);
      out += "{\"name\":"; quote(out, type.name);
      out += ",\"kind\":"; quote(out, type.type.scalar == CoreScalar::Array ? "array" : type.type.scalar == CoreScalar::Struct ? "struct" : type.type.scalar == CoreScalar::Void ? "void" : "scalar");
      if (type.type.scalar == CoreScalar::Array) { out += ",\"element\":"; quote(out, core_type_name(type.element)); field(out, "length", type.length); }
      field(out, "size", type.size); field(out, "alignment", type.alignment); out += ",\"fields\":[";
      for (size_t i = 0; i < type.items.size(); ++i) {
        if (i) out += ','; auto& member = core_node(type.items[i]);
        out += "{\"name\":"; quote(out, member.name); out += ",\"type\":"; quote(out, core_type_name(member.type));
        field(out, "offset", member.byte_offset); field(out, "size", core_type_size(member.type)); field(out, "alignment", core_type_alignment(member.type)); out += '}';
      }
      out += "]}";
    }
  }
  out += "]}"; return out.c_str();
}
EXPORT("tw_exec_destroy") void tw_exec_destroy(uint32_t handle) { machines.erase(handle); }
EXPORT("tw_exec_create_foundation") uint32_t tw_exec_create_foundation(const char* source, size_t bytes) {
  if (!valid_source(source, bytes)) return 0;
  if (machines.size() >= 8) { last_error = "Too many execution sessions"; return 0; }
  std::string copy(source, bytes);
  auto machine = std::make_unique<CoreMachine>(core_compile_foundation(copy.c_str()));
  uint32_t handle = next_handle++; if (!handle) handle = next_handle++;
  bind_foreign(handle, *machine);
  machines.emplace(handle, std::move(machine)); return handle;
}
