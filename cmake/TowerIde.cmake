# IDE service integration, currently linked into the WASI host. All policies,
# ownership and functional fixtures are Tower; no native adapter is generated.
option(TOWER_IDE_TESTS "Include focused Tower IDE service fixtures" OFF)
function(tower_ide_integrate target)
  set(input "${CMAKE_CURRENT_BINARY_DIR}/tower_compiler_ide.tower")
  set(object "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-ide.o")
  file(GLOB sources CONFIGURE_DEPENDS "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/host/ide_*.tower")
  set(source "import tower;\n")
  foreach(module IN ITEMS state selftest parser tree completion execution artifacts)
    string(APPEND source "import host.ide_${module};\n")
  endforeach()
  if(TOWER_IDE_TESTS)
    string(APPEND source "import tests.ide;\n")
  endif()
  file(GENERATE OUTPUT "${input}" CONTENT "${source}")
  add_custom_command(OUTPUT "${object}"
    COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${input}" --library --target wasm32-unknown-unknown
      --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
      -o "${object}" --depfile "${object}.d"
    DEPFILE "${object}.d"
    DEPENDS "${input}" ${sources} "${TOWER_BOOTSTRAP_COMPILER}" VERBATIM)
  set_source_files_properties("${object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
  target_sources(${target} PRIVATE "${object}")
  # Tower foreign imports use env; this is the same existing host call contract.
  target_link_options(${target} PRIVATE "-Wl,--undefined=tw_foreign_call" "-Wl,--allow-undefined-file=${CMAKE_CURRENT_SOURCE_DIR}/cmake/IdeImports.txt")
endfunction()
