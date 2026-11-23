# Reuse the browser's Tower source/session assertions with native LLVM. Only the
# file/clock transport differs; no browser/vendor rebuild or second test model.
if(NOT TOWER_NATIVE OR NOT triple MATCHES "linux")
  return()
endif()
tower_guest_runtime(wasm32 wasm32-unknown-unknown wasm OFF UNINSTRUMENTED)
get_property(source_runtime GLOBAL PROPERTY TOWER_GUEST_wasm32_OBJECT)
set(source_input "${CMAKE_CURRENT_BINARY_DIR}/tower_backend_source_tests.tower")
file(GENERATE OUTPUT "${source_input}" CONTENT
  "import tower;\nimport compiler.units.backend_core;\nimport backend.file_posix;\nimport tower_backend_native_targets;\nimport backend.target_once_linux;\nimport backend.linker_wasi_wasm;\nimport tests.backend_source_native;\n")
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
