# Focused storage/lifetime coverage using production compiler services. Functional
# assertions and the entry are Tower; native files are existing service adapters.
option(TOWER_STORAGE_TESTS "Build Tower compiler storage tests" OFF)
if(TOWER_STORAGE_TESTS)
  enable_testing()
endif()
function(tower_storage_tests)
  if(NOT TOWER_STORAGE_TESTS OR NOT TARGET towerc)
    return()
  endif()
  get_property(triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
  get_property(source GLOBAL PROPERTY TOWER_DRIVER_PRODUCTION_SOURCE)
  get_property(runtime_instrumented GLOBAL PROPERTY TOWER_RUNTIME_INSTRUMENTED_OBJECT)
  if(NOT runtime_instrumented)
    tower_runtime_object(storage-instrumented "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/host/memory_instrumented.tower" "${triple}"
      compiler_runtime_allocate tower_allocate compiler_runtime_reallocate tower_reallocate
      compiler_runtime_deallocate tower_deallocate --state compiler-tests)
    set(runtime_instrumented "${storage-instrumented_OBJECT}")
  endif()
  set(input "${CMAKE_CURRENT_BINARY_DIR}/tower_storage_tests.tower")
  file(GENERATE OUTPUT "${input}" CONTENT "${source}import tests.storage_main;\n")
  tower_runtime_object(tower-storage-tests "${input}" "${triple}")
  get_target_property(sources towerc SOURCES)
  list(REMOVE_ITEM sources "${CMAKE_CURRENT_BINARY_DIR}/tower-driver.o")
  get_target_property(libraries towerc LINK_LIBRARIES)
  add_executable(tower-storage-tests ${sources} "${tower-storage-tests_OBJECT}" "${runtime_instrumented}")
  tower_runtime_object(tower-syntax-resource-cases "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/syntax_resource_checks.tower" "${triple}")
  target_sources(tower-storage-tests PRIVATE "${tower-syntax-resource-cases_OBJECT}")
  set_target_properties(tower-storage-tests PROPERTIES LINKER_LANGUAGE CXX)
  target_compile_options(tower-storage-tests PRIVATE -fno-exceptions)
  target_link_libraries(tower-storage-tests PRIVATE ${libraries})
  if(NOT CMAKE_CROSSCOMPILING AND NOT TOWER_SANITIZER AND triple MATCHES "^x86_64-.*linux.*gnu")
    # The native guest provides its own entry. The single-owner allocator must
    # resolve against the portable work transport, as it does in tower-storage.
    tower_guest_runtime(native-test "${triple}" posix ON UNINSTRUMENTED)
    tower_guest_runtime(host-library "${triple}" posix OFF UNINSTRUMENTED)
    tower_selected_test_count("${triple}")
    tower_compiler_evaluation()
    get_property(guest GLOBAL PROPERTY TOWER_GUEST_native-test_OBJECT)
    add_library(tower-storage-services SHARED "${runtime_instrumented}")
    set_target_properties(tower-storage-services PROPERTIES LINKER_LANGUAGE CXX TOWER_SERIAL_WORK_TRANSPORT TRUE)
    target_link_libraries(tower-storage-services PRIVATE tower-compiler-work-serial tower-compiler-parser-nodes
      tower-compiler-semantics tower-compiler-entities tower-compiler-utilities tower-compiler-evaluation tower-compiler-memory)
    target_link_options(tower-storage-services PRIVATE "LINKER:-z,defs")
    add_dependencies(tower-storage-tests tower-storage-services tower-selected-test-count tower-guest-native-test)
    tower_native_test_selections(generic-clone-fixture generic_clone_fixture "2 tests" "1 test"
      --test-native-runtime "${guest}" --link "$<TARGET_FILE:tower-storage-services>"
      --link "-Wl,-rpath,$<TARGET_FILE_DIR:tower-storage-services>")
    tower_native_test_selections(generic-result-storage generic_result_storage "18 tests" "1 test"
      --test-native-runtime "${guest}" --link "$<TARGET_FILE:tower-storage-services>"
      --link "-Wl,-rpath,$<TARGET_FILE_DIR:tower-storage-services>")
    if(TOWER_BACKEND_TESTS AND TARGET tower-backend-native)
      target_link_libraries(tower-storage-services PRIVATE tower-backend-native LLVM)
      # Owner discovery also selects the budget, clone and body-copy declarations.
      tower_native_test_selections(backend-import-bytes backend_import_bytes "10 tests" "3 tests"
        --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
        --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
        --test-native-runtime "${guest}" --link "$<TARGET_FILE:tower-storage-services>"
        --link "-Wl,-rpath,$<TARGET_FILE_DIR:tower-storage-services>")
      foreach(selection IN ITEMS owner direct)
        foreach(jobs IN ITEMS 1 4)
          set(dir "${CMAKE_CURRENT_BINARY_DIR}/backend-import-bytes-${selection}-${jobs}")
          file(MAKE_DIRECTORY "${dir}")
          file(CREATE_LINK "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" "${dir}/.tower" SYMBOLIC)
          set_tests_properties(tower-backend-import-bytes-${selection}-jobs-${jobs} PROPERTIES
            WORKING_DIRECTORY "${dir}" LABELS "native;backend;focused;storage")
        endforeach()
      endforeach()
    endif()
  endif()
  foreach(mode IN ITEMS syntax-reset-resources syntax-expansion-resources syntax-expansion-success syntax-session-old)
    add_test(NAME tower-${mode} COMMAND tower-storage-tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" ${mode})
    set_tests_properties(tower-${mode} PROPERTIES TIMEOUT 30 LABELS "native;focused;storage")
  endforeach()
  add_test(NAME tower-storage COMMAND tower-storage-tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding")
  add_test(NAME tower-storage-scratch-boundaries COMMAND tower-storage-tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" scratch-boundaries)
  add_test(NAME tower-storage-capture-scan COMMAND tower-storage-tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" capture-scan)
  set_tests_properties(tower-storage-capture-scan PROPERTIES TIMEOUT 30 LABELS "native;focused;storage")
  set_tests_properties(tower-storage-scratch-boundaries PROPERTIES TIMEOUT 30 LABELS "native;focused;storage")
  add_test(NAME tower-generic-quota-causes COMMAND tower-storage-tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" generic-quota)
  set_tests_properties(tower-generic-quota-causes PROPERTIES TIMEOUT 30 LABELS "native;focused;generic")
  add_test(NAME tower-storage-backend-import COMMAND tower-storage-tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" backend-import)
  set_tests_properties(tower-storage-backend-import PROPERTIES TIMEOUT 120 LABELS "native;focused;storage")
  foreach(mode IN ITEMS backend-import-bytes backend-import-bytes-wrong-byte backend-import-bytes-wrong-guard)
    add_test(NAME tower-storage-${mode} COMMAND tower-storage-tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" ${mode})
    set_tests_properties(tower-storage-${mode} PROPERTIES TIMEOUT 60 LABELS "native;backend;focused;storage")
  endforeach()
  set_tests_properties(tower-storage-backend-import-bytes-wrong-byte tower-storage-backend-import-bytes-wrong-guard
    PROPERTIES WILL_FAIL TRUE)
  set_tests_properties(tower-storage PROPERTIES WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding")
  if(TOWER_BACKEND_TESTS AND triple MATCHES "^x86_64-.*linux")
    # Graph and Fast both use the native driver's execution-session callbacks.
    # Keep this ABI and its single-owner allocator in the same provider for both entries.
    set(overflow_host "${CMAKE_CURRENT_BINARY_DIR}/tower_overflow_host.tower")
    file(GENERATE OUTPUT "${overflow_host}" CONTENT "${source}import host.driver_execution;\nimport tests.backend_import_overflow_execution_test;\n")
    tower_runtime_object(tower-overflow-host "${overflow_host}" "${triple}")
    add_library(tower-overflow-native-services SHARED ${sources} "${tower-overflow-host_OBJECT}" "${runtime_instrumented}")
    set_target_properties(tower-overflow-native-services PROPERTIES LINKER_LANGUAGE CXX TOWER_SERIAL_WORK_TRANSPORT TRUE)
    target_link_libraries(tower-overflow-native-services PRIVATE tower-compiler-work-serial ${libraries})
    if(NOT TOWER_SANITIZER)
      target_link_options(tower-overflow-native-services PRIVATE "LINKER:-z,defs")
    endif()
    tower_runtime_object(tower-overflow-native "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/backend_overflow_native_main.tower" "${triple}")
    add_executable(tower-overflow-native-tests "${tower-overflow-native_OBJECT}")
    set_target_properties(tower-overflow-native-tests PROPERTIES LINKER_LANGUAGE CXX)
    add_dependencies(tower-overflow-native-tests tower-runtime-resource-host-linux-x64)
    if(TOWER_SANITIZER)
      target_link_libraries(tower-overflow-native-tests PRIVATE tower-overflow-native-services)
    else()
      # The Tower ELF linker accepts full input paths. CMake's library search
      # flags depend on whether the shared object already exists at configure time.
      add_dependencies(tower-overflow-native-tests tower-overflow-native-services)
      set_property(TARGET tower-overflow-native-tests APPEND PROPERTY LINK_DEPENDS "$<TARGET_FILE:tower-overflow-native-services>")
      target_link_options(tower-overflow-native-tests PRIVATE "$<TARGET_FILE:tower-overflow-native-services>"
        "-Wl,-rpath,$<TARGET_FILE_DIR:tower-overflow-native-services>")
    endif()
    foreach(mode IN ITEMS correct wrong)
      file(MAKE_DIRECTORY "${CMAKE_CURRENT_BINARY_DIR}/overflow-native-${mode}")
      add_test(NAME tower-overflow-native-${mode} COMMAND tower-overflow-native-tests
        "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" "${TOWER_BACKEND_HOST_CC}"
        "${CMAKE_CURRENT_BINARY_DIR}/share/tower" "${mode}")
      set_tests_properties(tower-overflow-native-${mode} PROPERTIES TIMEOUT 120 LABELS "native;backend;focused"
        WORKING_DIRECTORY "${CMAKE_CURRENT_BINARY_DIR}/overflow-native-${mode}")
    endforeach()
    set_tests_properties(tower-overflow-native-wrong PROPERTIES WILL_FAIL TRUE)
    if(NOT CMAKE_CROSSCOMPILING AND NOT TOWER_SANITIZER AND triple MATCHES "^x86_64-.*linux.*gnu")
      add_dependencies(tower-storage-tests tower-overflow-native-services)
      tower_native_test_selections(backend-import-overflow backend_import_overflow "9 tests" "2 tests"
        --test-native-runtime "${guest}" --link "$<TARGET_FILE:tower-overflow-native-services>"
        --link "-Wl,-rpath,$<TARGET_FILE_DIR:tower-overflow-native-services>")
      foreach(selection IN ITEMS owner direct)
        foreach(jobs IN ITEMS 1 4)
          set(dir "${CMAKE_CURRENT_BINARY_DIR}/backend-import-overflow-${selection}-${jobs}")
          file(MAKE_DIRECTORY "${dir}")
          file(CREATE_LINK "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" "${dir}/.tower" SYMBOLIC)
          set_tests_properties(tower-backend-import-overflow-${selection}-jobs-${jobs} PROPERTIES
            WORKING_DIRECTORY "${dir}" LABELS "native;backend;focused;storage" TIMEOUT 120)
        endforeach()
      endforeach()
      add_dependencies(tower-overflow-native-tests tower-selected-test-count tower-guest-native-test)
      # Owner discovery includes the budget, clone and body-copy declarations.
      tower_native_test_selections(overflow-native backend_overflow_native "9 tests" "2 tests"
        --test-native-runtime "${guest}" --link "$<TARGET_FILE:tower-overflow-native-services>"
        --link "-Wl,-rpath,$<TARGET_FILE_DIR:tower-overflow-native-services>")
      foreach(selection IN ITEMS owner direct)
        foreach(jobs IN ITEMS 1 4)
          set(dir "${CMAKE_CURRENT_BINARY_DIR}/overflow-native-${selection}-${jobs}")
          file(MAKE_DIRECTORY "${dir}")
          set_tests_properties(tower-overflow-native-${selection}-jobs-${jobs} PROPERTIES
            WORKING_DIRECTORY "${dir}" LABELS "native;backend;focused" TIMEOUT 120
            ENVIRONMENT "TOWER_OVERFLOW_CLANG=${TOWER_BACKEND_HOST_CC};TOWER_OVERFLOW_RUNTIME=${CMAKE_CURRENT_BINARY_DIR}/share/tower")
        endforeach()
      endforeach()
    endif()
  endif()
endfunction()
cmake_language(DEFER CALL tower_storage_tests)
