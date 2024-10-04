#include <binaryen-c.h>
#include <parser/wat-parser.h>
#include <stdio.h>
#include "tower.hpp"
#include "parser.hpp"

__attribute__((export_name("entry"))) int entry() {
  auto* wasm = new wasm::Module;
  auto parsed = wasm::WATParser::parseModule(*wasm, "()");

  if (auto* err = parsed.getErr()) {
    printf("Failed wasm\n");
  } else {
    printf("Parsed wasm\n");
  }

  tower_tests();
  parser_tests();

  return 123;
}
