# The formatter and these selected guests share the driver's capture transport.
function(tower_driver_file_suite suite unit count guest capture exports)
  set(root "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding")
  # These owner closures already select nine formatter and seven SHA-256 tests.
  math(EXPR total "16 + ${count}")
  tower_native_test_selections("driver-${suite}" "${unit}" "${total} tests" "${count} tests"
    --bedrock "${root}/bedrock.tower" --foundation "${root}/foundation.tower"
    --test-native-runtime "${guest}" --link "${capture}" --link "$<TARGET_FILE:tower-driver-request-services>"
    --link "-Wl,-rpath,$<TARGET_FILE_DIR:tower-driver-request-services>")
  foreach(selection IN ITEMS owner direct)
    foreach(jobs IN ITEMS 1 4)
      set(name "tower-driver-${suite}-${selection}-jobs-${jobs}")
      set(work "${CMAKE_CURRENT_BINARY_DIR}/${name}")
      file(MAKE_DIRECTORY "${work}/tmp")
      foreach(file IN LISTS exports)
        configure_file("${TOWER_DRIVER_BROWSER_EXPORTS}/${file}" "${work}/${file}" COPYONLY)
      endforeach()
      set_tests_properties("${name}" PROPERTIES WORKING_DIRECTORY "${work}" TIMEOUT 180
        ENVIRONMENT "TMPDIR=${work}/tmp;TOWER_DRIVER_COMPILER=$<TARGET_FILE:towerc>;TOWER_DRIVER_SOURCES=${root};TOWER_FORMAT_COMPILER=$<TARGET_FILE:towerc>;TOWER_FORMAT_LIBRARY=${root};${ARGN}")
    endforeach()
  endforeach()
endfunction()

function(tower_driver_file_selections guest capture)
  tower_driver_file_suite(module-paths driver_module_paths 4 "${guest}" "${capture}" "")
  option(TOWER_DRIVER_LINK_TESTS "Run linking selections with the built Wasm archive and browser exports" OFF)
  if(NOT TOWER_DRIVER_LINK_TESTS)
    return()
  endif()
  set(TOWER_DRIVER_WASM_ARCHIVE "${CMAKE_CURRENT_SOURCE_DIR}/build/linking/wasm-fixture.a" CACHE FILEPATH
    "Archive produced by the browser linking fixture")
  set(TOWER_DRIVER_BROWSER_EXPORTS "${CMAKE_CURRENT_SOURCE_DIR}/build/cross" CACHE PATH
    "Directory of executables produced by the browser cross-compilation tests")
  if(NOT EXISTS "${TOWER_DRIVER_WASM_ARCHIVE}")
    message(FATAL_ERROR "Missing build-wasm fixture archive: ${TOWER_DRIVER_WASM_ARCHIVE}")
  endif()
  find_program(TOWER_DRIVER_CLANG NAMES clang-19 clang REQUIRED)
  find_program(TOWER_DRIVER_AR NAMES llvm-ar-19 llvm-ar REQUIRED)
  find_program(TOWER_DRIVER_QEMU NAMES qemu-aarch64)
  get_property(llvm GLOBAL PROPERTY TOWER_RUNTIME_LLVM_LIBRARY)
  set(exports linux.elf library-linux.elf)
  set(qemu "")
  if(TOWER_DRIVER_QEMU)
    set(qemu "${TOWER_DRIVER_QEMU}")
    list(APPEND exports linux-arm.elf library-linux-arm.elf)
  endif()
  tower_driver_file_suite(linking driver_linking 8 "${guest}" "${capture}" "${exports}"
    "TOWER_DRIVER_CLANG=${TOWER_DRIVER_CLANG}" "TOWER_DRIVER_AR=${TOWER_DRIVER_AR}"
    "TOWER_DRIVER_WASM_ARCHIVE=${TOWER_DRIVER_WASM_ARCHIVE}" "TOWER_DRIVER_LLVM=${llvm}" "TOWER_DRIVER_QEMU=${qemu}")
endfunction()
