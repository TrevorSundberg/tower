# Isolated native CLI integration. Tower owns host policies and platform calls;
# driver.cpp only connects the retained compiler/interpreter interfaces.
option(TOWER_DRIVER_TESTS "Build Tower CLI policy and process tests" OFF)
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
  if(triple MATCHES "windows")
    set(platform windows)
    set(profile windows-arguments)
  elseif(triple MATCHES "darwin|apple")
    set(profile macos)
  endif()
  set(input "${CMAKE_CURRENT_BINARY_DIR}/tower-driver.tower")
  set(object "${CMAKE_CURRENT_BINARY_DIR}/tower-driver.o")
  file(GLOB sources CONFIGURE_DEPENDS "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/host/driver-*.tower")
  set(source "import tower;\n")
  foreach(name IN ITEMS support timing windows-arguments ${platform} ${profile} link prepare)
    set(path "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/host/driver-${name}")
    string(APPEND source "import \"${path}\";\n")
  endforeach()
  set_property(GLOBAL PROPERTY TOWER_DRIVER_SOURCE "${source}")
  file(GENERATE OUTPUT "${input}" CONTENT "${source}import \"${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/host/driver-entry\";\n")
  add_custom_command(OUTPUT "${object}"
    COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${input}" --library --target "${triple}"
      --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
      -o "${object}" --depfile "${object}.d"
    DEPFILE "${object}.d"
    DEPENDS "${input}" ${sources} "${TOWER_BOOTSTRAP_COMPILER}" VERBATIM)
  set_source_files_properties("${object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
  target_sources(towerc PRIVATE "${object}")
  if(TOWER_DRIVER_TESTS)
    # Keep fixtures out of the production object and use the Tower guest runtime.
    string(APPEND source "import \"${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/driver-${platform}\";\n")
    string(APPEND source "import \"${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/driver\";\n")
    set(test_input "${CMAKE_CURRENT_BINARY_DIR}/tower-driver-tests.tower")
    file(GENERATE OUTPUT "${test_input}" CONTENT "${source}")
    set(test_objects "")
    foreach(unit IN ITEMS tests standalone)
      set(unit_input "${test_input}")
      if(unit STREQUAL "standalone")
        set(unit_input "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/driver-standalone.tower")
      endif()
      set(unit_object "${CMAKE_CURRENT_BINARY_DIR}/tower-driver-${unit}.o")
      add_custom_command(OUTPUT "${unit_object}"
        COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${unit_input}" --library --target "${triple}"
          --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
          --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
          -o "${unit_object}" --depfile "${unit_object}.d"
        DEPFILE "${unit_object}.d"
        DEPENDS "${unit_input}" ${sources} scaffolding/tests/driver.tower
          scaffolding/tests/driver-${platform}.tower scaffolding/tests/driver-main.tower
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
    include("${CMAKE_CURRENT_FUNCTION_LIST_DIR}/TowerDriverRequestTests.cmake")
    cmake_language(DEFER CALL tower_driver_request_tests)
  endif()
endfunction()
cmake_language(DEFER CALL tower_driver_integrate)
