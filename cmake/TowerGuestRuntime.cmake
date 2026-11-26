# Platform artifacts assembled entirely by Tower, using upstream LLVM APIs for
# explicit startup / foreign-data ABI connections. These are target outputs.
function(tower_guest_runtime name triple profile entry)
  if(ARGN AND NOT ARGN STREQUAL "UNINSTRUMENTED")
    message(FATAL_ERROR "Unknown guest runtime build policy: ${ARGN}")
  endif()
  if(TARGET tower-guest-${name})
    return()
  endif()
  tower_runtime_tools()
  get_property(bind GLOBAL PROPERTY TOWER_RUNTIME_BIND)
  set(base "${CMAKE_CURRENT_BINARY_DIR}/guest-${name}")
  string(REPLACE "-" "_" source_name "guest_${name}")
  set(input "${CMAKE_CURRENT_BINARY_DIR}/${source_name}.tower")
  set(source "import tower;\n")
  set(modules guest_runtime)
  set(trap_entry guest_runtime_trap)
  set(main_entry guest_runtime_main)
  if(name STREQUAL "native-test")
    # The caller links the allocator and its observation functions as one supply.
    set(pairs)
    set(trap_entry guest_native_test_trap)
    set(main_entry guest_native_test_main)
    list(APPEND modules guest_native_test)
  else()
    set(pairs guest_runtime_allocate tower_allocate guest_runtime_reallocate tower_reallocate guest_runtime_deallocate tower_deallocate)
  endif()
  list(APPEND pairs guest_runtime_float_binary tower_strict_float_binary
    guest_runtime_float_convert tower_strict_float_convert
    guest_runtime_float_from_integer tower_strict_float_from_integer
    guest_runtime_float_to_integer tower_strict_float_to_integer
    guest_runtime_float_print tower_strict_float_print
    --declare guest_runtime_output tower_print)
  if(profile STREQUAL "windows")
    list(APPEND modules guest_windows guest_bytes)
  elseif(NOT profile MATCHES "^linux-" AND NOT profile STREQUAL "wasm")
    list(APPEND modules guest_libc)
  endif()
  if(profile MATCHES "^linux-")
    string(REPLACE "-" "_" profile_module "${profile}")
    list(APPEND modules guest_linux guest_${profile_module} guest_bytes)
  elseif(profile STREQUAL "wasm")
    list(APPEND modules guest_bytes guest_wasm_runtime)
    list(APPEND pairs guest_host_allocate malloc guest_host_reallocate realloc guest_host_free free --platform wasm32)
  elseif(profile STREQUAL "posix")
    list(APPEND modules guest_posix)
  endif()
  if(NOT profile STREQUAL "wasm")
    list(APPEND modules guest_output)
    list(APPEND pairs guest_runtime_print tower_print ${trap_entry} tower_trap)
  endif()
  if(NOT profile STREQUAL "posix")
    list(APPEND pairs guest_runtime_copy memcpy guest_runtime_move memmove guest_runtime_fill memset)
  endif()
  if(entry)
    list(APPEND modules guest_entry)
    list(APPEND pairs --declare guest_program_main tower_main)
    if(profile STREQUAL "windows")
      list(APPEND pairs guest_runtime_start mainCRTStartup)
    elseif(profile MATCHES "^linux-")
      list(APPEND pairs guest_runtime_start tower_start)
    elseif(profile STREQUAL "posix")
      list(APPEND pairs ${main_entry} main)
    endif()
  endif()
  if(profile MATCHES "^linux-")
    list(APPEND pairs --platform "${profile}")
  endif()
  list(APPEND pairs --exports private)
  foreach(module IN LISTS modules)
    string(APPEND source "import host.${module};\n")
  endforeach()
  file(GENERATE OUTPUT "${input}" CONTENT "${source}")
  add_custom_command(OUTPUT "${base}-unbound.ll" "${base}.ll"
    COMMAND "${TOWER_BOOTSTRAP_COMPILER}" "${input}" --jobs "${TOWER_COMPILER_JOBS}" --library --target "${triple}"
      --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
      --emit llvm -o "${base}-unbound.ll" --depfile "${base}.d"
    COMMAND "${bind}" "${base}-unbound.ll" "${base}.ll" ${pairs}
    DEPFILE "${base}.d"
    DEPENDS "${input}" "${bind}" tower-runtime-bind "${TOWER_BOOTSTRAP_COMPILER}" VERBATIM)
  if(TOWER_SANITIZER AND NOT ARGN)
    tower_sanitizer_object(guest-${name} "${base}.ll" "${triple}" "${input}"
      -ffreestanding -fno-builtin -fno-stack-protector -mllvm -disable-loop-idiom-all)
  else()
    add_custom_command(OUTPUT "${base}.o"
      COMMAND "${TOWER_RUNTIME_HOST_CC}" --target=${triple} -O2 -ffreestanding -fno-builtin
        -fno-stack-protector -mllvm -disable-loop-idiom-all -c "${base}.ll" -o "${base}.o"
      DEPENDS "${base}.ll" VERBATIM)
  endif()
  set_source_files_properties("${base}.o" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
  add_custom_target(tower-guest-${name} DEPENDS "${base}.o")
  set_property(GLOBAL PROPERTY TOWER_GUEST_${name}_OBJECT "${base}.o")
  set_property(GLOBAL PROPERTY TOWER_GUEST_${name}_IR "${base}.ll")
endfunction()

function(tower_guest_native_resources triple)
  if(CMAKE_SYSTEM_NAME STREQUAL "Linux" AND triple MATCHES "linux.*gnu")
    tower_guest_runtime(native-test "${triple}" posix ON UNINSTRUMENTED)
  endif()
  if(triple MATCHES "windows")
    set(profile windows)
  else()
    set(profile posix)
  endif()
  tower_guest_runtime(host-library "${triple}" "${profile}" OFF UNINSTRUMENTED)
  foreach(spec IN ITEMS
      "wasm32|wasm32-unknown-unknown|wasm"
      "linux-x64|x86_64-unknown-linux-gnu|linux-x64"
      "linux-arm64|aarch64-unknown-linux-gnu|linux-arm64"
      "host-linux-x64|x86_64-unknown-linux-gnu|posix"
      "host-linux-arm64|aarch64-unknown-linux-gnu|posix"
      "windows-x64|x86_64-pc-windows-msvc|windows"
      "windows-arm64|aarch64-pc-windows-msvc|windows"
      "macos-x64|x86_64-apple-macos11|posix"
      "macos-arm64|arm64-apple-macos11|posix")
    string(REPLACE "|" ";" fields "${spec}")
    list(GET fields 0 name)
    list(GET fields 1 target)
    list(GET fields 2 platform)
    set(entry ON)
    if(platform STREQUAL "wasm")
      set(entry OFF)
    endif()
    # Distributed guest programs are target resources, not compiler/test objects.
    tower_guest_runtime("${name}" "${target}" "${platform}" "${entry}" UNINSTRUMENTED)
    get_property(ir GLOBAL PROPERTY TOWER_GUEST_${name}_IR)
    set(resource "${CMAKE_CURRENT_BINARY_DIR}/share/tower/runtime-${name}.ll")
    add_custom_command(OUTPUT "${resource}"
      COMMAND "${CMAKE_COMMAND}" -E copy_if_different "${ir}" "${resource}"
      DEPENDS "${ir}" VERBATIM)
    add_custom_target(tower-runtime-resource-${name} DEPENDS "${resource}")
    add_dependencies(towerc tower-runtime-resource-${name})
  endforeach()
endfunction()
