# Isolated integration for task 4. Opt in with
# -DCMAKE_PROJECT_scaffolding_INCLUDE=<absolute path to this file>.
# A validated external bootstrap compiler is required; no new native seed.
function(tower_backend_integrate)
  if(NOT TOWER_BOOTSTRAP_COMPILER)
    message(FATAL_ERROR "Tower backend requires TOWER_BOOTSTRAP_COMPILER")
  endif()
  get_property(triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
  tower_target_registry_runtime("${triple}")
  get_property(target_registry_runtime GLOBAL PROPERTY TOWER_TARGET_REGISTRY_RUNTIME)
  set(linker_input "${CMAKE_CURRENT_BINARY_DIR}/tower_backend_linker.tower")
  file(GENERATE OUTPUT "${linker_input}" CONTENT "import tower;\nimport backend.linker_tower_wasm;\n")
  tower_runtime_object(tower-backend-linker "${linker_input}" "${triple}")
  if(TOWER_NATIVE OR TOWER_BROWSER_CROSS)
    set(macho_input "${CMAKE_CURRENT_BINARY_DIR}/tower_backend_macho.tower")
    file(GENERATE OUTPUT "${macho_input}" CONTENT "import tower;\nimport backend.linker_tower_macho;\n")
    tower_runtime_object(tower-backend-macho "${macho_input}" "${triple}")
  endif()
  if(TOWER_NATIVE)
    set(cli_linker_input "${CMAKE_CURRENT_BINARY_DIR}/tower_backend_cli_linker.tower")
    file(GENERATE OUTPUT "${cli_linker_input}" CONTENT "import tower;\nimport backend.linker_tower_native;\n")
    tower_runtime_object(tower-backend-cli-linker "${cli_linker_input}" "${triple}")
    set(hosted_elf_input "${CMAKE_CURRENT_BINARY_DIR}/tower_backend_hosted_elf.tower")
    file(GENERATE OUTPUT "${hosted_elf_input}" CONTENT "import tower;\nimport backend.linker_tower_hosted_elf;\n")
    tower_runtime_object(tower-backend-hosted-elf "${hosted_elf_input}" "${triple}")
  endif()
  if(TOWER_BROWSER_LLVM)
    if(EXISTS "${TOWER_LLVM_SOURCE_DIR}/.tower-revision")
      file(READ "${TOWER_LLVM_SOURCE_DIR}/.tower-revision" backend_llvm_revision)
    else()
      execute_process(COMMAND git -C "${TOWER_LLVM_SOURCE_DIR}" rev-parse HEAD
        OUTPUT_VARIABLE backend_llvm_revision OUTPUT_STRIP_TRAILING_WHITESPACE
        COMMAND_ERROR_IS_FATAL ANY)
    endif()
    string(STRIP "${backend_llvm_revision}" backend_llvm_revision)
    if(NOT backend_llvm_revision STREQUAL "1e57ee22ca274b663eeb279fd86e7010a8441c99")
      message(FATAL_ERROR "Revalidate the Tower WASI C++ ABI profile before changing the pinned LLVM revision")
    endif()
  endif()
  set(backend_llvm_config "")
  if(TOWER_NATIVE)
    foreach(directory IN LISTS LLVM_INCLUDE_DIRS)
      if(EXISTS "${directory}/llvm/Config/Targets.def")
        set(backend_llvm_config "${directory}/llvm/Config")
        break()
      endif()
    endforeach()
  endif()
  # Build the Tower foreign-name expander for the build host, including when
  # the compiler being assembled is a WASI reactor. No native mangler/shim.
  find_program(TOWER_BACKEND_HOST_CC NAMES clang REQUIRED)
  tower_host_linker(host_link "${TOWER_BACKEND_HOST_CC}")
  execute_process(COMMAND "${TOWER_BACKEND_HOST_CC}" -print-target-triple
    OUTPUT_VARIABLE foreign_host_triple OUTPUT_STRIP_TRAILING_WHITESPACE
    COMMAND_ERROR_IS_FATAL ANY)
  set(foreign_source "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/units/foreign.tower")
  set(foreign_object "${CMAKE_CURRENT_BINARY_DIR}/tower-foreign.o")
  set(foreign_tool "${CMAKE_CURRENT_BINARY_DIR}/tower-foreign${CMAKE_HOST_EXECUTABLE_SUFFIX}")
  set(foreign_runtime_profile posix)
  if(foreign_host_triple MATCHES "windows")
    set(foreign_runtime_profile windows)
  endif()
  tower_guest_runtime(host-library "${foreign_host_triple}" "${foreign_runtime_profile}" OFF UNINSTRUMENTED)
  get_property(foreign_runtime GLOBAL PROPERTY TOWER_GUEST_host-library_OBJECT)
  add_custom_command(OUTPUT "${foreign_object}" "${foreign_tool}"
    COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${foreign_source}" --jobs "${TOWER_COMPILER_JOBS}" --library --target "${foreign_host_triple}"
      --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower" -o "${foreign_object}" --depfile "${foreign_object}.d"
    COMMAND ${host_link} "${foreign_object}" "${foreign_runtime}" -o "${foreign_tool}"
    DEPFILE "${foreign_object}.d"
    DEPENDS "${foreign_source}" "${TOWER_BOOTSTRAP_COMPILER}" "${foreign_runtime}" VERBATIM)
  set(runtime_source "")
  if(TOWER_BROWSER_LLVM)
    set(embed_object "${CMAKE_CURRENT_BINARY_DIR}/tower-embed-runtime.o")
    set(embed_tool "${CMAKE_CURRENT_BINARY_DIR}/tower-embed-runtime${CMAKE_HOST_EXECUTABLE_SUFFIX}")
    set(runtime_source "${CMAKE_CURRENT_BINARY_DIR}/tower_runtime.tower")
    tower_guest_runtime(wasm32 wasm32-unknown-unknown wasm OFF)
    get_property(guest_runtime GLOBAL PROPERTY TOWER_GUEST_wasm32_OBJECT)
    add_custom_command(OUTPUT "${embed_tool}"
      COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/backend/embed_runtime.tower"
        --jobs "${TOWER_COMPILER_JOBS}" --library --target "${foreign_host_triple}" -o "${embed_object}" --depfile "${embed_object}.d"
      COMMAND ${host_link} "${embed_object}" "${foreign_runtime}" -o "${embed_tool}"
      DEPFILE "${embed_object}.d"
      DEPENDS scaffolding/backend/embed_runtime.tower "${TOWER_BOOTSTRAP_COMPILER}" "${foreign_runtime}"
      BYPRODUCTS "${embed_object}" VERBATIM)
    add_custom_command(OUTPUT "${runtime_source}"
      COMMAND "${embed_tool}" "${guest_runtime}" "${runtime_source}"
      DEPENDS "${embed_tool}" "${guest_runtime}" VERBATIM)
  endif()
  set(file_profile posix)
  if(triple MATCHES "windows")
    set(file_profile windows)
  endif()
  if(TOWER_BROWSER)
    set(backend_profile wasi)
  elseif(triple MATCHES "linux")
    set(backend_profile native_linux)
  elseif(triple MATCHES "apple|darwin")
    set(backend_profile native_macos)
  elseif(triple MATCHES "windows")
    set(backend_profile native_windows)
  else()
    message(FATAL_ERROR "No LLVM target registry initialization profile for ${triple}")
  endif()
  foreach(flavor IN ITEMS native wasm)
    set(input "${CMAKE_CURRENT_BINARY_DIR}/tower_backend_${flavor}.tower")
    set(object "${CMAKE_CURRENT_BINARY_DIR}/tower-backend-${flavor}.o")
    set(source "import tower;\nimport compiler.units.backend_core;\nimport backend.file_${file_profile};\n")
    set(targets "")
    if(backend_llvm_config AND flavor STREQUAL "native")
      set(targets "${CMAKE_CURRENT_BINARY_DIR}/tower_backend_native_targets.tower")
      add_custom_command(OUTPUT "${targets}"
        COMMAND "${foreign_tool}" --llvm-targets "${backend_llvm_config}" "${targets}"
        DEPENDS "${foreign_tool}" "${backend_llvm_config}/Targets.def"
          "${backend_llvm_config}/AsmPrinters.def" "${backend_llvm_config}/Disassemblers.def" VERBATIM)
      string(APPEND source "import tower_backend_native_targets;\n")
    else()
      string(APPEND source "import backend.targets_${flavor};\n")
    endif()
    set(profile "${backend_profile}")
    if(TOWER_BROWSER)
      string(APPEND profile "_${flavor}")
    endif()
    string(APPEND source "import compiler.units.backend_${profile};\n")
    if(TOWER_BACKEND_TESTS)
      string(APPEND source "import compiler.units.backend_checks;\n")
      if(TOWER_BROWSER)
        string(APPEND source "import compiler.units.backend_wasi_checks;\n")
      endif()
    endif()
    set(expanded "${input}")
    if(TOWER_BROWSER_LLVM)
      string(APPEND source "import tower_runtime;\n")
      set(expanded "${CMAKE_CURRENT_BINARY_DIR}/tower_backend_${flavor}_expanded.tower")
      set(mangle_input "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/backend/wasi_support.tower")
      add_custom_command(OUTPUT "${expanded}"
        COMMAND "${foreign_tool}" "${triple}" "${mangle_input}" "${expanded}"
        COMMAND "${CMAKE_COMMAND}" -E copy_if_different "${input}" "${expanded}"
        DEPENDS "${foreign_tool}" "${input}" "${mangle_input}" BYPRODUCTS "${expanded}.wrap.rsp" VERBATIM)
    endif()
    # Only profile selection remains here; Tower imports own member ordering.
    file(GENERATE OUTPUT "${input}" CONTENT "${source}")
    if(TOWER_SANITIZER)
      tower_runtime_object(tower-backend-${flavor} "${expanded}" "${triple}")
      add_custom_command(OUTPUT "${tower-backend-${flavor}_PRIMARY_OUTPUT}" APPEND
        DEPENDS ${targets} ${runtime_source})
    else()
      add_custom_command(OUTPUT "${object}"
        COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${expanded}" --jobs "${TOWER_COMPILER_JOBS}" --library --target "${triple}"
          --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
          --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower" -o "${object}" --depfile "${object}.d"
        DEPFILE "${object}.d"
      DEPENDS "${expanded}" ${targets} ${runtime_source} "${TOWER_BOOTSTRAP_COMPILER}" scaffolding/bedrock.tower scaffolding/foundation.tower VERBATIM)
    endif()
    set_source_files_properties("${object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
    add_library(tower-backend-${flavor} INTERFACE)
    target_sources(tower-backend-${flavor} INTERFACE "${object}")
    target_sources(tower-backend-${flavor} INTERFACE "${target_registry_runtime}")
    target_sources(tower-backend-${flavor} INTERFACE "${tower-backend-linker_OBJECT}")
    if(flavor STREQUAL "native" AND (TOWER_NATIVE OR TOWER_BROWSER_CROSS))
      target_sources(tower-backend-${flavor} INTERFACE "${tower-backend-macho_OBJECT}")
    endif()
    if(flavor STREQUAL "native" AND TOWER_NATIVE)
      target_sources(tower-backend-${flavor} INTERFACE "${tower-backend-cli-linker_OBJECT}")
      target_sources(tower-backend-${flavor} INTERFACE "${tower-backend-hosted-elf_OBJECT}")
    endif()
    if(NOT TOWER_BROWSER AND triple MATCHES "linux")
      find_package(Threads REQUIRED)
      target_link_libraries(tower-backend-${flavor} INTERFACE Threads::Threads ${CMAKE_DL_LIBS})
      target_link_options(tower-backend-${flavor} INTERFACE
        -Wl,--export-dynamic-symbol=backend_register_targets -Wl,--export-dynamic-symbol=backend_thread_entry)
    elseif(NOT TOWER_BROWSER AND triple MATCHES "apple|darwin")
      target_link_options(tower-backend-${flavor} INTERFACE
        -Wl,-exported_symbol,_backend_targets_once_entry -Wl,-exported_symbol,_backend_thread_entry)
    elseif(NOT TOWER_BROWSER AND triple MATCHES "windows")
      target_link_libraries(tower-backend-${flavor} INTERFACE kernel32)
      if(MSVC)
        target_link_options(tower-backend-${flavor} INTERFACE /EXPORT:backend_windows_entry)
      else()
        target_link_options(tower-backend-${flavor} INTERFACE -Wl,--export-all-symbols)
      endif()
    endif()
  endforeach()
  if(TARGET towerc)
    target_link_libraries(towerc PRIVATE tower-backend-native)
    if(TOWER_BACKEND_TESTS)
      tower_runtime_object(tower-backend-test-main "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/backend_main.tower" "${triple}")
      get_target_property(test_sources towerc SOURCES)
      if(NOT test_sources)
        set(test_sources "")
      endif()
      list(REMOVE_ITEM test_sources "${CMAKE_CURRENT_BINARY_DIR}/tower-driver.o")
      get_target_property(test_libraries towerc LINK_LIBRARIES)
      list(REMOVE_ITEM test_libraries tower-compiler-interpreter)
      # Compile-only tests omit the driver-owned interpreter callbacks, but
      # semantic staging still needs the ordinary invocation interpreter.
      tower_compiler_evaluation()
      list(APPEND test_libraries tower-compiler-evaluation)
      add_executable(tower-backend-tests ${test_sources} "${tower-backend-test-main_OBJECT}")
      set_target_properties(tower-backend-tests PROPERTIES LINKER_LANGUAGE CXX)
      target_compile_options(tower-backend-tests PRIVATE -fno-exceptions)
      target_link_libraries(tower-backend-tests PRIVATE ${test_libraries})
      include("${CMAKE_CURRENT_FUNCTION_LIST_DIR}/TowerFrontendFocused.cmake")
    endif()
  endif()
  if(TARGET tower-browser-llvm)
    target_link_libraries(tower-browser-llvm PRIVATE tower-backend-wasm LLVMTarget LLVMObject)
  endif()
  if(TARGET tower-browser-cross)
    target_link_libraries(tower-browser-cross PRIVATE tower-backend-native LLVMTarget LLVMObject)
  endif()
  foreach(target IN ITEMS tower-browser-llvm tower-browser-cross)
    if(TARGET ${target})
      set(wrap_flavor native)
      if(target STREQUAL "tower-browser-llvm")
        set(wrap_flavor wasm)
      endif()
      target_link_options(${target} PRIVATE
        "-Wl,@${CMAKE_CURRENT_BINARY_DIR}/tower_backend_${wrap_flavor}_expanded.tower.wrap.rsp")
      # Browser compiler builds use the same Tower linker and explicit inputs.
      # Retire this host export list when Tower owns the complete reactor recipe.
      foreach(symbol IN ITEMS backend_link_create backend_link_close backend_link_add_input
          backend_reactor_argument backend_reactor_link backend_reactor_bytes backend_reactor_size backend_reactor_error
          compiler_work_create compiler_work_close compiler_work_next compiler_work_accept compiler_work_done
          compiler_work_failed compiler_work_peak compiler_work_cancel)
        target_link_options(${target} PRIVATE "-Wl,--export=${symbol}")
      endforeach()
    endif()
  endforeach()
endfunction()
cmake_language(DEFER CALL tower_backend_integrate)
