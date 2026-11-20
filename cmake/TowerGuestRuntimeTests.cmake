function(tower_guest_runtime_tests)
  if(NOT TOWER_ALLOCATOR_TESTS OR NOT TOWER_ALLOCATOR_WASI_SDK)
    return()
  endif()
  tower_guest_runtime(wasm32 wasm32-unknown-unknown wasm OFF)
  get_property(runtime GLOBAL PROPERTY TOWER_GUEST_wasm32_OBJECT)
  foreach(mode IN ITEMS fixed growth)
    set(source guest_runtime_abi)
    set(function allocator_wasm_tests)
    set(maximum 131072)
    if(mode STREQUAL "growth")
      set(source guest_runtime_growth)
      set(function guest_runtime_growth_tests)
      set(maximum 524288)
    endif()
    set(base "${CMAKE_CURRENT_BINARY_DIR}/guest-runtime-${mode}-tests")
    add_custom_command(OUTPUT "${base}.o"
      COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/${source}.tower"
        --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
        --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
        --library --target wasm32-unknown-unknown -o "${base}.o" --depfile "${base}.d"
      DEPFILE "${base}.d"
      DEPENDS "${TOWER_BOOTSTRAP_COMPILER}" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/${source}.tower" VERBATIM)
    file(GENERATE OUTPUT "${base}.imports" CONTENT "tower_trap\n")
    add_custom_command(OUTPUT "${base}.wasm"
      COMMAND "${TOWER_ALLOCATOR_WASI_SDK}/bin/wasm-ld" --no-entry --export=${function}
        --allow-undefined-file=${base}.imports --initial-memory=131072 --max-memory=${maximum}
        "${base}.o" "${runtime}" -o "${base}.wasm"
      DEPENDS "${base}.o" "${base}.imports" "${runtime}" VERBATIM)
    add_custom_target(tower-guest-runtime-${mode}-tests ALL DEPENDS "${base}.wasm")
    add_test(NAME tower-guest-runtime-${mode} COMMAND "${TOWER_ALLOCATOR_NODE}"
      "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/run-allocator-wasm.mjs" "${base}.wasm" "${function}")
  endforeach()
endfunction()
cmake_language(DEFER CALL tower_guest_runtime_tests)
