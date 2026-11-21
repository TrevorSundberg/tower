# The parser aggregate needs storage fault-injection checks, not an execution
# host. Keep those Tower tests independent of the full interpreter object.
get_property(storage_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
set(storage_test_object "${CMAKE_CURRENT_BINARY_DIR}/tower-interpreter-storage-tests.o")
add_custom_command(OUTPUT "${storage_test_object}"
  COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/interpreter_storage.tower"
    --library --target "${storage_triple}"
    --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
    --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
    -o "${storage_test_object}" --depfile "${storage_test_object}.d"
  DEPFILE "${storage_test_object}.d"
  DEPENDS scaffolding/tests/interpreter_storage.tower "${TOWER_BOOTSTRAP_COMPILER}" VERBATIM)
set_source_files_properties("${storage_test_object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
add_library(tower-interpreter-storage-tests INTERFACE)
target_sources(tower-interpreter-storage-tests INTERFACE "${storage_test_object}")
