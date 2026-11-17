#include "llvm-engine.hpp"
#include <llvm/Support/JSON.h>
#include <llvm/Support/raw_ostream.h>
#include <lld/Common/Driver.h>
#include <lld/Common/CommonLinkerContext.h>
#include <fstream>
#include <chrono>
#include <map>
#include "tower-runtime.inc"
LLD_HAS_DRIVER(wasm)
#ifdef TOWER_BROWSER_CROSS
LLD_HAS_DRIVER(elf)
LLD_HAS_DRIVER(coff)
LLD_HAS_DRIVER(macho)
#endif
using namespace llvm;
namespace {
std::string before_ir, after_ir, disassembly, response;
std::vector<uint8_t> executable;
std::map<std::string, std::vector<uint8_t>> libraries;
std::string target_triple = "wasm32-unknown-unknown";
void write(const std::string& path, const uint8_t* bytes, size_t length) {
  std::ofstream out(path, std::ios::binary); out.write((const char*)bytes, std::streamsize(length));
}
const char* failure(const std::string& error, size_t offset = 0) {
  executable.clear(); response.clear(); raw_string_ostream out(response);
  out << json::Value(json::Object{{"status", "error"}, {"error", error}, {"errorOffset", int64_t(offset)}}); return response.c_str();
}
}
#define EXPORT(name) extern "C" __attribute__((export_name(name)))
EXPORT("tw_llvm_set_target") int tw_llvm_set_target(const char* target) {
  if (!target) return 0; std::string value(target);
  if (value.empty() || value.size() > 128 || value.find_first_not_of("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-") != std::string::npos) return 0;
  target_triple = value; return 1;
}
EXPORT("tw_llvm_clear_inputs") void tw_llvm_clear_inputs() { for (auto& [name, bytes] : libraries) std::remove(name.c_str()); libraries.clear(); }
EXPORT("tw_llvm_add_input") int tw_llvm_add_input(const char* name, const uint8_t* bytes, size_t length) {
  if (!name || !bytes || length > 64 * 1024 * 1024 || libraries.size() >= 64) return 0;
  std::string path(name);
  if (path.empty() || path.size() > 128 || path.find_first_not_of("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-") != std::string::npos || path.starts_with("tower-")) return 0;
  libraries[path] = {bytes, bytes + length}; return 1;
}
EXPORT("tw_llvm_compile_options") const char* tw_llvm_compile_options(const char* source, size_t length, unsigned flags) {
  using Clock = std::chrono::steady_clock;
  before_ir.clear(); after_ir.clear(); disassembly.clear(); executable.clear();
  if (!source || length > 8 * 1024 * 1024) return failure("Invalid foundation source length");
  std::string text(source, length); if (text.find('\0') != std::string::npos) return failure("Foundation source cannot contain NUL bytes");
  auto object = tower_emit_object(text.c_str(), target_triple, true, (flags & 2) != 0);
  if (!object.error.empty()) return failure(object.error, object.error_offset);
  before_ir = object.raw; after_ir = object.optimized;
  bool wasm = target_triple.starts_with("wasm"), windows = target_triple.find("windows") != std::string::npos;
  bool mac = target_triple.find("apple") != std::string::npos;
  if (flags & 3) executable = object.bytes;
  else {
  write("tower-input.o", object.bytes.data(), object.bytes.size());
  if (wasm) write("tower-runtime.o", tower_runtime_object, sizeof(tower_runtime_object));
  std::string allowed = "tower_print\ntower_trap\n";
  for (auto& name : object.imports) allowed += name + '\n';
  write("tower-allowed.txt", (const uint8_t*)allowed.data(), allowed.size());
  std::vector<std::string> arguments;
  if (wasm) arguments = {"wasm-ld", "--no-entry", "--export=tower_main", "--export-memory", "--allow-undefined-file=tower-allowed.txt", "--threads=1",
    "--stack-first", "-z", "stack-size=4194304", "--initial-memory=8388608", "--max-memory=268435456", "tower-input.o", "tower-runtime.o"};
  else if (windows) arguments = {"lld-link", "/entry:mainCRTStartup", "/subsystem:console", "/machine:x64", "/timestamp:0", "/threads:1", "/out:tower-output.bin", "tower-input.o"};
  else if (mac) arguments = {"ld64.lld", "-arch", target_triple.starts_with("x86_64") ? "x86_64" : "arm64", "-platform_version", "macos", "11.0", "11.0", "-e", "_main", "tower-input.o"};
  else arguments = {"ld.lld", "--threads=1", "-static", "--build-id=none", "-e", "_start", "tower-input.o"};
  for (auto& [name, bytes] : libraries) { write(name, bytes.data(), bytes.size()); arguments.push_back(name); }
  for (auto& name : object.exports) { if (wasm) arguments.push_back("--export=" + name); else if (windows) arguments.push_back("/export:" + name); }
  if (wasm) { arguments.push_back("--export=tower_allocate"); arguments.push_back("--export=tower_deallocate"); }
  if (!windows) { arguments.push_back("-o"); arguments.push_back("tower-output.bin"); }
  std::vector<const char*> args; for (auto& arg : arguments) args.push_back(arg.c_str());
  auto start = Clock::now(); std::string link_out, link_error; raw_string_ostream output(link_out), diagnostics(link_error);
  bool linked = false;
  if (wasm) linked = lld::wasm::link(args, output, diagnostics, false, false);
#ifdef TOWER_BROWSER_CROSS
  else if (windows) linked = lld::coff::link(args, output, diagnostics, false, false);
  else if (mac) linked = lld::macho::link(args, output, diagnostics, false, false);
  else linked = lld::elf::link(args, output, diagnostics, false, false);
#else
  else return failure("This compiler module includes only the WebAssembly linker");
#endif
  lld::CommonLinkerContext::destroy();
  if (!linked) return failure("Link failed: " + link_error);
  std::ifstream file("tower-output.bin", std::ios::binary); if (!file) return failure("Cannot read linked executable");
  executable.assign(std::istreambuf_iterator<char>(file), {});
  object.timings["link"] = std::chrono::duration<double, std::milli>(Clock::now() - start).count();
  }
  auto decoded = Clock::now(); disassembly = tower_disassemble(executable, target_triple);
  object.timings["disassembly"] = std::chrono::duration<double, std::milli>(Clock::now() - decoded).count();
  json::Object timings; for (auto& [name, ms] : object.timings) timings[name] = ms;
  json::Array imports, exports; for (auto& name : object.imports) imports.push_back(name); for (auto& name : object.exports) exports.push_back(name);
  json::Object signatures; for (auto& [name, types] : object.signatures) { json::Array args; for (auto& t : types) args.push_back(t); signatures[name] = std::move(args); }
  response.clear(); raw_string_ostream report(response);
  report << json::Value(json::Object{{"status", "compiled"}, {"format", flags & 3 ? "object" : wasm ? "wasm" : windows ? "pe" : mac ? "macho" : "elf"}, {"target", target_triple}, {"imports", std::move(imports)}, {"exports", std::move(exports)}, {"signatures", std::move(signatures)},
    {"timings", std::move(timings)}, {"bytes", int64_t(executable.size())}, {"passes", "sroa, mem2reg, instcombine, simplifycfg, O2"}});
  return response.c_str();
}
EXPORT("tw_llvm_compile") const char* tw_llvm_compile(const char* source, size_t length) { return tw_llvm_compile_options(source, length, 0); }
EXPORT("tw_llvm_before") const char* tw_llvm_before() { return before_ir.c_str(); }
EXPORT("tw_llvm_after") const char* tw_llvm_after() { return after_ir.c_str(); }
EXPORT("tw_llvm_disassembly") const char* tw_llvm_disassembly() { return disassembly.c_str(); }
EXPORT("tw_llvm_bytes") const uint8_t* tw_llvm_bytes() { return executable.data(); }
EXPORT("tw_llvm_size") size_t tw_llvm_size() { return executable.size(); }
