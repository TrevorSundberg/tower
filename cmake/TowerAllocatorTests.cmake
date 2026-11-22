# Focused opt-in allocator ABI tests. Reuse the production memory policy object
# and its existing native test-state storage; all functional checks are Tower.
option(TOWER_ALLOCATOR_TESTS "Build focused Tower allocator ABI tests" OFF)
if(TOWER_ALLOCATOR_TESTS)
  include("${CMAKE_CURRENT_FUNCTION_LIST_DIR}/TowerGuestRuntimeTests.cmake")
  foreach(unit IN ITEMS tests policy)
    set(input "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/allocator_glue.tower")
    if(triple MATCHES "^wasm32")
      set(input "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/allocator_wasi_entry.tower")
    endif()
    if(unit STREQUAL "policy")
      set(input "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/host/memory.tower")
    endif()
    tower_runtime_object(tower-allocator-${unit} "${input}" "${triple}")
  endforeach()
  get_property(runtime_trap GLOBAL PROPERTY TOWER_RUNTIME_TRAP_OBJECT)
  get_property(runtime_instrumented GLOBAL PROPERTY TOWER_RUNTIME_INSTRUMENTED_OBJECT)
  add_executable(tower-allocator-tests "${runtime_instrumented}"
    "${tower-allocator-tests_OBJECT}" "${tower-allocator-policy_OBJECT}" "${runtime_trap}")
  set_target_properties(tower-allocator-tests PROPERTIES LINKER_LANGUAGE C)
  # This fragment is included inside tower_compiler_host. Enable discovery in
  # directory scope too, including browser-only configurations.
  cmake_language(DEFER CALL enable_testing)
  tower_runtime_object(runtime-abi-tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/runtime_abi.tower" "${triple}")
  add_executable(tower-runtime-abi-tests "${runtime-abi-tests_OBJECT}")
  set_target_properties(tower-runtime-abi-tests PROPERTIES LINKER_LANGUAGE C)
  target_link_libraries(tower-runtime-abi-tests PRIVATE tower-compiler-memory tower-compiler-utilities)
  if(triple MATCHES "^wasm32")
    find_program(TOWER_ALLOCATOR_NODE NAMES node REQUIRED)
    add_test(NAME tower-allocator COMMAND "${TOWER_ALLOCATOR_NODE}"
      "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/host-wasi.mjs" "$<TARGET_FILE:tower-allocator-tests>")
    add_test(NAME tower-runtime-abi COMMAND "${TOWER_ALLOCATOR_NODE}"
      "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/host-wasi.mjs" "$<TARGET_FILE:tower-runtime-abi-tests>")
  else()
    add_test(NAME tower-allocator COMMAND tower-allocator-tests)
    add_test(NAME tower-runtime-abi COMMAND tower-runtime-abi-tests)
  endif()

  # Optional cross-target growth check, using upstream wasi-libc for memory
  # intrinsics. No runtime.c allocator or native test implementation is linked.
  set(TOWER_ALLOCATOR_WASI_SDK "" CACHE PATH "WASI SDK for focused wasm32 growth checks")
  if(TOWER_ALLOCATOR_WASI_SDK)
    find_program(TOWER_ALLOCATOR_NODE NAMES node REQUIRED)
    set(wasm_module "${CMAKE_CURRENT_BINARY_DIR}/tower-allocator-wasm.wasm")
    set(wasm_imports "${CMAKE_CURRENT_BINARY_DIR}/tower-allocator-wasm.imports")
    file(GENERATE OUTPUT "${wasm_imports}" CONTENT "tower_trap\n")
    tower_runtime_object(tower-allocator-wasm "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/allocator_wasm.tower" wasm32-unknown-unknown)
    add_custom_command(OUTPUT "${wasm_module}"
      COMMAND "${TOWER_ALLOCATOR_WASI_SDK}/bin/clang" "${tower-allocator-wasm_OBJECT}" -nostartfiles
        -Wl,--no-entry -Wl,--export=allocator_wasm_tests
        "-Wl,--allow-undefined-file=${wasm_imports}"
        -Wl,--initial-memory=131072 -Wl,--max-memory=524288 -o "${wasm_module}"
      DEPENDS "${tower-allocator-wasm_OBJECT}" "${wasm_imports}" VERBATIM)
    add_custom_target(tower-allocator-wasm DEPENDS "${wasm_module}")
    add_test(NAME tower-allocator-wasm COMMAND "${TOWER_ALLOCATOR_NODE}"
      "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/run-allocator-wasm.mjs" "${wasm_module}")
  endif()
endif()
