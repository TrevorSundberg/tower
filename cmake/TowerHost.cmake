# Temporary host ABI objects. Both implementations and functional tests are Tower.
function(tower_compiler_host bootstrap dependency triple)
  set(input "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-host.tower")
  set(object "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-host.o")
  set(tests "")
  set(driver "")
  if(TOWER_NATIVE OR TOWER_PARSER_ONLY)
    set(driver "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/host/driver-options.tower")
  endif()
  if(TOWER_PARSER_ONLY)
    set(tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/host-runtime.tower")
  endif()
  add_custom_command(OUTPUT "${input}"
    COMMAND "${CMAKE_COMMAND}" -DROOT=${CMAKE_CURRENT_SOURCE_DIR} -DDRIVER=${driver} -DTESTS=${tests} -DOUTPUT=${input}
      -P "${CMAKE_CURRENT_SOURCE_DIR}/cmake/ComposeHost.cmake"
    DEPENDS scaffolding/host/memory.tower scaffolding/host/driver-options.tower
      scaffolding/host/driver-services.tower scaffolding/tests/host-services.tower
      scaffolding/host/driver-files.tower
      scaffolding/host/browser-protocol.tower
      scaffolding/library/bytes.tower scaffolding/compiler/host-text.tower
      scaffolding/compiler/host-handles.tower scaffolding/tests/host.tower
      ${tests} cmake/ComposeHost.cmake VERBATIM)
  add_custom_command(OUTPUT "${object}"
    COMMAND "${bootstrap}" "${input}" --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
      --library --target "${triple}" -o "${object}"
    DEPENDS ${dependency} "${input}" scaffolding/bedrock.tower scaffolding/foundation.tower VERBATIM)
  set_source_files_properties("${object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
  target_sources(tower-compiler-memory PRIVATE "${object}")
endfunction()
