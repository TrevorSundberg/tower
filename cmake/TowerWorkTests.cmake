option(TOWER_WORK_TESTS "Build the Tower native worker overlap/ownership fixture" OFF)
if(TOWER_WORK_TESTS AND TOWER_NATIVE AND CMAKE_SYSTEM_NAME STREQUAL "Linux")
  get_property(work_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
  tower_guest_runtime(work-tests "${work_triple}" posix OFF)
  get_property(work_runtime GLOBAL PROPERTY TOWER_GUEST_work-tests_OBJECT)
  set(work_objects)
  foreach(unit IN ITEMS tests/work_pool host/work_linux host/work_dispatch)
    string(REPLACE "/" "_" work_name "${unit}")
    set(work_object "${CMAKE_CURRENT_BINARY_DIR}/${work_name}.o")
    add_custom_command(OUTPUT "${work_object}"
      COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/${unit}.tower"
        --library --target "${work_triple}"
        --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
        --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
        -o "${work_object}" --depfile "${work_object}.d"
      DEPFILE "${work_object}.d"
      DEPENDS "${TOWER_BOOTSTRAP_COMPILER}" "scaffolding/${unit}.tower" VERBATIM)
    set_source_files_properties("${work_object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
    list(APPEND work_objects "${work_object}")
  endforeach()
  add_executable(tower-work-tests ${work_objects} "${work_runtime}")
  set_target_properties(tower-work-tests PROPERTIES LINKER_LANGUAGE C)
  find_package(Threads REQUIRED)
  target_link_libraries(tower-work-tests PRIVATE Threads::Threads ${CMAKE_DL_LIBS})
  target_link_options(tower-work-tests PRIVATE -Wl,--export-dynamic-symbol=work_thread_entry)
  enable_testing()
  add_test(NAME tower-worker-overlap COMMAND tower-work-tests)
  set_tests_properties(tower-worker-overlap PROPERTIES TIMEOUT 30 SKIP_RETURN_CODE 77)
  include("${CMAKE_CURRENT_LIST_DIR}/TowerWorkPolicyTests.cmake")
endif()

if(TOWER_WORK_TESTS AND TOWER_BROWSER_THREADS)
  set(work_input "${CMAKE_CURRENT_BINARY_DIR}/tower_work_tests.tower")
  file(GENERATE OUTPUT "${work_input}" CONTENT
    "import tower;\nimport tests.work_pool;\nimport host.work_wasi;\nimport host.work_memory_wasi;\nimport host.work_dispatch;\nimport host.memory;\n")
  set(work_object "${CMAKE_CURRENT_BINARY_DIR}/tower-work-tests.o")
  add_custom_command(OUTPUT "${work_object}"
    COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${work_input}" --library
      --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
      --target wasm32-unknown-unknown -o "${work_object}" --depfile "${work_object}.d"
    DEPFILE "${work_object}.d"
    DEPENDS "${TOWER_BOOTSTRAP_COMPILER}" "${work_input}" VERBATIM)
  set_source_files_properties("${work_object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
  add_executable(tower-work-tests "${work_object}"
    "${CMAKE_CURRENT_BINARY_DIR}/runtime-allocate.o" "${CMAKE_CURRENT_BINARY_DIR}/runtime-trap.o")
  set_target_properties(tower-work-tests PROPERTIES LINKER_LANGUAGE C SUFFIX .wasm)
  target_link_options(tower-work-tests PRIVATE -mexec-model=reactor
    -Wl,--export=work_thread_entry -Wl,--export-table -Wl,--growable-table
    -Wl,--initial-memory=8388608 -Wl,--max-memory=2147483648
    "-Wl,--allow-undefined-file=${CMAKE_CURRENT_SOURCE_DIR}/cmake/WorkImports.txt")
endif()
