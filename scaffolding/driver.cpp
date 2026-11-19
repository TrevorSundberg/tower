#include "core.hpp"
#ifdef TOWER_INTERPRETER_SEED
#include "bootstrap/interpreter-reference.hpp"
#define CoreMachine NativeCoreMachine
#endif
#include "llvm-engine.hpp"
#include "compiler-host.hpp"
#include <llvm/TargetParser/Host.h>
#include <llvm/Support/Program.h>
#include <llvm/Support/FileSystem.h>
#include <llvm/ADT/SmallString.h>
#include <fstream>
#include <iostream>
#include <filesystem>
#include <chrono>

namespace fs = std::filesystem;
namespace {
struct Timings {
  using Clock = std::chrono::steady_clock;
  Clock::time_point start = Clock::now(), previous = start;
  bool enabled = false;
  std::map<std::string, double> values;
  void mark(const std::string& name) {
    if (!enabled) return;
    auto now = Clock::now(); values[name] = std::chrono::duration<double, std::milli>(now - previous).count(); previous = now;
  }
  ~Timings() {
    if (!enabled) return;
    values["total"] = std::chrono::duration<double, std::milli>(Clock::now() - start).count();
    std::cerr << "Tower timings (ms): {"; bool first = true;
    for (const auto& [name, ms] : values) { if (!first) std::cerr << ','; first = false; std::cerr << '"' << name << "\":" << ms; }
    std::cerr << "}\n";
  }
};
#ifdef TOWER_BOOTSTRAP_HOST
std::string read(const fs::path& path) { std::ifstream input(path, std::ios::binary); return {std::istreambuf_iterator<char>(input), {}}; }
bool write(const fs::path& path, const char* bytes, size_t count) { std::ofstream out(path, std::ios::binary); out.write(bytes, std::streamsize(count)); return bool(out); }
#else
std::string read(const fs::path& path) {
  TowerByteBuffer buffer{};
  if (!driver_read_file(path.string().c_str(), &buffer)) { std::cerr << "Cannot read file: " << path.string() << '\n'; std::exit(1); }
  std::string result(reinterpret_cast<const char*>(buffer.data), buffer.length);
  bytes_dispose(&buffer);
  return result;
}
bool write(const fs::path& path, const char* bytes, size_t count) { return driver_write_file(path.string().c_str(), bytes, count); }
#endif
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
  Timings timings;
  std::string source, output, target = llvm::sys::getDefaultTargetTriple(), emit = "exe", cc = "clang", linker, sysroot, raw, optimized, bedrock_path, foundation_path, resources;
  std::vector<std::string> inputs; bool optimize = true, interpret = false, library = false;
#ifdef TOWER_BOOTSTRAP_HOST
  // Retained only in towerc-seed until the Tower-only bootstrap is available.
  for (int i = 1; i < argc; ++i) {
    std::string arg = argv[i];
    if (arg == "--help") {
      std::cout << "towerc source.tower -o output [--target triple] [--emit object|llvm|llvm-optimized|exe]\n"
        "  [--link object-or-library] [--cc clang] [--linker tool] [--sysroot path]\n"
        "  [--raw-ir file] [--optimized-ir file] [--no-optimize] [--interpret] [--library] [--timings]\n"
        "  [--bedrock file] [--foundation file]\n"; return 0;
    }
    if (arg == "--no-optimize") { optimize = false; continue; }
    if (arg == "--interpret") { interpret = true; continue; }
    if (arg == "--timings") { timings.enabled = true; continue; }
    if (arg == "--library") { library = true; emit = "object"; continue; }
    if (arg == "-o" || arg == "--target" || arg == "--emit" || arg == "--link" || arg == "--cc" || arg == "--linker" || arg == "--sysroot" || arg == "--raw-ir" || arg == "--optimized-ir" || arg == "--bedrock" || arg == "--foundation") {
      if (++i == argc) { std::cerr << "Missing argument for " << arg << '\n'; return 1; }
      if (arg == "-o") output = argv[i]; else if (arg == "--target") target = argv[i]; else if (arg == "--emit") emit = argv[i];
      else if (arg == "--link") inputs.push_back(argv[i]); else if (arg == "--cc") cc = argv[i]; else if (arg == "--linker") linker = argv[i];
      else if (arg == "--sysroot") sysroot = argv[i]; else if (arg == "--raw-ir") raw = argv[i];
      else if (arg == "--bedrock") bedrock_path = argv[i]; else if (arg == "--foundation") foundation_path = argv[i]; else optimized = argv[i];
    } else if (arg.starts_with('-') || !source.empty()) { std::cerr << "Unexpected argument: " << arg << '\n'; return 1; }
    else source = arg;
  }
#else
  DriverOptions options;
  const bool parsed = driver_parse(&options, size_t(argc), argv, target.c_str());
  timings.enabled = options.timings;
  if (!parsed) {
    if (options.error == 1) std::cerr << "Missing argument for " << options.argument << '\n';
    else if (options.error == 2) std::cerr << "Unexpected argument: " << options.argument << '\n';
    else std::cerr << "Unable to allocate command-line link inputs\n";
    driver_dispose(&options);
    return 1;
  }
  if (options.help || options.version) {
    std::cout << (options.version ? driver_version() : driver_help());
    driver_dispose(&options);
    return 0;
  }
  TowerByteBuffer resource_path{};
  const bool located = driver_resource_root(&resource_path, llvm::sys::fs::getMainExecutable(argv[0], reinterpret_cast<void*>(&main)).c_str());
  if (located) resources.assign(reinterpret_cast<const char*>(resource_path.data), resource_path.length);
  bytes_dispose(&resource_path);
  if (!located) { driver_dispose(&options); std::cerr << "Cannot locate compiler resources\n"; return 1; }
  source = options.source; output = options.output; target = options.target;
  emit = options.emit; cc = options.cc; linker = options.linker; sysroot = options.sysroot;
  raw = options.raw; optimized = options.optimized; bedrock_path = options.bedrock;
  foundation_path = options.foundation; optimize = options.optimize; interpret = options.interpret;
  library = options.library; timings.enabled = options.timings;
  for (size_t i = 0; i < options.link_count; ++i) inputs.emplace_back(options.links[i]);
  driver_dispose(&options);
  if (!driver_output_valid(emit.c_str())) { std::cerr << "Unknown output kind: " << emit << '\n'; return 1; }
#endif
  if (source.empty() || !fs::exists(source)) { std::cerr << "Supply a Tower source file; use --help for options\n"; return 1; }
#ifdef TOWER_BOOTSTRAP_HOST
  const fs::path root = fs::path(llvm::sys::fs::getMainExecutable(argv[0], reinterpret_cast<void*>(&main))).parent_path() / "share/tower";
#else
  const fs::path root(resources);
#endif
  const auto bedrock_file = bedrock_path.empty() ? root / "bedrock.tower" : fs::path(bedrock_path);
  const auto foundation_file = foundation_path.empty() ? root / "foundation.tower" : fs::path(foundation_path);
  for (const auto& module : {bedrock_file, foundation_file}) {
    std::ifstream input(module, std::ios::binary);
    if (!input) { std::cerr << "Cannot read grammar module: " << module.string() << '\n'; return 1; }
  }
  auto error = syntax_set_bedrock(read(bedrock_file).c_str());
  if (error.empty()) error = syntax_set_bootstrap(read(foundation_file).c_str());
  if (!error.empty()) { std::cerr << error << '\n'; return 1; }
  timings.mark("bootstrap");
  auto text = read(source);
  const auto report_error = [&](const std::string& error, size_t offset) {
    size_t line = 1, column = 1;
#ifdef TOWER_BOOTSTRAP_HOST
    for (size_t i = 0; i < offset && i < text.size(); ++i) {
      auto c = static_cast<unsigned char>(text[i]);
      if (c == '\n') { ++line; column = 1; }
      else if ((c & 0xc0) != 0x80) ++column;
    }
#else
    driver_source_position(text.data(), text.size(), offset, &line, &column);
#endif
    std::cerr << source << ':' << line << ':' << column << ": " << error << '\n';
  };
  if (text.find('\0') != std::string::npos) { std::cerr << "Source contains NUL bytes\n"; return 1; }
  bool wasm = target.starts_with("wasm"), windows = target.find("windows") != std::string::npos;
  if (interpret) {
    auto width = tower_target_pointer_bytes(target, error);
    if (!error.empty()) { std::cerr << error << '\n'; return 1; }
    CoreMachine machine(core_compile_foundation(text.c_str(), width));
    timings.mark("compile");
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
    if (!machine.error.empty()) { report_error(machine.error, machine.error_offset); return 1; } return 0;
  }
  auto object = tower_emit_object(text.c_str(), target, optimize, library);
  timings.mark("compile");
  if (timings.enabled) timings.values.insert(object.timings.begin(), object.timings.end());
  if (!object.error.empty()) { report_error(object.error, object.error_offset); return 1; }
  if ((!raw.empty() && !write(raw, object.raw.data(), object.raw.size())) || (!optimized.empty() && !write(optimized, object.optimized.data(), object.optimized.size()))) { std::cerr << "Cannot write LLVM output\n"; return 1; }
#ifdef TOWER_BOOTSTRAP_HOST
  if (output.empty()) output = emit == "object" ? "tower.o" : emit.starts_with("llvm") ? "tower.ll" : wasm ? "tower.wasm" : windows ? "tower.exe" : "tower.out";
#else
  if (output.empty()) output = driver_output_name(emit.c_str(), wasm, windows);
#endif
  if (emit == "object") return write(output, (const char*)object.bytes.data(), object.bytes.size()) ? 0 : 1;
  if (emit == "llvm" || emit == "llvm-optimized") { auto& text = emit == "llvm" ? object.raw : object.optimized; return write(output, text.data(), text.size()) ? 0 : 1; }
  if (emit != "exe") { std::cerr << "Unknown output kind: " << emit << '\n'; return 1; }
  for (auto& input : inputs) if (!fs::is_regular_file(input)) { std::cerr << "Missing link input: " << input << '\n'; return 1; }
  Temporary program("o"), runtime("o"), allowed("txt");
  if (program.path.empty() || runtime.path.empty() || allowed.path.empty()) return 1;
  if (!write(program.str(), (const char*)object.bytes.data(), object.bytes.size())) return 1;
  std::vector<std::string> compile{"--target=" + target, "-O2", "-ffreestanding", "-fno-builtin", "-c", (root / "runtime.c").string(), "-o", runtime.str()};
  if (!sysroot.empty()) compile.push_back("--sysroot=" + sysroot);
  if (run(cc, compile)) return 1;
  timings.mark("runtimeCompile");
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
  auto result = run(linker, args); timings.mark("link"); return result;
}
