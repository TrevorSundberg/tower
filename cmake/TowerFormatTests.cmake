# Focused Tower formatter fixtures with independently verified exact text/spans.
# The repository sweep remains separately opt-in.
option(TOWER_FORMAT_TESTS "Build focused Tower formatter tests" OFF)
option(TOWER_FORMAT_SWEEP "Run the broad repository formatter sweep" OFF)
if(TOWER_FORMAT_TESTS)
  enable_testing()
endif()
function(tower_format_tests)
  if(NOT TOWER_FORMAT_TESTS OR NOT TARGET towerc)
    return()
  endif()
  get_property(triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
  if(NOT triple MATCHES "^x86_64-.*linux")
    message(FATAL_ERROR "Revalidate the formatter test syntax ABI for ${triple}")
  endif()
  get_property(source GLOBAL PROPERTY TOWER_DRIVER_PRODUCTION_SOURCE)
  tower_runtime_object(format-instrumented "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/host/memory_instrumented.tower" "${triple}"
    compiler_runtime_allocate tower_allocate compiler_runtime_reallocate tower_reallocate
    compiler_runtime_deallocate tower_deallocate --state compiler-tests)
  set(input "${CMAKE_CURRENT_BINARY_DIR}/tower_format_tests.tower")
  file(GENERATE OUTPUT "${input}" CONTENT "${source}import tests.format_main;\n")
  tower_runtime_object(tower-format-tests "${input}" "${triple}")
  get_target_property(sources towerc SOURCES)
  list(REMOVE_ITEM sources "${CMAKE_CURRENT_BINARY_DIR}/tower-driver.o")
  get_target_property(libraries towerc LINK_LIBRARIES)
  add_executable(tower-format-tests ${sources} "${tower-format-tests_OBJECT}" "${format-instrumented_OBJECT}")
  set_target_properties(tower-format-tests PROPERTIES LINKER_LANGUAGE CXX)
  target_compile_options(tower-format-tests PRIVATE -fno-exceptions)
  target_link_libraries(tower-format-tests PRIVATE ${libraries})
  add_test(NAME tower-format COMMAND tower-format-tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding")
  set_tests_properties(tower-format PROPERTIES WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding")
  if(TARGET tower-guest-native-test)
    # The selected owner already defines part of the parser object. Put its
    # providers in a shared library so the guest can link its own owner.
    add_library(tower-format-test-services SHARED EXCLUDE_FROM_ALL)
    set_target_properties(tower-format-test-services PROPERTIES LINKER_LANGUAGE C)
    tower_compiler_evaluation()
    target_link_libraries(tower-format-test-services PRIVATE tower-compiler-parser-nodes tower-compiler-semantics
      tower-compiler-entities tower-compiler-utilities tower-compiler-memory tower-compiler-evaluation)
    target_link_options(tower-format-test-services PRIVATE "LINKER:-z,defs")
    tower_runtime_object(format-test-host
      "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/syntax_session_format_inputs/native.tower" "${triple}")
    tower_selected_test_count("${triple}")
    add_custom_target(tower-format-owner-tests ALL DEPENDS tower-format-test-services tower-selected-test-count
      tower-guest-native-test "${format-test-host_OBJECT}")
    get_property(test_runtime GLOBAL PROPERTY TOWER_GUEST_native-test_OBJECT)
    set(owner "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/syntax_session_format.tower")
    add_test(NAME tower-format-owner COMMAND tower-selected-test-count "5 tests passed for ${owner}" "${TOWER_BOOTSTRAP_COMPILER}"
      --test "${owner}" --test-suffix _cases_test.tower --jobs 1 --test-details
      --test-native-runtime "${test_runtime}" --link "${format-test-host_OBJECT}"
      --link "$<TARGET_FILE:tower-format-test-services>" --link "-Wl,-rpath,$<TARGET_FILE_DIR:tower-format-test-services>")
    set_tests_properties(tower-format-owner PROPERTIES WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding")
  endif()
  if(TOWER_FORMAT_SWEEP)
    file(GLOB_RECURSE format_files CONFIGURE_DEPENDS "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/*.tower")
    # These byte-exact subjects exercise noncanonical spelling, a partial
    # increment program and a lexical refusal in the owner test.
    list(FILTER format_files EXCLUDE REGEX "/syntax_session_format_inputs/(declarations|comments|refusal|literal|increment_suffix|affixes)[.]tower$")
    # These raw parser subjects are compared at their original byte offsets.
    list(FILTER format_files EXCLUDE REGEX "/bedrock_cases/inputs/(assignment|atom|inherited|inherited_refusal|local_override|quoted|quoted_capture|redefine|repeat|shared_lexicon|suffix|wrong_capture)[.]tower$")
    list(SORT format_files)
    string(REPLACE ";" "\n" format_listing "${format_files}")
    set(format_manifest "${CMAKE_CURRENT_BINARY_DIR}/tower_format_files.txt")
    file(GENERATE OUTPUT "${format_manifest}" CONTENT "${format_listing}\n")
    add_test(NAME tower-format-repository COMMAND tower-format-tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" "${format_manifest}")
  endif()
endfunction()
cmake_language(DEFER CALL tower_format_tests)
