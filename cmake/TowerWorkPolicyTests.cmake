# Compare explicit single-owner failure injection with the real worker fixture.
get_property(policy_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
get_property(policy_runtime GLOBAL PROPERTY TOWER_RUNTIME_INSTRUMENTED_OBJECT)
if(NOT policy_runtime)
  tower_runtime_object(work-instrumented-runtime "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/host/memory_instrumented.tower" "${policy_triple}"
    compiler_runtime_allocate tower_allocate compiler_runtime_reallocate tower_reallocate
    compiler_runtime_deallocate tower_deallocate --state compiler-tests)
  set(policy_runtime "${work-instrumented-runtime_OBJECT}")
endif()
set(policy_objects)
foreach(unit IN ITEMS tests/work_instrumented host/memory)
  string(REPLACE "/" "_" name "${unit}")
  tower_runtime_object(${name} "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/${unit}.tower" "${policy_triple}")
  list(APPEND policy_objects "${${name}_OBJECT}")
endforeach()
get_property(policy_trap GLOBAL PROPERTY TOWER_RUNTIME_TRAP_OBJECT)
add_executable(tower-work-instrumented-tests ${policy_objects} "${policy_runtime}" "${policy_trap}")
set_target_properties(tower-work-instrumented-tests PROPERTIES LINKER_LANGUAGE C)
target_link_libraries(tower-work-instrumented-tests PRIVATE tower-compiler-work-serial Threads::Threads ${CMAKE_DL_LIBS})
add_test(NAME tower-worker-instrumented COMMAND tower-work-instrumented-tests)
set_tests_properties(tower-worker-instrumented PROPERTIES TIMEOUT 30)

if(policy_triple MATCHES "^x86_64-.*linux")
  # Both declaration-only entity clients share one implementation object. Each
  # executable selects its existing normal or single-owner fault allocator.
  tower_runtime_object(entity-create-provider
    "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/library/entities.tower" "${policy_triple}")
  # Buffer/arena fixtures import host.memory; the ledger fixture links the
  # existing memory object. All use the single-owner fault allocator/transport.
  foreach(unit IN ITEMS work_buffer_faults work_arena_faults work_budget_allocation entity_create_faults work_constructor_faults entity_component_faults entity_stage_result_faults)
    string(REPLACE "_" "-" name "${unit}")
    tower_runtime_object(${name}
      "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/${unit}.tower" "${policy_triple}")
    set(fault_memory)
    if(unit STREQUAL "work_budget_allocation" OR unit STREQUAL "entity_create_faults")
      list(APPEND fault_memory "${host_memory_OBJECT}")
    endif()
    if(unit STREQUAL "entity_create_faults")
      list(APPEND fault_memory "${entity-create-provider_OBJECT}")
    endif()
    add_executable(tower-${name}-tests
      "${${name}_OBJECT}" ${fault_memory} "${policy_runtime}" "${policy_trap}")
    set_target_properties(tower-${name}-tests PROPERTIES LINKER_LANGUAGE C)
    target_link_libraries(tower-${name}-tests PRIVATE tower-compiler-work-serial Threads::Threads ${CMAKE_DL_LIBS})
    add_test(NAME tower-${name}-tests COMMAND tower-${name}-tests)
    set_tests_properties(tower-${name}-tests PROPERTIES TIMEOUT 30)
  endforeach()
endif()

# Backend/frontend registration runs after the native compiler target exists.
# Reuse its production allocator, without the frontend instrumentation override.
function(tower_lr_work_policy_test)
  if(NOT TARGET tower-backend-tests)
    return()
  endif()
  get_property(triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
  tower_runtime_object(lr-work-main "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/lr_work_main.tower" "${triple}" lr_work_test_main main)
  set(receipt_objects)
  foreach(suite IN ITEMS receipt failure_order)
    tower_runtime_object(semantic-${suite}-checks
      "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/semantic_${suite}_checks.tower" "${triple}"
      main semantic_${suite}_tests)
    list(APPEND receipt_objects "${semantic-${suite}-checks_OBJECT}")
  endforeach()
  get_target_property(sources tower-backend-tests SOURCES)
  list(REMOVE_ITEM sources "${CMAKE_CURRENT_BINARY_DIR}/tower-backend-test-main.o")
  get_target_property(libraries tower-backend-tests LINK_LIBRARIES)
  tower_compiler_evaluation()
  if(NOT "tower-compiler-evaluation" IN_LIST libraries)
    list(APPEND libraries tower-compiler-evaluation)
  endif()
  add_executable(tower-lr-work-tests ${sources} "${lr-work-main_OBJECT}" ${receipt_objects})
  set_target_properties(tower-lr-work-tests PROPERTIES LINKER_LANGUAGE CXX)
  target_compile_options(tower-lr-work-tests PRIVATE -fno-exceptions)
  target_link_libraries(tower-lr-work-tests PRIVATE ${libraries})
  target_link_options(tower-lr-work-tests PRIVATE -Wl,--export-dynamic-symbol=named_worker_entry)
  # Keep release coverage, but permit focused development checks without running
  # every independent compiler subsystem through the same test entry.
  add_test(NAME tower-lr-worker-equivalence COMMAND tower-lr-work-tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" lr)
  add_test(NAME tower-native-units COMMAND tower-lr-work-tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" units)
  add_test(NAME tower-native-backend-units COMMAND tower-lr-work-tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" backend)
  add_test(NAME tower-editor-units COMMAND tower-lr-work-tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" editor)
  add_test(NAME tower-body-continuations COMMAND tower-lr-work-tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" bodies)
  add_test(NAME tower-query-continuations COMMAND tower-lr-work-tests "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" query-smoke)
  set_tests_properties(tower-lr-worker-equivalence tower-native-units tower-native-backend-units tower-editor-units tower-body-continuations tower-query-continuations PROPERTIES TIMEOUT 180)
  add_custom_target(tower-body-smoke
    COMMAND "$<TARGET_FILE:tower-lr-work-tests>" "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" body-smoke
    DEPENDS tower-lr-work-tests USES_TERMINAL VERBATIM)

  if(TOWER_MODULE_TESTS)
    tower_runtime_object(module-cache-checks
      "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/module_cache_checks.tower" "${triple}")
    add_executable(tower-module-cache-tests ${sources} "${module-cache-checks_OBJECT}")
    set_target_properties(tower-module-cache-tests PROPERTIES LINKER_LANGUAGE CXX)
    target_link_libraries(tower-module-cache-tests PRIVATE ${libraries})
    target_link_options(tower-module-cache-tests PRIVATE
      -Wl,--export-dynamic-symbol=work_thread_entry
      -Wl,--export-dynamic-symbol=backend_register_targets
      -Wl,--export-dynamic-symbol=backend_thread_entry)
    add_test(NAME tower-module-cache-regressions COMMAND tower-module-cache-tests)
    set_tests_properties(tower-module-cache-regressions PROPERTIES
      WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" TIMEOUT 180)
  endif()

  if(triple MATCHES "^x86_64-.*linux")
    # This entry owns wrapper initialization and the real compiler providers.
    # Supplying both transport objects prevents extraction of the default host
    # archive member; the normal production allocator remains in use.
    tower_runtime_object(semantic-dispatch-checks
      "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/semantic_dispatch_checks.tower" "${triple}"
      SOURCE __wrap_work_signal_open work_signal_open)
    add_executable(tower-semantic-dispatch-tests ${sources}
      "${semantic-dispatch-checks_OBJECT}" "${work-dispatch-transport_OBJECT}" "${host_work_dispatch_OBJECT}")
    set_target_properties(tower-semantic-dispatch-tests PROPERTIES LINKER_LANGUAGE CXX)
    target_link_libraries(tower-semantic-dispatch-tests PRIVATE ${libraries})
    foreach(mode IN ITEMS default admission source)
      set(mode_arguments)
      if(NOT mode STREQUAL "default")
        set(mode_arguments "${mode}")
      endif()
      add_test(NAME tower-semantic-dispatch-${mode} COMMAND tower-semantic-dispatch-tests ${mode_arguments})
      set_tests_properties(tower-semantic-dispatch-${mode} PROPERTIES TIMEOUT 60)
    endforeach()
    # Explicit clock/rusage measurement using this same compiler closure.
    # No default build, CTest registration or timing pass threshold.
    tower_runtime_object(semantic-layout-profile
      "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/semantic_layout_profile.tower" "${triple}")
    get_property(profile_runtime GLOBAL PROPERTY TOWER_GUEST_work-tests_OBJECT)
    add_executable(tower-semantic-layout-profile EXCLUDE_FROM_ALL
      ${sources} "${semantic-layout-profile_OBJECT}" "${profile_runtime}")
    set_target_properties(tower-semantic-layout-profile PROPERTIES LINKER_LANGUAGE CXX)
    target_link_libraries(tower-semantic-layout-profile PRIVATE ${libraries})
    target_link_options(tower-semantic-layout-profile PRIVATE -Wl,--export-dynamic-symbol=work_thread_entry)
    add_custom_target(tower-measure-semantic-layout
      COMMAND "$<TARGET_FILE:tower-semantic-layout-profile>"
      DEPENDS tower-semantic-layout-profile USES_TERMINAL VERBATIM)

    # These entries own main and use the production compiler closure directly.
    # No instrumented allocator, serial override or test-only named callback.
    foreach(unit IN ITEMS frontend_units module_cache)
      string(REPLACE "_" "-" name "${unit}")
      set(profile_target "tower-${name}-profile")
      tower_runtime_object(${profile_target}
        "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/${unit}_profile.tower" "${triple}")
      add_executable(${profile_target} EXCLUDE_FROM_ALL
        ${sources} "${${profile_target}_OBJECT}")
      set_target_properties(${profile_target} PROPERTIES LINKER_LANGUAGE CXX)
      target_link_libraries(${profile_target} PRIVATE ${libraries})
      target_link_options(${profile_target} PRIVATE
        -Wl,--export-dynamic-symbol=work_thread_entry
        -Wl,--export-dynamic-symbol=backend_register_targets
        -Wl,--export-dynamic-symbol=backend_thread_entry)
    endforeach()
    add_custom_target(tower-measure-frontend-units
      COMMAND "$<TARGET_FILE:tower-frontend-units-profile>"
        "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding" 3 2 0
      DEPENDS tower-frontend-units-profile USES_TERMINAL VERBATIM)
    add_custom_target(tower-measure-module-cache
      COMMAND "$<TARGET_FILE:tower-module-cache-profile>"
      DEPENDS tower-module-cache-profile USES_TERMINAL VERBATIM)
  endif()
endfunction()
cmake_language(DEFER CALL tower_lr_work_policy_test)
