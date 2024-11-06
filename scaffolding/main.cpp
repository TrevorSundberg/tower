//#include <binaryen-c.h>
//#include <parser/wat-parser.h>
#include <stdio.h>
#include "tower.hpp"
#include "parser.hpp"

#include <llvm-c/Core.h>
#include <llvm-c/ExecutionEngine.h>
#include <llvm-c/Target.h>
#include <llvm-c/Analysis.h>
#include <llvm-c/BitWriter.h>

#include <inttypes.h>
#include <stdio.h>
#include <stdlib.h>
#include <chrono>

__attribute__((export_name("entry"))) int entry() {
  auto start = std::chrono::high_resolution_clock::now();
  /*
  auto* wasm = new wasm::Module;
  auto parsed = wasm::WATParser::parseModule(*wasm, "()");

  if (auto* err = parsed.getErr()) {
    printf("Failed wasm\n");
  } else {
    printf("Parsed wasm\n");
  }
  */

  tower_tests();
  parser_tests();

  char* default_triple = LLVMGetDefaultTargetTriple();
  printf("Current target triple for the native system: %s\n", default_triple);
  LLVMDisposeMessage(default_triple);

  // Create the LLVM module
  LLVMModuleRef mod = LLVMModuleCreateWithName("my_module");

  // Define function parameters and return type
  LLVMTypeRef ret_type = LLVMFunctionType(LLVMInt32Type(), nullptr, 0, 0);
  LLVMValueRef sum = LLVMAddFunction(mod, "mainCRTStartup", ret_type);

  // Create the entry basic block for the function
  LLVMBasicBlockRef entry = LLVMAppendBasicBlock(sum, "entry");

  // Create an LLVM builder and set its position
  LLVMBuilderRef builder = LLVMCreateBuilder();
  LLVMPositionBuilderAtEnd(builder, entry);

  // Add the function's body: add parameters and return the result
  LLVMBuildRet(builder, LLVMConstInt(LLVMInt32Type(), 124, false));

  // Verify the module for correctness
  char *error = NULL;
  LLVMVerifyModule(mod, LLVMAbortProcessAction, &error);
  LLVMDisposeMessage(error);

  // Initialize the target for WebAssembly
  LLVMInitializeWebAssemblyTarget();
  LLVMInitializeWebAssemblyTargetMC();
  LLVMInitializeWebAssemblyTargetInfo();
  LLVMInitializeWebAssemblyAsmPrinter();

  // Set up the target and target machine for WebAssembly
  const char* triple = "wasm32-wasi-thread"; //"wasm32-unknown-unknown-wasm"
  //const char* triple = "x86_64-pc-linux-gnu";
  //const char* triple = "x86_64-pc-windows-msvc";
  LLVMTargetRef target;
  if (LLVMGetTargetFromTriple(triple, &target, &error) != 0) {
    fprintf(stderr, "Error getting target: %s\n", error);
    LLVMDisposeMessage(error);
    return 1;
  }

  LLVMTargetMachineRef target_machine = LLVMCreateTargetMachine(
    target, triple, "", "", LLVMCodeGenLevelDefault,
    LLVMRelocDefault, LLVMCodeModelDefault);

  // Set the module's target triple
  LLVMSetTarget(mod, triple);

  // Write the module to a WASM file
  LLVMMemoryBufferRef buffer;
  if (LLVMTargetMachineEmitToMemoryBuffer(target_machine, mod, LLVMObjectFile, &error, &buffer) != 0) {
    fprintf(stderr, "Error writing WASM to buffer: %s`\n", error);
    LLVMDisposeMessage(error);
    return 1;
  }

  if (LLVMTargetMachineEmitToFile(target_machine, mod, "sum.o", LLVMObjectFile, &error) != 0) {
    fprintf(stderr, "Error writing WASM to file: %s\n", error);
    LLVMDisposeMessage(error);
    return 1;
  }

  // Clean up
  LLVMDisposeBuilder(builder);
  LLVMDisposeTargetMachine(target_machine);
  LLVMDisposeModule(mod);

  auto elapsed = std::chrono::high_resolution_clock::now() - start;
  long long ms = std::chrono::duration_cast<std::chrono::milliseconds>(elapsed).count();
  printf("MS: %d\n", (int)ms);
  return 123;
}
