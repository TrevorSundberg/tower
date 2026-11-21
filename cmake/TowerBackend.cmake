# Isolated integration for task 4. Opt in with
# -DCMAKE_PROJECT_scaffolding_INCLUDE=<absolute path to this file>.
# A validated external bootstrap compiler is required; no new native seed.
function(tower_backend_integrate)
  if(NOT TOWER_BOOTSTRAP_COMPILER)
    message(FATAL_ERROR "Tower backend requires TOWER_BOOTSTRAP_COMPILER")
  endif()
  get_property(triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
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
  file(GLOB backend_sources CONFIGURE_DEPENDS "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/backend/*.tower")
  # Build the Tower foreign-name expander for the build host, including when
  # the compiler being assembled is a WASI reactor. No native mangler/shim.
  find_program(TOWER_BACKEND_HOST_CC NAMES clang REQUIRED)
  execute_process(COMMAND "${TOWER_BACKEND_HOST_CC}" -print-target-triple
    OUTPUT_VARIABLE foreign_host_triple OUTPUT_STRIP_TRAILING_WHITESPACE
    COMMAND_ERROR_IS_FATAL ANY)
  set(foreign_source "${CMAKE_CURRENT_BINARY_DIR}/tower_foreign.tower")
  set(foreign_object "${CMAKE_CURRENT_BINARY_DIR}/tower-foreign.o")
  set(foreign_tool "${CMAKE_CURRENT_BINARY_DIR}/tower-foreign${CMAKE_HOST_EXECUTABLE_SUFFIX}")
  set(foreign_runtime_profile posix)
  if(foreign_host_triple MATCHES "windows")
    set(foreign_runtime_profile windows)
  endif()
  tower_guest_runtime(host-library "${foreign_host_triple}" "${foreign_runtime_profile}" OFF)
  get_property(foreign_runtime GLOBAL PROPERTY TOWER_GUEST_host-library_OBJECT)
  add_custom_command(OUTPUT "${foreign_source}"
    COMMAND "${CMAKE_COMMAND}" -DROOT=${CMAKE_CURRENT_SOURCE_DIR} -DOUTPUT=${foreign_source}
      -P "${CMAKE_CURRENT_SOURCE_DIR}/cmake/ComposeForeign.cmake"
    DEPENDS ${backend_sources} scaffolding/library/vector.tower cmake/ComposeForeign.cmake VERBATIM)
  add_custom_command(OUTPUT "${foreign_tool}"
    COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${foreign_source}" --library --target "${foreign_host_triple}"
      --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower" -o "${foreign_object}" --depfile "${foreign_object}.d"
    COMMAND "${TOWER_BACKEND_HOST_CC}" "${foreign_object}" "${foreign_runtime}" -o "${foreign_tool}"
    DEPFILE "${foreign_object}.d"
    DEPENDS "${foreign_source}" "${TOWER_BOOTSTRAP_COMPILER}" "${foreign_runtime}"
    BYPRODUCTS "${foreign_object}" VERBATIM)
  set(runtime_source "")
  if(TOWER_BROWSER_LLVM)
    set(embed_object "${CMAKE_CURRENT_BINARY_DIR}/tower-embed-runtime.o")
    set(embed_tool "${CMAKE_CURRENT_BINARY_DIR}/tower-embed-runtime${CMAKE_HOST_EXECUTABLE_SUFFIX}")
    set(runtime_source "${CMAKE_CURRENT_BINARY_DIR}/tower_runtime.tower")
    tower_guest_runtime(wasm32 wasm32-unknown-unknown wasm OFF)
    get_property(guest_runtime GLOBAL PROPERTY TOWER_GUEST_wasm32_OBJECT)
    add_custom_command(OUTPUT "${embed_tool}"
      COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/backend/embed_runtime.tower"
        --library --target "${foreign_host_triple}" -o "${embed_object}" --depfile "${embed_object}.d"
      COMMAND "${TOWER_BACKEND_HOST_CC}" "${embed_object}" "${foreign_runtime}" -o "${embed_tool}"
      DEPFILE "${embed_object}.d"
      DEPENDS scaffolding/backend/embed_runtime.tower "${TOWER_BOOTSTRAP_COMPILER}" "${foreign_runtime}"
      BYPRODUCTS "${embed_object}" VERBATIM)
    add_custom_command(OUTPUT "${runtime_source}"
      COMMAND "${embed_tool}" "${guest_runtime}" "${runtime_source}"
      DEPENDS "${embed_tool}" "${guest_runtime}" VERBATIM)
  endif()
  foreach(flavor IN ITEMS native wasm)
    set(input "${CMAKE_CURRENT_BINARY_DIR}/tower_backend_${flavor}.tower")
    set(expanded "${CMAKE_CURRENT_BINARY_DIR}/tower_backend_${flavor}_expanded.tower")
    set(object "${CMAKE_CURRENT_BINARY_DIR}/tower-backend-${flavor}.o")
    set(wasm_only OFF)
    if(flavor STREQUAL "wasm")
      set(wasm_only ON)
    endif()
    add_custom_command(OUTPUT "${input}"
      COMMAND "${CMAKE_COMMAND}" -DROOT=${CMAKE_CURRENT_SOURCE_DIR} -DOUTPUT=${input} -DWASM_ONLY=${wasm_only} -DWASI_HOST=${TOWER_BROWSER} -DTESTS=${TOWER_BACKEND_TESTS} -DLLVM_CONFIG_DIR=${backend_llvm_config} -DHOST_TRIPLE=${triple} -DRUNTIME_SOURCE=${runtime_source}
        -P "${CMAKE_CURRENT_SOURCE_DIR}/cmake/ComposeBackend.cmake"
      DEPENDS ${backend_sources} scaffolding/library/vector.tower scaffolding/compiler/foundation_nodes.tower
        cmake/ComposeBackend.cmake scaffolding/tests/backend.tower scaffolding/tests/foreign_names.tower
        scaffolding/host/llvm_worker.tower scaffolding/tests/backend_source.tower ${runtime_source} VERBATIM)
    set(mangle_input "${input}")
    if(TOWER_BROWSER_LLVM)
      set(mangle_input "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/backend/wasi_support.tower")
    endif()
    add_custom_command(OUTPUT "${expanded}"
      COMMAND "${foreign_tool}" "${triple}" "${mangle_input}" "${expanded}"
      COMMAND "${CMAKE_COMMAND}" -E copy_if_different "${input}" "${expanded}"
      DEPENDS "${foreign_tool}" "${input}" "${mangle_input}" BYPRODUCTS "${expanded}.wrap.rsp" VERBATIM)
    add_custom_command(OUTPUT "${object}"
      COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${expanded}" --library --target "${triple}"
        --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
        --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower" -o "${object}" --depfile "${object}.d"
      DEPFILE "${object}.d"
    DEPENDS "${expanded}" "${TOWER_BOOTSTRAP_COMPILER}" scaffolding/bedrock.tower scaffolding/foundation.tower VERBATIM)
    set_source_files_properties("${object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
    add_library(tower-backend-${flavor} INTERFACE)
    target_sources(tower-backend-${flavor} INTERFACE "${object}")
  endforeach()
  if(TARGET towerc)
    target_link_libraries(towerc PRIVATE tower-backend-native)
    if(TOWER_BACKEND_TESTS)
      set(test_object "${CMAKE_CURRENT_BINARY_DIR}/tower-backend-test-main.o")
      add_custom_command(OUTPUT "${test_object}"
        COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/backend_main.tower"
          --library --target "${triple}" -o "${test_object}" --depfile "${test_object}.d"
        DEPFILE "${test_object}.d"
    DEPENDS scaffolding/tests/backend_main.tower "${TOWER_BOOTSTRAP_COMPILER}" VERBATIM)
      set_source_files_properties("${test_object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
      get_target_property(test_sources towerc SOURCES)
      list(REMOVE_ITEM test_sources "${CMAKE_CURRENT_BINARY_DIR}/tower-driver.o")
      get_target_property(test_libraries towerc LINK_LIBRARIES)
      list(REMOVE_ITEM test_libraries tower-compiler-interpreter)
      add_executable(tower-backend-tests ${test_sources} "${test_object}")
      target_compile_features(tower-backend-tests PRIVATE cxx_std_20)
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
