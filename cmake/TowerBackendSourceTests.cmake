# Reuse the browser's Tower source/session assertions with native LLVM. Only the
# file/clock transport differs; no browser/vendor rebuild or second test model.
if(NOT TOWER_NATIVE OR NOT triple MATCHES "linux")
  return()
endif()
tower_guest_runtime(wasm32 wasm32-unknown-unknown wasm OFF UNINSTRUMENTED)
get_property(source_runtime GLOBAL PROPERTY TOWER_GUEST_wasm32_OBJECT)
set(source_input "${CMAKE_CURRENT_BINARY_DIR}/tower_backend_source_tests.tower")
file(GENERATE OUTPUT "${source_input}" CONTENT
  "import tower;\nimport compiler.units.backend_core;\nimport backend.file_posix;\nimport tower_backend_native_targets;\nimport backend.target_once_linux;\nimport backend.linker_wasi_wasm;\nimport tests.backend_source_native_main;\n")
tower_runtime_object(tower-backend-source "${source_input}" "${triple}")
add_custom_command(OUTPUT "${tower-backend-source_OBJECT}" APPEND
  DEPENDS "${CMAKE_CURRENT_BINARY_DIR}/tower_backend_native_targets.tower")
get_target_property(source_backend_objects tower-backend-native INTERFACE_SOURCES)
list(REMOVE_ITEM source_backend_objects "${CMAKE_CURRENT_BINARY_DIR}/tower-backend-native.o")
set(source_libraries ${test_libraries})
list(REMOVE_ITEM source_libraries tower-backend-native)
get_target_property(source_backend_libraries tower-backend-native INTERFACE_LINK_LIBRARIES)
add_executable(tower-backend-source-tests ${test_sources} ${source_backend_objects} "${tower-backend-source_OBJECT}")
set_target_properties(tower-backend-source-tests PROPERTIES LINKER_LANGUAGE CXX)
target_link_libraries(tower-backend-source-tests PRIVATE ${source_libraries} ${source_backend_libraries})
# This service unit has no native compilation-unit scheduler entry point.
target_link_options(tower-backend-source-tests PRIVATE -Wl,--export-dynamic-symbol=backend_register_targets)
add_dependencies(tower-backend-source-tests tower-guest-wasm32)
set(source_workdir "${CMAKE_CURRENT_BINARY_DIR}/tower-backend-source-checks")
file(MAKE_DIRECTORY "${source_workdir}")
# Mirror the existing browser module-input mount's lexical path.
file(CREATE_LINK "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" "${source_workdir}/.tower" SYMBOLIC)
enable_testing()
add_test(NAME tower-backend-source-worlds COMMAND tower-backend-source-tests
  "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
  "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower" "${source_runtime}")
set_tests_properties(tower-backend-source-worlds PROPERTIES WORKING_DIRECTORY "${source_workdir}"
  TIMEOUT 180 LABELS "native;backend;focused")
add_test(NAME tower-backend-source-recheck COMMAND tower-backend-source-tests
  "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
  "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower" "${source_runtime}"
  "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/struct_reconstruction_small.tower"
  "${source_workdir}/denied_recheck.tower" 4 1 deny-recheck)
set_tests_properties(tower-backend-source-recheck PROPERTIES WORKING_DIRECTORY "${source_workdir}"
  TIMEOUT 180 LABELS "native;backend;focused")

foreach(pointer_bytes IN ITEMS 4 8)
  foreach(workers IN ITEMS 1 4)
    set(pointer_test "tower-backend-pointer-order-${pointer_bytes}-${workers}")
    add_test(NAME "${pointer_test}" COMMAND tower-backend-source-tests
      "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower" "${source_runtime}"
      "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/backend_pointer_order.tower"
      "${source_workdir}/pointer_order_${pointer_bytes}_${workers}.tower" "${pointer_bytes}" "${workers}" optimized)
    set_tests_properties("${pointer_test}" PROPERTIES WORKING_DIRECTORY "${source_workdir}"
      TIMEOUT 180 LABELS "native;backend;focused")
  endforeach()
endforeach()

foreach(width IN ITEMS 4 8)
  foreach(workers IN ITEMS 1 4)
    set(constant_test "tower-backend-constant-address-${width}-${workers}")
    set(constant_workdir "${source_workdir}/constant_address_${width}_${workers}")
    file(MAKE_DIRECTORY "${constant_workdir}")
    file(CREATE_LINK "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" "${constant_workdir}/.tower" SYMBOLIC)
    add_test(NAME "${constant_test}" COMMAND tower-backend-source-tests
      "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower" "${source_runtime}"
      "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/backend_constant_address.tower"
      "${constant_workdir}/constant_address_${width}_${workers}.tower" "${width}" "${workers}" constant-address)
    set_tests_properties("${constant_test}" PROPERTIES WORKING_DIRECTORY "${constant_workdir}"
      FIXTURES_SETUP "${constant_test}" TIMEOUT 90 LABELS "native;backend;focused")
  endforeach()
  add_test(NAME "tower-backend-constant-address-equal-${width}" COMMAND tower-backend-source-tests --constant-address-equal
    "${source_workdir}/constant_address_${width}_1/constant_address_${width}_1.tower"
    "${source_workdir}/constant_address_${width}_4/constant_address_${width}_4.tower")
  set_tests_properties("tower-backend-constant-address-equal-${width}" PROPERTIES
    FIXTURES_REQUIRED "tower-backend-constant-address-${width}-1;tower-backend-constant-address-${width}-4"
    TIMEOUT 90 LABELS "native;backend;focused")
endforeach()

# Use the same native world, LLVM and worker transport for selected Tower cases.
if(NOT CMAKE_CROSSCOMPILING AND NOT TOWER_SANITIZER AND triple MATCHES "^x86_64-.*linux.*gnu")
  tower_guest_runtime(native-test "${triple}" posix ON UNINSTRUMENTED)
  tower_selected_test_count("${triple}")
  get_property(constant_guest GLOBAL PROPERTY TOWER_GUEST_native-test_OBJECT)
  add_library(tower-backend-source-services SHARED ${test_sources} ${source_backend_objects} "${tower-backend-source_OBJECT}")
  set_target_properties(tower-backend-source-services PROPERTIES LINKER_LANGUAGE CXX)
  target_link_libraries(tower-backend-source-services PRIVATE ${source_libraries} ${source_backend_libraries})
  target_link_options(tower-backend-source-services PRIVATE "LINKER:-z,defs")
  add_dependencies(tower-backend-source-tests tower-backend-source-services tower-selected-test-count tower-guest-native-test)
  foreach(entry IN ITEMS backend_constant_address backend_constant_address_test backend_source_native_test)
    set(path "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/${entry}.tower")
    set(dir "${source_workdir}/${entry}")
    file(MAKE_DIRECTORY "${dir}")
    file(CREATE_LINK "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" "${dir}/.tower" SYMBOLIC)
    set(name "tower-selected-${entry}")
    set(count 6)
    set(llvm_link)
    if(entry STREQUAL "backend_source_native_test")
      set(count 8)
      set(llvm_link --link "$<TARGET_FILE:LLVM>")
    endif()
    add_test(NAME "${name}" COMMAND tower-selected-test-count "${count} tests passed for ${path}"
      "${TOWER_BOOTSTRAP_COMPILER}" --test "${path}" --jobs 1 --test-details
      --test-native-runtime "${constant_guest}" --link "$<TARGET_FILE:tower-backend-source-services>"
      ${llvm_link} --link "-Wl,-rpath,$<TARGET_FILE_DIR:tower-backend-source-services>")
    set_tests_properties("${name}" PROPERTIES WORKING_DIRECTORY "${dir}" TIMEOUT 90 LABELS "native;backend;focused"
      ENVIRONMENT "TOWER_CONSTANT_ADDRESS_RUNTIME=${source_runtime}")
  endforeach()
endif()

# Same session provider with the existing single-owner allocation-denial seam.
get_property(response_runtime GLOBAL PROPERTY TOWER_RUNTIME_INSTRUMENTED_OBJECT)
set(response_platform "${CMAKE_CURRENT_BINARY_DIR}/tower_backend_response_platform.tower")
file(GENERATE OUTPUT "${response_platform}" CONTENT
  "import tower;\nimport backend.file_posix;\nimport tower_backend_native_targets;\nimport backend.target_once_linux;\nimport backend.linker_wasi_wasm;\nimport tests.backend_clock_native;\n")
tower_runtime_object(tower-response-platform "${response_platform}" "${triple}")
set(response_platform_output "${tower-response-platform_OBJECT}")
if(TOWER_SANITIZER)
  set(response_platform_output "${tower-response-platform_PRIMARY_OUTPUT}")
endif()
add_custom_command(OUTPUT "${response_platform_output}" APPEND
  DEPENDS "${CMAKE_CURRENT_BINARY_DIR}/tower_backend_native_targets.tower")
set(response_objects ${test_sources} ${source_backend_objects} "${tower-response-platform_OBJECT}")
tower_runtime_object(tower-backend-response "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/backend_response_native.tower" "${triple}")
add_executable(tower-backend-response-tests ${response_objects} "${tower-backend-response_OBJECT}" "${response_runtime}")
set_target_properties(tower-backend-response-tests PROPERTIES LINKER_LANGUAGE CXX)
target_link_libraries(tower-backend-response-tests PRIVATE ${source_libraries} ${source_backend_libraries})
target_link_options(tower-backend-response-tests PRIVATE -Wl,--export-dynamic-symbol=backend_register_targets)
add_test(NAME tower-backend-response COMMAND tower-backend-response-tests)
set_tests_properties(tower-backend-response PROPERTIES TIMEOUT 30 LABELS "native;backend;focused;storage")

if(NOT CMAKE_CROSSCOMPILING AND NOT TOWER_SANITIZER AND triple MATCHES "^x86_64-.*linux.*gnu")
  # The guest compiles session.tower itself. Supply the native compiler services,
  # platform bindings and allocator used by the standalone executable.
  tower_guest_runtime(native-test "${triple}" posix ON UNINSTRUMENTED)
  tower_guest_runtime(host-library "${triple}" posix OFF UNINSTRUMENTED)
  tower_selected_test_count("${triple}")
  get_property(response_guest GLOBAL PROPERTY TOWER_GUEST_native-test_OBJECT)
  add_library(tower-response-services SHARED ${response_objects} "${response_runtime}")
  set_target_properties(tower-response-services PROPERTIES LINKER_LANGUAGE CXX)
  target_link_libraries(tower-response-services PRIVATE tower-compiler-work-serial ${source_libraries} ${source_backend_libraries})
  target_link_options(tower-response-services PRIVATE "LINKER:-z,defs")
  add_dependencies(tower-backend-response-tests tower-response-services tower-selected-test-count tower-guest-native-test)
  # Default owner discovery also collects nine float_bits and five work_budget cases.
  tower_native_test_selections(backend-response backend_response_checks "16 tests" "2 tests"
    --test-native-runtime "${response_guest}" --link "$<TARGET_FILE:tower-response-services>"
    --link "$<TARGET_FILE:LLVM>" --link "-Wl,-rpath,$<TARGET_FILE_DIR:tower-response-services>"
    --link "-Wl,-rpath,$<TARGET_FILE_DIR:LLVM>")
endif()
