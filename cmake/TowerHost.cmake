# Select the platform profile; implementation and fixture composition are Tower.
function(tower_compiler_host bootstrap dependency triple)
  set(input "${CMAKE_CURRENT_BINARY_DIR}/tower_compiler_host.tower")
  set(object "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-host.o")
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
  set(profile host_${module_platform})
  if(TOWER_PARSER_ONLY)
    string(APPEND profile "_checks")
  elseif(TOWER_NATIVE)
    string(APPEND profile "_driver")
  endif()
  file(GENERATE OUTPUT "${input}" CONTENT "import compiler.units.${profile};\n")
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
