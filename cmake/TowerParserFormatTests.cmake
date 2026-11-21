# Separate unit avoids importing the complete test suite into compiler objects.
get_property(format_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
if(NOT format_triple MATCHES "^wasm32-" AND NOT format_triple MATCHES "^x86_64-.*linux")
  message(FATAL_ERROR "Revalidate the formatter fixture syntax ABI for ${format_triple}")
endif()
tower_runtime_object(format-cases "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/format_suite.tower" "${format_triple}"
  --declare driver_syntax_delete _ZdlPv)
target_sources(tower-parser-tests PRIVATE "${format-cases_OBJECT}")
if(format_triple MATCHES "^wasm32-")
  set(format_object "${CMAKE_CURRENT_BINARY_DIR}/tower-format-wasi.o")
  add_custom_command(OUTPUT "${format_object}"
    COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/format_wasi.tower"
      --library --target "${format_triple}"
      --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
      -o "${format_object}" --depfile "${format_object}.d"
    DEPFILE "${format_object}.d" DEPENDS scaffolding/tests/format_wasi.tower "${TOWER_BOOTSTRAP_COMPILER}" VERBATIM)
  set_source_files_properties("${format_object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
  add_executable(tower-format-tests "${format_object}" scaffolding/tower.cpp
    scaffolding/syntax.cpp scaffolding/syntax-nodes.cpp scaffolding/format.cpp
    scaffolding/lex-pattern.cpp)
  target_compile_features(tower-format-tests PRIVATE cxx_std_20)
  target_compile_options(tower-format-tests PRIVATE -fno-exceptions)
  target_link_libraries(tower-format-tests PRIVATE tower-compiler-parser-nodes tower-compiler-semantics
    tower-compiler-entities tower-compiler-utilities tower-compiler-memory)
endif()
