// A small C ABI shared by browser workers and other WebAssembly hosts.
// JSON is a transport; compilation stays in the compiler, including its Tower utilities.
#include "compiler-utf8.hpp"
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

extern "C" bool host_json_quote(TowerByteBuffer*, const char*, size_t);
extern "C" bool host_json_unsigned(TowerByteBuffer*, uint64_t);
extern "C" bool host_text_terminate(TowerByteBuffer*);
extern "C" const char* host_source_error(const char*, size_t);
extern "C" bool host_execution_json(TowerByteBuffer*, const char*, size_t, size_t,
  bool, const char*, size_t, uint64_t, bool);
struct HostHandles { void* slots; size_t count, capacity; uint32_t next; };
extern "C" size_t host_handles_count(HostHandles*, uint32_t);
extern "C" void* host_handles_get(HostHandles*, uint32_t, uint32_t);
extern "C" uint32_t host_handles_insert(HostHandles*, uint32_t, void*);
extern "C" void* host_handles_take(HostHandles*, uint32_t, uint32_t);

namespace {
// Ownership view only. Text storage, growth and encoding execute in Tower.
struct BrowserText {
  TowerByteBuffer buffer{};
  BrowserText() = default;
  BrowserText(std::string_view value) { *this = value; }
  BrowserText(const BrowserText&) = delete;
  BrowserText& operator=(const BrowserText&) = delete;
  ~BrowserText() { bytes_dispose(&buffer); }
  void clear() { buffer.length = 0; }
  BrowserText& operator=(std::string_view text) {
    if (!bytes_assign_text(&buffer, reinterpret_cast<const uint8_t*>(text.data()), text.size())) std::abort();
    return *this;
  }
  BrowserText& operator+=(std::string_view text) {
    if (!bytes_append(&buffer, reinterpret_cast<const uint8_t*>(text.data()), text.size())) std::abort();
    return *this;
  }
  BrowserText& operator+=(char byte) { if (!bytes_push(&buffer, uint8_t(byte))) std::abort(); return *this; }
  const char* c_str() { if (!host_text_terminate(&buffer)) std::abort(); return reinterpret_cast<const char*>(buffer.data); }
};
struct Session {
  SyntaxSession* syntax;
  BrowserText response;
  ~Session() { syntax_destroy(syntax); }
};
HostHandles handles{};
std::string last_error;
BrowserText execution_response;

constexpr size_t max_source = 8 * 1024 * 1024;

void quote(BrowserText& out, const std::string& text) {
  if (!host_json_quote(&out.buffer, text.data(), text.size())) std::abort();
}
void number(BrowserText& out, uint64_t value) { if (!host_json_unsigned(&out.buffer, value)) std::abort(); }
void field(BrowserText& out, const char* name, size_t value) {
  out += ','; quote(out, name); out += ':'; number(out, value);
}
void field(BrowserText& out, const char* name, const std::string& value) {
  out += ','; quote(out, name); out += ':'; quote(out, value);
}
Session* lookup(uint32_t handle) {
  return static_cast<Session*>(host_handles_get(&handles, 0, handle));
}
CoreMachine* execution(uint32_t handle) { return static_cast<CoreMachine*>(host_handles_get(&handles, 1, handle)); }
Match* match(TowerNode* node) {
  return (Match*)tower_node_get_component_userdata(node, parser_match_get_type());
}
void grammar(BrowserText& out, SyntaxSession* syntax) {
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
void status(BrowserText& out, SyntaxSession* syntax, const std::string& kind) {
  out = "{\"status\":"; quote(out, kind);
  field(out, "revision", syntax_get_revision(syntax));
  field(out, "offset", syntax_get_offset(syntax));
  field(out, "error", std::string(syntax_get_error(syntax)));
  field(out, "errorOffset", syntax_get_error_offset(syntax));
  if (syntax_get_error_insertion(syntax)) field(out, "errorLength", size_t(0));
}
void tree(BrowserText& out, TowerNode* root) {
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
bool valid_source(const char* source, size_t bytes) {
  last_error = host_source_error(source, bytes);
  return last_error.empty();
}
}

EXPORT("tw_last_error") const char* tw_last_error() { return last_error.c_str(); }

EXPORT("tw_create") uint32_t tw_create(const char* source, size_t bytes) {
  if (!valid_source(source, bytes)) return 0;
  if (host_handles_count(&handles, 0) >= 32) { last_error = "Too many open parser sessions"; return 0; }
  std::string copy(source, bytes);
  auto session = std::make_unique<Session>();
  session->syntax = syntax_create(copy.c_str());
  if (*syntax_get_error(session->syntax)) { last_error = syntax_get_error(session->syntax); return 0; }
  uint32_t handle = host_handles_insert(&handles, 0, session.get());
  if (!handle) { last_error = "Cannot allocate parser handle"; return 0; }
  session.release();
  return handle;
}

EXPORT("tw_create_foundation") uint32_t tw_create_foundation(const char* source, size_t bytes) {
  if (!valid_source(source, bytes)) return 0;
  if (host_handles_count(&handles, 0) >= 32) { last_error = "Too many open parser sessions"; return 0; }
  std::string copy(source, bytes);
  auto session = std::make_unique<Session>();
  session->syntax = syntax_create_foundation(copy.c_str());
  uint32_t handle = host_handles_insert(&handles, 0, session.get());
  if (!handle) { last_error = "Cannot allocate parser handle"; return 0; }
  session.release();
  return handle;
}

EXPORT("tw_create_bedrock") uint32_t tw_create_bedrock(const char* source, size_t bytes) {
  if (!valid_source(source, bytes)) return 0;
  if (host_handles_count(&handles, 0) >= 32) { last_error = "Too many open parser sessions"; return 0; }
  std::string copy(source, bytes);
  auto session = std::make_unique<Session>(); session->syntax = syntax_create_bedrock(copy.c_str());
  uint32_t handle = host_handles_insert(&handles, 0, session.get());
  if (!handle) { last_error = "Cannot allocate parser handle"; return 0; }
  session.release(); return handle;
}

EXPORT("tw_format") const char* tw_format(uint32_t handle) {
  auto* session = lookup(handle);
  if (!session) return "{\"error\":\"Invalid session handle\"}";
  auto& out = session->response; out = "{";
  if (!syntax_can_format(session->syntax)) {
    out += "\"error\":\"Formatting requires a complete, valid source document\"}";
    return out.c_str();
  }
  const auto formatted = syntax_format(session->syntax);
  if (!formatted.error.empty()) { out += "\"error\":"; quote(out, formatted.error); out += '}'; return out.c_str(); }
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

EXPORT("tw_destroy") void tw_destroy(uint32_t handle) { delete static_cast<Session*>(host_handles_take(&handles, 0, handle)); }

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
    auto& fn = core_node(function); BrowserText request("{\"name\":"); quote(request, fn.name);
    field(request, "pointerBytes", machine.program.pointer_bytes);
    request += ",\"types\":[";
    for (size_t i = 0; i < fn.parameters.size(); ++i) { if (i) request += ','; quote(request, core_type_name(core_node(fn.parameters[i]).type)); }
    request += "],\"args\":[";
    for (size_t i = 0; i < args.size(); ++i) { if (i) request += ','; request += '"'; number(request, args[i].bits); request += '"'; }
    request += "]}"; return CoreValue{tw_foreign_call(handle, request.c_str())};
  };
}
EXPORT("tw_exec_memory") uint8_t* tw_exec_memory(uint32_t handle) { auto* m = execution(handle); return m ? m->memory_data() : nullptr; }
EXPORT("tw_exec_memory_size") size_t tw_exec_memory_size(uint32_t handle) { auto* m = execution(handle); return m ? m->memory_size() : 0; }
EXPORT("tw_exec_allocate") uint32_t tw_exec_allocate(uint32_t handle, uint32_t size) { auto* m = execution(handle); return m ? uint32_t(m->allocate(size)) : 0; }
EXPORT("tw_exec_deallocate") void tw_exec_deallocate(uint32_t handle, uint32_t pointer) { if (auto* m = execution(handle)) m->deallocate(pointer); }
EXPORT("tw_exec_fail") void tw_exec_fail(uint32_t handle, const char* error, size_t length) { if (auto* m = execution(handle)) m->fail(std::string(error, length), 0); }
EXPORT("tw_exec_output") void tw_exec_output(uint32_t handle, const char* data, size_t length) {
  auto* found = execution(handle); if (!found) return;
  auto& machine = *found;
  if (length > 65536 - machine.output_bytes) { machine.output_truncated = true; return; }
  machine.output.append(data, length); machine.output_bytes += length;
}

EXPORT("tw_exec_create_target") uint32_t tw_exec_create_target(const char* source, size_t bytes, unsigned pointer_bytes) {
  if (!valid_source(source, bytes)) return 0;
  if (pointer_bytes != 4 && pointer_bytes != 8) { last_error = "Unsupported target pointer width"; return 0; }
  if (host_handles_count(&handles, 1) >= 8) { last_error = "Too many execution sessions"; return 0; }
  std::string copy(source, bytes);
  auto machine = std::make_unique<CoreMachine>(core_compile(copy.c_str(), pointer_bytes));
  uint32_t handle = host_handles_insert(&handles, 1, machine.get());
  if (!handle) { last_error = "Cannot allocate execution handle"; return 0; }
  bind_foreign(handle, *machine); machine.release();
  return handle;
}
EXPORT("tw_exec_create") uint32_t tw_exec_create(const char* source, size_t bytes) { return tw_exec_create_target(source, bytes, 4); }
// Temporary host ABI input list, not a program storage/interchange format.
// Each item is ordinary UTF-8 Tower source; lengths are wasm32 byte lengths.
EXPORT("tw_exec_create_files") uint32_t tw_exec_create_files(const char* const* sources, const uint32_t* lengths, uint32_t count, unsigned pointer_bytes) {
  if (!sources || !lengths || !count || count > 1024 || (pointer_bytes != 4 && pointer_bytes != 8) || host_handles_count(&handles, 1) >= 8) {
    last_error = "Invalid project compilation request"; return 0;
  }
  std::vector<std::string> files; size_t total = 0;
  for (uint32_t i = 0; i < count; ++i) {
    if (!valid_source(sources[i], lengths[i])) return 0;
    total += lengths[i];
    if (total > max_source) { last_error = "Project compilation limit is 8 MiB"; return 0; }
    files.emplace_back(sources[i], lengths[i]);
  }
  auto machine = std::make_unique<CoreMachine>(core_compile_files(files, pointer_bytes));
  uint32_t handle = host_handles_insert(&handles, 1, machine.get());
  if (!handle) { last_error = "Cannot allocate execution handle"; return 0; }
  bind_foreign(handle, *machine); machine.release(); return handle;
}
EXPORT("tw_exec_step") const char* tw_exec_step(uint32_t handle, uint32_t budget) {
  auto* found = execution(handle);
  if (!found) return "{\"status\":\"error\",\"error\":\"Invalid execution handle\"}";
  auto& machine = *found;
  machine.step(std::min(budget, uint32_t(100000)));
  auto& out = execution_response;
  if (!host_execution_json(&out.buffer, machine.error.data(), machine.error.size(), machine.error_offset,
      machine.done, machine.output.data(), machine.output.size(), machine.steps, machine.output_truncated)) std::abort();
  machine.output.clear();
  return out.c_str();
}
EXPORT("tw_exec_foundation") const char* tw_exec_foundation(uint32_t handle) {
  auto* found = execution(handle);
  auto formatted = found ? core_format(found->program) : CoreText{};
  auto& out = execution_response; out = "{\"source\":"; quote(out, formatted.source); out += ",\"spans\":[";
  for (size_t i = 0; i < formatted.spans.size(); ++i) {
    if (i) out += ','; const auto& span = formatted.spans[i];
    out += "{\"begin\":"; number(out, span.begin); field(out, "end", span.end); field(out, "source", span.source); out += '}';
  }
  out += "],\"types\":[";
  if (found && found->program.error.empty()) {
    bool first = true;
    for (auto* entity : found->program.types) {
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
EXPORT("tw_exec_destroy") void tw_exec_destroy(uint32_t handle) { delete static_cast<CoreMachine*>(host_handles_take(&handles, 1, handle)); }
EXPORT("tw_exec_create_foundation") uint32_t tw_exec_create_foundation(const char* source, size_t bytes) {
  if (!valid_source(source, bytes)) return 0;
  if (host_handles_count(&handles, 1) >= 8) { last_error = "Too many execution sessions"; return 0; }
  std::string copy(source, bytes);
  auto machine = std::make_unique<CoreMachine>(core_compile_foundation(copy.c_str()));
  uint32_t handle = host_handles_insert(&handles, 1, machine.get());
  if (!handle) { last_error = "Cannot allocate execution handle"; return 0; }
  bind_foreign(handle, *machine); machine.release(); return handle;
}
