# Build actual Tower source for the compiler's target, using a host bootstrap.
# Generated objects are ordinary platform artifacts, never Tower interchange files.
set(TOWER_BOOTSTRAP_COMPILER "" CACHE FILEPATH "Host Tower compiler used to build Tower-written compiler utilities")
set(TOWER_UTILITIES_TARGET "" CACHE STRING "Override the compiler utility object's target triple")
function(tower_compiler_utilities)
  if(TARGET tower-compiler-utilities)
    return()
  endif()
  if(TOWER_BOOTSTRAP_COMPILER)
    if(NOT EXISTS "${TOWER_BOOTSTRAP_COMPILER}")
      message(FATAL_ERROR "TOWER_BOOTSTRAP_COMPILER does not exist: ${TOWER_BOOTSTRAP_COMPILER}")
    endif()
    set(bootstrap "${TOWER_BOOTSTRAP_COMPILER}")
    set(bootstrap_dependency "${TOWER_BOOTSTRAP_COMPILER}")
  elseif(TARGET towerc-seed)
    set(bootstrap "$<TARGET_FILE:towerc-seed>")
    set(bootstrap_dependency towerc-seed)
  else()
    message(FATAL_ERROR "Set TOWER_BOOTSTRAP_COMPILER to a host towerc (playground/scripts/build-bootstrap.sh builds the transitional C++ seed).")
  endif()
  if(TOWER_UTILITIES_TARGET)
    set(triple "${TOWER_UTILITIES_TARGET}")
  elseif(TOWER_BROWSER)
    set(triple wasm32-unknown-unknown)
  elseif(CMAKE_CXX_COMPILER_TARGET)
    set(triple "${CMAKE_CXX_COMPILER_TARGET}")
  elseif(MSVC)
    if(CMAKE_SYSTEM_PROCESSOR MATCHES "ARM64|aarch64")
      set(triple aarch64-pc-windows-msvc)
    else()
      set(triple x86_64-pc-windows-msvc)
    endif()
  else()
    execute_process(COMMAND "${CMAKE_CXX_COMPILER}" -dumpmachine
      OUTPUT_VARIABLE triple OUTPUT_STRIP_TRAILING_WHITESPACE COMMAND_ERROR_IS_FATAL ANY)
  endif()
  add_library(tower-compiler-memory STATIC scaffolding/compiler-memory.cpp)
  add_library(tower-compiler-utilities INTERFACE)
  foreach(source IN ITEMS scaffolding/compiler/utf8.tower scaffolding/library/bytes.tower)
    get_filename_component(name "${source}" NAME_WE)
    set(object "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-${name}.o")
    add_custom_command(OUTPUT "${object}"
      COMMAND "${bootstrap}" "${CMAKE_CURRENT_SOURCE_DIR}/${source}"
        --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
        --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower"
        --library --target "${triple}" -o "${object}"
      DEPENDS ${bootstrap_dependency} "${source}"
        scaffolding/bedrock.tower scaffolding/foundation.tower
      COMMENT "Compiling Tower-written ${name} utilities for ${triple}" VERBATIM)
    set_source_files_properties("${object}" PROPERTIES GENERATED TRUE EXTERNAL_OBJECT TRUE)
    target_sources(tower-compiler-utilities INTERFACE "${object}")
  endforeach()
endfunction()
