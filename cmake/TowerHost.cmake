# Temporary host ABI objects. Both implementations and functional tests are Tower.
function(tower_compiler_host bootstrap dependency triple)
  set(input "${CMAKE_CURRENT_BINARY_DIR}/tower_compiler_host.tower")
  set(object "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-host.o")
  set(tests "")
  set(driver "")
  set(module_platform linux)
  if(triple MATCHES "wasm")
    set(module_platform wasi)
  elseif(triple MATCHES "windows")
    set(module_platform windows)
  elseif(triple MATCHES "apple|darwin")
    set(module_platform macos)
  elseif(NOT triple MATCHES "^(x86_64|aarch64|arm64)-.*linux")
    message(FATAL_ERROR "Revalidate the module filesystem ABI for ${triple}")
  endif()
  if(TOWER_NATIVE OR TOWER_PARSER_ONLY)
    set(driver "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/host/driver_options.tower")
  endif()
  if(TOWER_PARSER_ONLY)
    set(tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/host_runtime.tower")
  endif()
  add_custom_command(OUTPUT "${input}"
    COMMAND "${CMAKE_COMMAND}" -DROOT=${CMAKE_CURRENT_SOURCE_DIR} -DDRIVER=${driver} -DTESTS=${tests} -DOUTPUT=${input} -DMODULE_PLATFORM=${module_platform} -DWORK_THREADS=${TOWER_BROWSER_THREADS}
      -P "${CMAKE_CURRENT_SOURCE_DIR}/cmake/ComposeHost.cmake"
    DEPENDS scaffolding/host/memory.tower scaffolding/host/driver_options.tower
      scaffolding/host/driver_services.tower scaffolding/tests/host_services.tower
      scaffolding/host/driver_files.tower
      scaffolding/host/ide_protocol.tower
      scaffolding/library/bytes.tower scaffolding/compiler/host_text.tower
      scaffolding/compiler/host_handles.tower scaffolding/tests/host.tower
      ${tests} cmake/ComposeHost.cmake VERBATIM)
  add_custom_command(OUTPUT "${object}"
    COMMAND "${bootstrap}" "${input}" --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
      --library --target "${triple}" -o "${object}" --depfile "${object}.d"
    DEPFILE "${object}.d"
    DEPENDS ${dependency} "${input}" scaffolding/bedrock.tower scaffolding/foundation.tower VERBATIM)
  set_source_files_properties("${object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
  target_sources(tower-compiler-memory PRIVATE "${object}")
  include("${CMAKE_CURRENT_FUNCTION_LIST_DIR}/TowerWorkHost.cmake")
  tower_compiler_work_host("${triple}" "${module_platform}")
  include("${CMAKE_CURRENT_FUNCTION_LIST_DIR}/TowerAllocatorTests.cmake")
endfunction()
