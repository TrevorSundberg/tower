#include "core.hpp"
#include "llvm-engine.hpp"
#include "compiler-host.hpp"
#include "compiler-frontend.hpp"
#include <iostream>
#include <filesystem>

namespace fs = std::filesystem;
// Private host connections. Compiler/backend APIs and semantic objects are unchanged.
extern "C" {
void driver_timing_mark(void*, bool, const char*);
void driver_timing_value(void*, const char*, uint64_t);
void driver_error(const char*, const char*);
void driver_report(const char*, size_t, const char*, size_t, const char*, void*);
bool driver_write_ir(const char*, const char*, size_t, const char*, const char*, size_t);
void* driver_link_open(const char*, const char*, const char*, const char*, const char*, const char*, bool, bool, void*, bool);
void driver_link_import(void*, const char*);
void driver_link_export(void*, const char*);
void driver_link_input(void*, const char*);
int driver_link_run(void*, const uint8_t*, size_t);
void driver_request_bind(void*, ModuleEnvironment**);
void driver_request_stage(void*);
const TowerByteBuffer* driver_request_text(void*, size_t);
bool driver_request_canonical(void*);
const char* driver_request_error(void*);
}
namespace {
struct Timings {
  void* state;
  bool enabled;
  void mark(const char* name) { driver_timing_mark(state, enabled, name); }
};
bool write(const fs::path& path, const char* bytes, size_t count) { return driver_write_file(path.string().c_str(), bytes, count); }
}
// The Tower entry owns options, resource text and timings throughout this call.
// This adapter still connects the retained C++ compiler result/interpreter APIs.
extern "C" int driver_compile(const DriverOptions* prepared, const char* resource_root, void* timing_state, void* request) {
  const auto& options = *prepared;
  Timings timings{timing_state, options.timings};
  std::string source = options.source, output = options.output, target = options.target;
  std::string emit = options.emit, cc = options.cc, linker = options.linker, sysroot = options.sysroot;
  std::string raw = options.raw, optimized = options.optimized, resources = resource_root, depfile = options.depfile;
  bool optimize = options.optimize, interpret = options.interpret, library = options.library;
  bool fast = options.fast, comments = options.comments;
  std::vector<std::string> inputs;
  for (size_t i = 0; i < options.link_count; ++i) inputs.emplace_back(options.links[i]);
  driver_request_bind(request, &syntax_modules);
  auto error = syntax_set_bedrock(reinterpret_cast<const char*>(driver_request_text(request, 0)->data));
  if (error.empty()) error = syntax_set_bootstrap(reinterpret_cast<const char*>(driver_request_text(request, 1)->data));
  if (!error.empty()) { std::cerr << error << '\n'; return 1; }
  timings.mark("bootstrap");
  const auto* input = driver_request_text(request, 2);
  std::string text(reinterpret_cast<const char*>(input->data), input->length);
  std::string runtime_source;
  ModuleEnvironment* input_modules = nullptr;
  const auto report_error = [&](const std::string& error, size_t offset, const std::string* origin = nullptr) {
    const auto& diagnostic_source = origin ? *origin : text;
    driver_report(error.c_str(), offset, diagnostic_source.data(), diagnostic_source.size(), source.c_str(), origin && input_modules ? input_modules : syntax_modules);
  };
  unsigned packaged_width = 0;
  unsigned packaged_profile = 0;
  const auto install_canonical_grammar = [&]() {
    if (!driver_request_canonical(request)) return std::string(driver_request_error(request));
    auto failure = syntax_set_bedrock(reinterpret_cast<const char*>(driver_request_text(request, 3)->data));
    if (failure.empty()) failure = syntax_set_bootstrap(reinterpret_cast<const char*>(driver_request_text(request, 4)->data));
    return failure;
  };
  if (fs::path(source).extension() == ".towerbc") {
    error = install_canonical_grammar();
    if (!error.empty()) { std::cerr << error << '\n'; return 1; }
    auto loaded = core_load_bytecode(reinterpret_cast<const uint8_t*>(text.data()), text.size(), error);
    if (!loaded) { std::cerr << error << '\n'; return 1; }
    packaged_width = loaded->program.pointer_bytes;
    packaged_profile = static_cast<unsigned char>(text[24]);
    text = core_format(loaded->program).source;
    interpret = true; fast = true;
  }
  if (text.find('\0') != std::string::npos) { std::cerr << "Source contains NUL bytes\n"; return 1; }
  if (!packaged_width && (emit == "bytecode" || emit == "brightscript" || (interpret && fast) || (emit == "c" && optimize))) {
    auto width = tower_target_pointer_bytes(target, error);
    if (!error.empty()) { std::cerr << error << '\n'; return 1; }
    auto optimized_program = tower_optimize_foundation(text.c_str(), width, optimize);
    if (!optimized_program.error.empty()) { report_error(optimized_program.error, optimized_program.error_offset); return 1; }
    if (!driver_write_ir(raw.c_str(), optimized_program.raw.data(), optimized_program.raw.size(), optimized.c_str(), optimized_program.optimized.data(), optimized_program.optimized.size())) return 1;
    error = install_canonical_grammar();
    if (!error.empty()) { std::cerr << error << '\n'; return 1; }
    runtime_source = std::move(text);
    text = std::move(optimized_program.foundation);
    // Generated foundation is a new compilation stage. Retain the original
    // module snapshots for trap locations and dependency output.
    input_modules = syntax_modules;
    driver_request_stage(request);
  }
  if (emit == "bytecode" || emit == "foundation" || emit == "c" || emit == "brightscript") {
    auto width = packaged_width ? packaged_width : tower_target_pointer_bytes(target, error);
    if (!error.empty()) { std::cerr << error << '\n'; return 1; }
    auto program = core_compile_foundation(text.c_str(), width);
    if (!program.error.empty()) { report_error(program.error, program.error_offset); return 1; }
    if (!comments) core_strip_comments(program);
    if (output.empty()) output = fs::path(source).replace_extension(emit == "bytecode" ? ".towerbc" : emit == "c" ? ".c" : emit == "brightscript" ? ".brs" : ".disassembled.tower").string();
    if (fs::absolute(output).lexically_normal() == fs::absolute(source).lexically_normal()) {
      std::cerr << "Choose an output path different from the input\n"; return 1;
    }
    if (!frontend_modules_depfile(input_modules ? input_modules : syntax_modules, output.c_str(), depfile.c_str())) { std::cerr << "Cannot write dependency file: " << depfile << '\n'; return 1; }
    if (emit == "foundation") {
      const auto foundation = core_format(program).source;
      return write(output, foundation.data(), foundation.size()) ? 0 : 1;
    }
    if (emit == "c" || emit == "brightscript") {
      auto emitted = emit == "c" ? core_c_source(program) : core_roku_source(program);
      if (!emitted.error.empty()) { std::cerr << emitted.error << '\n'; return 1; }
      return write(output, emitted.source.data(), emitted.source.size()) ? 0 : 1;
    }
    error = install_canonical_grammar();
    if (!error.empty()) { std::cerr << error << '\n'; return 1; }
    const auto bytes = core_encode_bytecode(program, error, packaged_width ? packaged_profile : optimize ? 1 : 2);
    if (bytes.empty()) { std::cerr << error << '\n'; return 1; }
    return write(output, reinterpret_cast<const char*>(bytes.data()), bytes.size()) ? 0 : 1;
  }
  if (text.find('\0') != std::string::npos) { std::cerr << "Source contains NUL bytes\n"; return 1; }
  bool wasm = target.starts_with("wasm"), windows = target.find("windows") != std::string::npos;
  if (interpret) {
    auto width = packaged_width ? packaged_width : tower_target_pointer_bytes(target, error);
    if (!error.empty()) { std::cerr << error << '\n'; return 1; }
    CoreMachine machine(core_compile_foundation(text.c_str(), width));
    if (!frontend_modules_depfile(input_modules ? input_modules : syntax_modules, output.c_str(), depfile.c_str())) { std::cerr << "Cannot write dependency file: " << depfile << '\n'; return 1; }
    timings.mark("compile");
    if (fast) { machine.use_fast(); timings.mark("prepare"); }
    machine.foreign = [](CoreMachine& machine, TowerNode* function, const std::vector<CoreValue>& args) -> CoreValue {
      const auto& fn = core_node(function);
      if (fn.name != "platform_write" || args.size() != 3) { machine.fail("No native interpreter binding for '" + fn.name + "'", 0); return {}; }
      if (args[0].bits != 1 && args[0].bits != 2) return {UINT64_MAX};
      auto* data = machine.bytes(args[1].bits, args[2].bits); if (!data) return {UINT64_MAX};
      // Flush earlier Tower print output before writing this external byte span.
      std::cout << machine.output; machine.output.clear();
      auto& out = args[0].bits == 1 ? std::cout : std::cerr;
      out.write(reinterpret_cast<const char*>(data), std::streamsize(args[2].bits));
      return {out ? args[2].bits : UINT64_MAX};
    };
    while (!machine.done) { machine.step(10000); std::cout << machine.output; machine.output.clear(); }
    timings.mark("execute");
    if (!machine.error.empty()) { report_error(machine.error, machine.error_offset, runtime_source.empty() ? nullptr : &runtime_source); return 1; } return 0;
  }
  auto object = tower_emit_object(text.c_str(), target, optimize, library);
  if (!frontend_modules_depfile(syntax_modules, output.c_str(), depfile.c_str())) { std::cerr << "Cannot write dependency file: " << depfile << '\n'; return 1; }
  timings.mark("compile");
  if (timings.enabled) for (const auto& [name, ms] : object.timings) driver_timing_value(timings.state, name.c_str(), uint64_t(ms * 1000000));
  if (!object.error.empty()) { report_error(object.error, object.error_offset); return 1; }
  if (!driver_write_ir(raw.c_str(), object.raw.data(), object.raw.size(), optimized.c_str(), object.optimized.data(), object.optimized.size())) return 1;
  if (output.empty()) output = driver_output_name(emit.c_str(), wasm, windows);
  if (emit == "object") return write(output, (const char*)object.bytes.data(), object.bytes.size()) ? 0 : 1;
  if (emit == "llvm" || emit == "llvm-optimized") { auto& text = emit == "llvm" ? object.raw : object.optimized; return write(output, text.data(), text.size()) ? 0 : 1; }
  if (emit != "exe") { std::cerr << "Unknown output kind: " << emit << '\n'; return 1; }
  for (auto& input : inputs) if (!fs::is_regular_file(input)) { std::cerr << "Missing link input: " << input << '\n'; return 1; }
  auto* link = driver_link_open(target.c_str(), cc.c_str(), linker.c_str(), sysroot.c_str(), output.c_str(), resources.c_str(), wasm, windows, timings.state, timings.enabled);
  if (!link) return 1;
  for (const auto& name : object.imports) driver_link_import(link, name.c_str());
  for (const auto& name : object.exports) driver_link_export(link, name.c_str());
  for (const auto& input : inputs) driver_link_input(link, input.c_str());
  return driver_link_run(link, object.bytes.data(), object.bytes.size());
}
