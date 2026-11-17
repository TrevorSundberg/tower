#include "core.hpp"
#include "llvm-engine.hpp"
#include <llvm/TargetParser/Host.h>
#include <llvm/Support/Program.h>
#include <llvm/Support/FileSystem.h>
#include <llvm/ADT/SmallString.h>
#include <fstream>
#include <iostream>
#include <filesystem>

namespace fs = std::filesystem;
namespace {
std::string read(const fs::path& path) { std::ifstream input(path, std::ios::binary); return {std::istreambuf_iterator<char>(input), {}}; }
bool write(const fs::path& path, const char* bytes, size_t count) { std::ofstream out(path, std::ios::binary); out.write(bytes, std::streamsize(count)); return bool(out); }
int run(const std::string& executable, const std::vector<std::string>& args) {
  auto path = llvm::sys::findProgramByName(executable); if (!path) { std::cerr << "Cannot find tool: " << executable << '\n'; return 1; }
  std::vector<llvm::StringRef> refs{*path}; for (auto& arg : args) refs.emplace_back(arg);
  std::string error; int code = llvm::sys::ExecuteAndWait(*path, refs, std::nullopt, {}, 0, 0, &error);
  if (!error.empty()) std::cerr << error << '\n'; return code == 0 ? 0 : 1;
}
struct Temporary {
  llvm::SmallString<128> path;
  explicit Temporary(const char* suffix) { if (auto error = llvm::sys::fs::createTemporaryFile("tower", suffix, path)) { std::cerr << "Cannot create temporary file: " << error.message() << '\n'; path.clear(); } }
  ~Temporary() { if (!path.empty()) llvm::sys::fs::remove(path); }
  std::string str() const { return std::string(path); }
};
}
int main(int argc, char** argv) {
  std::string source, output, target = llvm::sys::getDefaultTargetTriple(), emit = "exe", cc = "clang", linker, sysroot, raw, optimized;
  std::vector<std::string> inputs; bool optimize = true, interpret = false, library = false;
  for (int i = 1; i < argc; ++i) {
    std::string arg = argv[i];
    if (arg == "--help") {
      std::cout << "towerc source.tower -o output [--target triple] [--emit object|llvm|llvm-optimized|exe]\n"
        "  [--link object-or-library] [--cc clang] [--linker tool] [--sysroot path]\n"
        "  [--raw-ir file] [--optimized-ir file] [--no-optimize] [--interpret] [--library]\n"; return 0;
    }
    if (arg == "--no-optimize") { optimize = false; continue; }
    if (arg == "--interpret") { interpret = true; continue; }
    if (arg == "--library") { library = true; emit = "object"; continue; }
    if (arg == "-o" || arg == "--target" || arg == "--emit" || arg == "--link" || arg == "--cc" || arg == "--linker" || arg == "--sysroot" || arg == "--raw-ir" || arg == "--optimized-ir") {
      if (++i == argc) { std::cerr << "Missing argument for " << arg << '\n'; return 1; }
      if (arg == "-o") output = argv[i]; else if (arg == "--target") target = argv[i]; else if (arg == "--emit") emit = argv[i];
      else if (arg == "--link") inputs.push_back(argv[i]); else if (arg == "--cc") cc = argv[i]; else if (arg == "--linker") linker = argv[i];
      else if (arg == "--sysroot") sysroot = argv[i]; else if (arg == "--raw-ir") raw = argv[i]; else optimized = argv[i];
    } else if (arg.starts_with('-') || !source.empty()) { std::cerr << "Unexpected argument: " << arg << '\n'; return 1; }
    else source = arg;
  }
  if (source.empty() || !fs::exists(source)) { std::cerr << "Supply a Tower source file; use --help for options\n"; return 1; }
  const fs::path root(TOWER_SOURCE_DIR);
  auto error = syntax_set_bedrock(read(root / "scaffolding/bedrock.tower").c_str());
  if (error.empty()) error = syntax_set_bootstrap(read(root / "scaffolding/foundation.tower").c_str());
  if (!error.empty()) { std::cerr << error << '\n'; return 1; }
  auto text = read(source);
  if (text.find('\0') != std::string::npos) { std::cerr << "Source contains NUL bytes\n"; return 1; }
  bool wasm = target.starts_with("wasm"), windows = target.find("windows") != std::string::npos;
  if (interpret) {
    auto width = tower_target_pointer_bytes(target, error);
    if (!error.empty()) { std::cerr << error << '\n'; return 1; }
    CoreMachine machine(core_compile_foundation(text.c_str(), width));
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
    if (!machine.error.empty()) { std::cerr << machine.error << " at byte " << machine.error_offset << '\n'; return 1; } return 0;
  }
  auto object = tower_emit_object(text.c_str(), target, optimize, library);
  if (!object.error.empty()) { std::cerr << source << ':' << object.error_offset << ": " << object.error << '\n'; return 1; }
  if ((!raw.empty() && !write(raw, object.raw.data(), object.raw.size())) || (!optimized.empty() && !write(optimized, object.optimized.data(), object.optimized.size()))) { std::cerr << "Cannot write LLVM output\n"; return 1; }
  if (output.empty()) output = emit == "object" ? "tower.o" : emit.starts_with("llvm") ? "tower.ll" : wasm ? "tower.wasm" : windows ? "tower.exe" : "tower.out";
  if (emit == "object") return write(output, (const char*)object.bytes.data(), object.bytes.size()) ? 0 : 1;
  if (emit == "llvm" || emit == "llvm-optimized") { auto& text = emit == "llvm" ? object.raw : object.optimized; return write(output, text.data(), text.size()) ? 0 : 1; }
  if (emit != "exe") { std::cerr << "Unknown output kind: " << emit << '\n'; return 1; }
  for (auto& input : inputs) if (!fs::is_regular_file(input)) { std::cerr << "Missing link input: " << input << '\n'; return 1; }
  Temporary program("o"), runtime("o"), allowed("txt");
  if (program.path.empty() || runtime.path.empty() || allowed.path.empty()) return 1;
  if (!write(program.str(), (const char*)object.bytes.data(), object.bytes.size())) return 1;
  std::vector<std::string> compile{"--target=" + target, "-O2", "-ffreestanding", "-fno-builtin", "-c", (root / "scaffolding/runtime.c").string(), "-o", runtime.str()};
  if (!sysroot.empty()) compile.push_back("--sysroot=" + sysroot);
  if (run(cc, compile)) return 1;
  std::vector<std::string> args;
  if (wasm) {
    if (linker.empty()) linker = "wasm-ld-19";
    std::string imports = "tower_print\ntower_trap\n"; for (auto& name : object.imports) imports += name + '\n';
    write(allowed.str(), imports.data(), imports.size());
    args = {"--no-entry", "--export=tower_main", "--export-memory", "--allow-undefined-file=" + allowed.str(), "--stack-first", "-z", "stack-size=4194304", "--max-memory=268435456", program.str(), runtime.str()};
    for (auto& name : object.exports) args.push_back("--export=" + name);
  } else if (windows) {
    if (linker.empty()) linker = "lld-link-19";
    args = {"/entry:mainCRTStartup", "/subsystem:console", "/out:" + output, program.str(), runtime.str()};
    for (auto& name : object.exports) args.push_back("/export:" + name);
  } else {
    if (linker.empty()) linker = cc;
    args = {"--target=" + target, program.str(), runtime.str()}; if (!sysroot.empty()) args.push_back("--sysroot=" + sysroot);
  }
  args.insert(args.end(), inputs.begin(), inputs.end());
  if (!windows) { args.push_back("-o"); args.push_back(output); }
  return run(linker, args);
}
