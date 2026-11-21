# Tower CLI integration with explicit target libc bindings.
option(TOWER_DRIVER_TESTS "Build Tower CLI policy and process tests" OFF)
option(TOWER_C_OUTPUT_TESTS "Register C-output tests (requires Clang/GCC and 32-bit hosted libraries)" OFF)
if(TOWER_C_OUTPUT_TESTS AND NOT TOWER_DRIVER_TESTS)
  message(FATAL_ERROR "TOWER_C_OUTPUT_TESTS requires TOWER_DRIVER_TESTS")
endif()
if(TOWER_DRIVER_TESTS)
  enable_testing()
endif()
function(tower_driver_integrate)
  if(NOT TARGET towerc)
    return()
  endif()
  get_property(triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
  tower_guest_native_resources("${triple}")
  if(NOT triple MATCHES "^(x86_64|aarch64|arm64)-")
    message(FATAL_ERROR "Revalidate the driver libc ABI for this host target: ${triple}")
  endif()
  set(platform posix)
  set(profile linux)
  set(syntax_abi libstdcxx)
  set(stat_profile linux_x64)
  if(triple MATCHES "^(aarch64|arm64)-")
    set(stat_profile linux_arm64)
  endif()
  if(triple MATCHES "windows")
    set(platform windows)
    set(profile windows_arguments)
    set(syntax_abi msvc)
  elseif(triple MATCHES "darwin|apple")
    set(profile macos)
    set(stat_profile macos)
    set(syntax_abi libcxx)
  endif()
  set(input "${CMAKE_CURRENT_BINARY_DIR}/tower_driver.tower")
  set(object "${CMAKE_CURRENT_BINARY_DIR}/tower-driver.o")
  file(GLOB sources CONFIGURE_DEPENDS "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/host/driver_*.tower")
  set(source "import tower;\n")
  foreach(name IN ITEMS support timing windows_arguments ${platform} ${profile} link prepare)
    set(path "host.driver_${name}")
    string(APPEND source "import ${path};\n")
  endforeach()
  set_property(GLOBAL PROPERTY TOWER_DRIVER_SOURCE "${source}")
  set(production_source "${source}import host.driver_paths_${platform};\n")
  if(platform STREQUAL "posix")
    string(APPEND production_source "import host.driver_stat_${stat_profile};\n")
  endif()
  file(GENERATE OUTPUT "${input}" CONTENT "${production_source}import host.driver_entry;\n")
  set_property(GLOBAL PROPERTY TOWER_DRIVER_PRODUCTION_SOURCE "${production_source}")
  set_property(GLOBAL PROPERTY TOWER_DRIVER_SYNTAX_ABI "${syntax_abi}")
  include("${CMAKE_CURRENT_FUNCTION_LIST_DIR}/TowerExecutionTests.cmake")
  cmake_language(DEFER CALL tower_execution_tests)
  get_property(runtime_bind GLOBAL PROPERTY TOWER_RUNTIME_BIND)
  set(ir "${CMAKE_CURRENT_BINARY_DIR}/tower-driver-unbound.ll")
  set(bound "${CMAKE_CURRENT_BINARY_DIR}/tower-driver.ll")
  add_custom_command(OUTPUT "${ir}" "${bound}" "${object}"
    COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${input}" --library --target "${triple}"
      --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
      --emit llvm-optimized -o "${ir}" --depfile "${object}.d"
    COMMAND "${runtime_bind}" "${ir}" "${bound}" --driver "${syntax_abi}"
    COMMAND "${CMAKE_C_COMPILER}" --target=${triple} -O2 -c "${bound}" -o "${object}"
    DEPFILE "${object}.d"
    DEPENDS "${input}" ${sources} "${TOWER_BOOTSTRAP_COMPILER}" "${runtime_bind}" tower-runtime-bind VERBATIM)
  set_source_files_properties("${object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
  target_sources(towerc PRIVATE "${object}")
  if(TOWER_DRIVER_TESTS)
    # Keep fixtures out of the production object and use the Tower guest runtime.
    string(APPEND source "import tests.driver_${platform};\n")
    string(APPEND source "import tests.driver;\n")
    set(test_input "${CMAKE_CURRENT_BINARY_DIR}/tower_driver_tests.tower")
    file(GENERATE OUTPUT "${test_input}" CONTENT "${source}")
    set(test_objects "")
    foreach(unit IN ITEMS tests standalone)
      set(unit_input "${test_input}")
      if(unit STREQUAL "standalone")
        set(unit_input "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/driver_standalone.tower")
      endif()
      set(unit_object "${CMAKE_CURRENT_BINARY_DIR}/tower-driver-${unit}.o")
      add_custom_command(OUTPUT "${unit_object}"
        COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${unit_input}" --library --target "${triple}"
          --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
          --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
          -o "${unit_object}" --depfile "${unit_object}.d"
        DEPFILE "${unit_object}.d"
        DEPENDS "${unit_input}" ${sources} scaffolding/tests/driver.tower
          scaffolding/tests/driver_${platform}.tower scaffolding/tests/driver_main.tower
          "${TOWER_BOOTSTRAP_COMPILER}" VERBATIM)
      set_source_files_properties("${unit_object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
      list(APPEND test_objects "${unit_object}")
    endforeach()
    get_property(guest_runtime GLOBAL PROPERTY TOWER_GUEST_host-library_OBJECT)
    add_executable(tower-driver-tests "${guest_runtime}" ${test_objects}
      "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-bytes.o")
    set_target_properties(tower-driver-tests PROPERTIES LINKER_LANGUAGE C)
    file(MAKE_DIRECTORY "${CMAKE_CURRENT_BINARY_DIR}/tower-driver-checks")
    get_property(runtime_bind GLOBAL PROPERTY TOWER_RUNTIME_BIND)
    set(runtime_test "")
    if(TARGET tower-runtime-abi-tests)
      set(runtime_test "$<TARGET_FILE:tower-runtime-abi-tests>")
    endif()
    add_test(NAME tower-driver COMMAND tower-driver-tests "$<TARGET_FILE:towerc>" "${runtime_bind}" ${runtime_test})
    set_tests_properties(tower-driver PROPERTIES WORKING_DIRECTORY "${CMAKE_CURRENT_BINARY_DIR}/tower-driver-checks")
    file(MAKE_DIRECTORY "${CMAKE_CURRENT_BINARY_DIR}/tower-module-path-checks")
    add_test(NAME tower-driver-module-paths COMMAND tower-driver-tests --module-paths
      "$<TARGET_FILE:towerc>" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding")
    set_tests_properties(tower-driver-module-paths PROPERTIES
      WORKING_DIRECTORY "${CMAKE_CURRENT_BINARY_DIR}/tower-module-path-checks")
    foreach(check IN ITEMS native package)
      file(MAKE_DIRECTORY "${CMAKE_CURRENT_BINARY_DIR}/tower-${check}-differential-checks")
      add_test(NAME tower-driver-${check}-differential COMMAND tower-driver-tests --${check}-differential
        "$<TARGET_FILE:towerc>" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding")
      set_tests_properties(tower-driver-${check}-differential PROPERTIES TIMEOUT 1200
        WORKING_DIRECTORY "${CMAKE_CURRENT_BINARY_DIR}/tower-${check}-differential-checks")
    endforeach()
    if(TOWER_C_OUTPUT_TESTS)
      find_program(TOWER_C_CLANG NAMES clang-19 clang REQUIRED)
      find_program(TOWER_C_GCC NAMES gcc REQUIRED)
      find_program(TOWER_C_CLANGXX NAMES clang++-19 clang++ REQUIRED)
      find_program(TOWER_C_GXX NAMES g++ REQUIRED)
      foreach(check IN ITEMS backend profiles)
        file(MAKE_DIRECTORY "${CMAKE_CURRENT_BINARY_DIR}/tower-c-${check}-checks")
        add_test(NAME tower-driver-c-${check} COMMAND tower-driver-tests --c-${check}
          "$<TARGET_FILE:towerc>" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding"
          "${TOWER_C_CLANG}" "${TOWER_C_GCC}" "${TOWER_C_CLANGXX}" "${TOWER_C_GXX}")
        set_tests_properties(tower-driver-c-${check} PROPERTIES TIMEOUT 1200
          WORKING_DIRECTORY "${CMAKE_CURRENT_BINARY_DIR}/tower-c-${check}-checks")
      endforeach()
    endif()
    include("${CMAKE_CURRENT_FUNCTION_LIST_DIR}/TowerDriverRequestTests.cmake")
    cmake_language(DEFER CALL tower_driver_request_tests)
  endif()
endfunction()
cmake_language(DEFER CALL tower_driver_integrate)
