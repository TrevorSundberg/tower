cmake_minimum_required(VERSION 3.20)
project(tower_sanitizer_manifest_transport NONE)

# Configure/generate only: these tool placeholders must never be executed.
set(TOWER_SANITIZER address)
set(TOWER_NATIVE ON)
set(CMAKE_C_COMPILER "${CMAKE_COMMAND}")
add_custom_target(tower-instrument-llvm)
set_property(GLOBAL PROPERTY TOWER_INSTRUMENT_LLVM "${CMAKE_COMMAND}")
if(NOT SANITIZER_MODULE)
  get_filename_component(SANITIZER_MODULE "${CMAKE_CURRENT_LIST_DIR}/../../TowerSanitizers.cmake" ABSOLUTE)
endif()
include("${SANITIZER_MODULE}")

function(register_object name target)
  tower_sanitizer_object("${name}" "${CMAKE_CURRENT_BINARY_DIR}/${name}-original.ll"
    x86_64-unknown-linux-gnu "${CMAKE_CURRENT_SOURCE_DIR}/inputs with spaces/${name}.tower")
  add_custom_target(${target} DEPENDS "${${name}_OBJECT}")
endfunction()

register_object(common early)
get_property(early_entry GLOBAL PROPERTY TOWER_SANITIZER_OBJECTS)
set_property(GLOBAL PROPERTY FIXTURE_EARLY_ENTRY "${early_entry}")

function(register_probe)
  register_object(probe probe)
  # An identical inventory receipt is harmless; conflicting ownership is not.
  get_property(early GLOBAL PROPERTY FIXTURE_EARLY_ENTRY)
  set_property(GLOBAL APPEND PROPERTY TOWER_SANITIZER_OBJECTS "${early}")
  if(CONFLICT)
    string(REPLACE "common.tower" "other.tower" early "${early}")
    set_property(GLOBAL APPEND PROPERTY TOWER_SANITIZER_OBJECTS "${early}")
  endif()
endfunction()

function(register_receipt)
  register_object("receipt with space" receipt)
  cmake_language(DEFER CALL register_probe)
endfunction()

function(register_late)
  # Equal basenames in different directories must stay distinct.
  register_object(nested/common late)
  cmake_language(DEFER CALL register_receipt)
endfunction()
cmake_language(DEFER CALL register_late)
