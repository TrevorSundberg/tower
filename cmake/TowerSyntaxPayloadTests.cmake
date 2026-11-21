get_property(payload_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
set(payload_entry main)
if(payload_triple MATCHES "^wasm32-")
  set(payload_entry __main_argc_argv)
endif()
set(payload_input "${CMAKE_CURRENT_BINARY_DIR}/tower_syntax_nodes_main.tower")
set(payload_main "${CMAKE_CURRENT_BINARY_DIR}/tower-syntax-nodes-main.o")
set(payload_cases "${CMAKE_CURRENT_BINARY_DIR}/tower-syntax-nodes-cases.o")
file(GENERATE OUTPUT "${payload_input}" CONTENT "import tower;\nextern fn syntax_nodes_tests(): void;\nexport fn ${payload_entry}(argc: i32, argv: u8**): i32 { syntax_nodes_tests(); return 0; }\n")
foreach(unit IN ITEMS main cases)
  set(input "${payload_input}")
  set(object "${payload_main}")
  if(unit STREQUAL "cases")
    set(input "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/syntax_nodes.tower")
    set(object "${payload_cases}")
  endif()
  add_custom_command(OUTPUT "${object}"
    COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${input}" --library --target "${payload_triple}"
      --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
      -o "${object}" --depfile "${object}.d"
    DEPFILE "${object}.d" DEPENDS "${input}" "${TOWER_BOOTSTRAP_COMPILER}" VERBATIM)
  set_source_files_properties("${object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
endforeach()
add_executable(tower-syntax-nodes-tests "${payload_main}" "${payload_cases}" scaffolding/tower.cpp
  scaffolding/syntax.cpp scaffolding/syntax-nodes.cpp scaffolding/format.cpp
  scaffolding/lex-pattern.cpp scaffolding/lex-pattern-common.cpp)
target_compile_features(tower-syntax-nodes-tests PRIVATE cxx_std_20)
target_compile_options(tower-syntax-nodes-tests PRIVATE -fno-exceptions)
target_link_libraries(tower-syntax-nodes-tests PRIVATE tower-compiler-parser-nodes tower-compiler-semantics
  tower-compiler-entities tower-compiler-utilities tower-compiler-memory)
add_test(NAME tower-syntax-nodes-tests COMMAND tower-syntax-nodes-tests)
target_sources(tower-parser-tests PRIVATE "${payload_cases}")
