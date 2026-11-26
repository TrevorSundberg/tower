# The optional kit owns a private compiler/resource tree. Its test sources
# and providers never enter the ordinary native or browser compiler packages.
get_property(scc_runtime GLOBAL PROPERTY TOWER_GUEST_native-test_OBJECT)
get_property(scc_allocator GLOBAL PROPERTY TOWER_RUNTIME_INSTRUMENTED_OBJECT)
set(scc_providers "${scc_runtime}" "${scc_allocator}" "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-bytes.o"
  "${CMAKE_CURRENT_BINARY_DIR}/tower-compiler-utf8.o" "$<TARGET_FILE:tower-compiler-memory>")
add_custom_target(tower-scc-suite DEPENDS towerc tower-guest-native-test ${scc_providers})
# CTest reads the same registrations in the build and after relocation.
set(scc_bin "${CMAKE_CURRENT_BINARY_DIR}")
set(scc_objects "${CMAKE_CURRENT_BINARY_DIR}")
set(scc_library "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/library")
configure_file("${CMAKE_CURRENT_LIST_DIR}/TowerSccTests.cmake.in" "scc-tests.cmake" @ONLY)
set_property(DIRECTORY APPEND PROPERTY TEST_INCLUDE_FILES "${CMAKE_CURRENT_BINARY_DIR}/scc-tests.cmake")

set(scc_bin ".")
set(scc_objects "${scc_bin}/providers")
set(scc_library "${scc_bin}/share/tower/library")
configure_file("${CMAKE_CURRENT_LIST_DIR}/TowerSccTests.cmake.in" "scc-install/CTestTestfile.cmake" @ONLY)
set(scc_install COMPONENT SccTests EXCLUDE_FROM_ALL)
install(PROGRAMS "$<TARGET_FILE:towerc>" DESTINATION scc-suite ${scc_install})
install(FILES bootstrap/linux-x64/LLVM-LICENSE.txt "${CMAKE_CURRENT_BINARY_DIR}/scc-install/CTestTestfile.cmake" DESTINATION scc-suite ${scc_install})
install(FILES ${scc_providers} DESTINATION scc-suite/providers ${scc_install})
foreach(resource IN LISTS builtin_modules)
  get_filename_component(dir "${resource}" DIRECTORY)
  install(FILES "${CMAKE_CURRENT_BINARY_DIR}/share/tower/${resource}" DESTINATION "scc-suite/share/tower/${dir}" ${scc_install})
endforeach()
get_property(scc_runtimes GLOBAL PROPERTY TOWER_GUEST_NATIVE_RESOURCES)
install(FILES ${scc_runtimes} DESTINATION scc-suite/share/tower ${scc_install})
install(FILES scaffolding/library/graph_components_test.tower scaffolding/library/graph_components_wrong.tower
  scaffolding/library/graph_components_expectations.tower
  DESTINATION scc-suite/share/tower/library ${scc_install})
install(FILES scaffolding/tests/graph_components_checks.tower scaffolding/tests/utility_checks.tower
  DESTINATION scc-suite/share/tower/tests ${scc_install})
