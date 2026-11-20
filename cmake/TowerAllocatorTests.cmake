# Focused opt-in allocator ABI tests. Reuse the production memory policy object
# and its existing native test-state storage; all functional checks are Tower.
option(TOWER_ALLOCATOR_TESTS "Build focused Tower allocator ABI tests" OFF)
if(TOWER_ALLOCATOR_TESTS)
  set(allocator_test_object "${CMAKE_CURRENT_BINARY_DIR}/tower-allocator-tests.o")
  set(allocator_policy_object "${CMAKE_CURRENT_BINARY_DIR}/tower-allocator-policy.o")
  foreach(unit IN ITEMS test policy)
    set(input "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/allocator-glue.tower")
    if(triple MATCHES "^wasm32")
      set(input "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/allocator-wasi-entry.tower")
    endif()
    if(unit STREQUAL "policy")
      set(input "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/host/memory.tower")
    endif()
    set(object "${allocator_${unit}_object}")
    add_custom_command(OUTPUT "${object}"
      COMMAND "${bootstrap}" "${input}" --library --target "${triple}"
        --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
        --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
        -o "${object}" --depfile "${object}.d"
      DEPFILE "${object}.d"
      DEPENDS "${bootstrap}" "${input}" VERBATIM)
    set_source_files_properties("${object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
  endforeach()
  add_executable(tower-allocator-tests scaffolding/compiler-memory.cpp
    "${allocator_test_object}" "${allocator_policy_object}")
  target_compile_features(tower-allocator-tests PRIVATE cxx_std_20)
  target_compile_definitions(tower-allocator-tests PRIVATE TOWER_COMPILER_MEMORY_TESTS=1)
  enable_testing()
  if(triple MATCHES "^wasm32")
    find_program(TOWER_ALLOCATOR_NODE NAMES node REQUIRED)
    add_test(NAME tower-allocator COMMAND "${TOWER_ALLOCATOR_NODE}"
      "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/host-wasi.mjs" "$<TARGET_FILE:tower-allocator-tests>")
  else()
    add_test(NAME tower-allocator COMMAND tower-allocator-tests)
  endif()

  # Optional cross-target growth check, using upstream wasi-libc for memory
  # intrinsics. No runtime.c allocator or native test implementation is linked.
  set(TOWER_ALLOCATOR_WASI_SDK "" CACHE PATH "WASI SDK for focused wasm32 growth checks")
  if(TOWER_ALLOCATOR_WASI_SDK)
    find_program(TOWER_ALLOCATOR_NODE NAMES node REQUIRED)
    set(wasm_object "${CMAKE_CURRENT_BINARY_DIR}/tower-allocator-wasm.o")
    set(wasm_module "${CMAKE_CURRENT_BINARY_DIR}/tower-allocator-wasm.wasm")
    set(wasm_imports "${CMAKE_CURRENT_BINARY_DIR}/tower-allocator-wasm.imports")
    file(GENERATE OUTPUT "${wasm_imports}" CONTENT "tower_trap\n")
    add_custom_command(OUTPUT "${wasm_object}"
      COMMAND "${bootstrap}" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/allocator-wasm.tower"
        --library --target wasm32-unknown-unknown
        --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
        --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
        -o "${wasm_object}" --depfile "${wasm_object}.d"
      DEPFILE "${wasm_object}.d"
      DEPENDS "${bootstrap}" scaffolding/tests/allocator-wasm.tower VERBATIM)
    add_custom_command(OUTPUT "${wasm_module}"
      COMMAND "${TOWER_ALLOCATOR_WASI_SDK}/bin/clang" "${wasm_object}" -nostartfiles
        -Wl,--no-entry -Wl,--export=allocator_wasm_tests
        "-Wl,--allow-undefined-file=${wasm_imports}"
        -Wl,--initial-memory=131072 -Wl,--max-memory=524288 -o "${wasm_module}"
      DEPENDS "${wasm_object}" "${wasm_imports}" VERBATIM)
    add_custom_target(tower-allocator-wasm DEPENDS "${wasm_module}")
    add_test(NAME tower-allocator-wasm COMMAND "${TOWER_ALLOCATOR_NODE}"
      "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/run-allocator-wasm.mjs" "${wasm_module}")
  endif()
endif()
