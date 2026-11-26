if(TOWER_WORK_TESTS AND TOWER_NATIVE AND CMAKE_SYSTEM_NAME STREQUAL "Linux")
  get_property(work_triple GLOBAL PROPERTY TOWER_COMPILER_TRIPLE)
  tower_guest_runtime(work-tests "${work_triple}" posix OFF)
  get_property(work_runtime GLOBAL PROPERTY TOWER_GUEST_work-tests_OBJECT)
  set(work_objects)
  foreach(unit IN ITEMS tests/work_pool host/work_linux host/work_dispatch)
    string(REPLACE "/" "_" work_name "${unit}")
    tower_runtime_object(${work_name} "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/${unit}.tower" "${work_triple}")
    list(APPEND work_objects "${${work_name}_OBJECT}")
  endforeach()
  add_executable(tower-work-tests ${work_objects} "${work_runtime}")
  set_target_properties(tower-work-tests PROPERTIES LINKER_LANGUAGE C)
  find_package(Threads REQUIRED)
  target_link_libraries(tower-work-tests PRIVATE Threads::Threads ${CMAKE_DL_LIBS})
  target_link_options(tower-work-tests PRIVATE -Wl,--export-dynamic-symbol=work_thread_entry)
  enable_testing()
  add_test(NAME tower-worker-overlap COMMAND tower-work-tests)
  set_tests_properties(tower-worker-overlap PROPERTIES TIMEOUT 30 SKIP_RETURN_CODE 77)

  # These Tower fixtures include their own production transport when needed.
  # Share the ordinary object/runtime rules so sanitizer mode covers both.
  if(work_triple MATCHES "^x86_64-.*linux")
    tower_runtime_object(work-dispatch-transport
      "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/host/work_linux.tower" "${work_triple}"
      work_signal_open __real_work_signal_open)
    # The public linker accepts objects. Apply GNU --wrap to the production
    # transport's undefined references before either test entry links it.
    set(affinity_transport "${CMAKE_CURRENT_BINARY_DIR}/work_linux_affinity_wrapped.o")
    add_custom_command(OUTPUT "${affinity_transport}"
      COMMAND "${CMAKE_LINKER}" -r --wrap=sched_getaffinity
        --wrap=compiler_buffer_allocate --wrap=compiler_buffer_free
        "${host_work_linux_OBJECT}" -o "${affinity_transport}"
      DEPENDS "${host_work_linux_OBJECT}" VERBATIM)

    function(tower_work_fixture unit profile)
      string(REPLACE "_" "-" target "tower-${unit}-tests")
      set(fixture_input "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/${unit}.tower")
      set(fixture_mode)
      if(unit STREQUAL "work_ready")
        set(fixture_input "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/${unit}_main.tower")
      elseif(unit STREQUAL "work_dispatch_result")
        set(fixture_mode SOURCE __wrap_work_signal_open work_signal_open)
      elseif(unit STREQUAL "work_linux_affinity_faults")
        set(fixture_input "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/${unit}_main.tower")
        set(fixture_mode SOURCE)
      endif()
      tower_runtime_object(${target} "${fixture_input}" "${work_triple}" ${fixture_mode})
      set(fixture_objects "${${target}_OBJECT}")
      if(unit STREQUAL "work_budget_shared")
        list(APPEND fixture_objects "${host_work_linux_OBJECT}")
      elseif(unit STREQUAL "work_arena_linkage")
        tower_runtime_object(work-arena-link-provider
          "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/library/work_arena.tower" "${work_triple}")
        list(APPEND fixture_objects "${work-arena-link-provider_OBJECT}")
      elseif(unit STREQUAL "entity_create_result")
        list(APPEND fixture_objects "${entity-create-provider_OBJECT}" "${host_memory_OBJECT}")
      elseif(unit STREQUAL "work_dispatch_result")
        list(APPEND fixture_objects "${work-dispatch-transport_OBJECT}" "${host_work_dispatch_OBJECT}")
      elseif(unit STREQUAL "work_linux_affinity_faults")
        list(APPEND fixture_objects "${affinity_transport}")
      endif()
      add_executable(${target} ${fixture_objects} "${work_runtime}")
      set_target_properties(${target} PROPERTIES LINKER_LANGUAGE C)
      target_link_libraries(${target} PRIVATE Threads::Threads ${CMAKE_DL_LIBS})
      if(unit MATCHES "^(work_budget_shared|work_kernel_|work_(buffer|arena)_(shared|profile)$|entity_(stage_concurrent|component_budget)$|work_(dispatch_result|schedule_budget)$|work_linux_affinity$)")
        target_link_options(${target} PRIVATE -Wl,--export-dynamic-symbol=work_thread_entry)
      endif()
      if(unit STREQUAL "work_kernel_admission")
        target_link_options(${target} PRIVATE -Wl,--export-dynamic-symbol=admission_named_entry)
      elseif(unit STREQUAL "work_signal_observe")
        target_link_options(${target} PRIVATE -Wl,--export-dynamic-symbol=signal_observer_entry)
      endif()
      if(profile)
        set_target_properties(${target} PROPERTIES EXCLUDE_FROM_ALL TRUE)
        string(REPLACE "_" "-" measurement "tower-measure-${unit}")
        add_custom_target(${measurement}
          COMMAND "$<TARGET_FILE:${target}>" ${ARGN} DEPENDS ${target} USES_TERMINAL VERBATIM)
      elseif(unit STREQUAL "work_signal_observe")
        foreach(mode IN ITEMS try wait)
          add_test(NAME ${target}-${mode} COMMAND ${target} ${mode})
          set_tests_properties(${target}-${mode} PROPERTIES TIMEOUT 30)
        endforeach()
      else()
        add_test(NAME ${target} COMMAND ${target})
        set_tests_properties(${target} PROPERTIES TIMEOUT 30)
      endif()
    endfunction()
    foreach(unit IN ITEMS work_ready work_budget work_budget_shared work_kernel_admission tool_output_identity work_signal_observe work_linux_affinity work_linux_affinity_faults entity_stage_concurrent entity_stage_result entity_page_reuse entity_page_property entity_stage_reentrant entity_attach_leases work_buffer work_buffer_shared work_arena work_arena_shared work_arena_linkage work_dispatch_result work_constructor_budget work_schedule_budget entity_component_budget entity_component_layout)
      tower_work_fixture(${unit} OFF)
    endforeach()
    # Linux x64 clock/rusage microbenchmarks check their outputs but have no
    # timing pass threshold and run only when explicitly requested.
    foreach(unit IN ITEMS work_select work_budget_profile work_kernel_overhead work_kernel_profile)
      tower_work_fixture(${unit} ON)
    endforeach()
    tower_work_fixture(work_buffer_profile ON budget 1)
    tower_work_fixture(work_arena_profile ON arena16 1 large)
    # Explicitly requested accounting gate: current raw descriptors bypass the
    # finite ledger. Keep that failure separate from the passing census/profile.
    tower_work_fixture(entity_accounting ON profile)
    tower_work_fixture(entity_locality ON layout mixed direct)
    add_custom_target(tower-check-entity-accounting-cap
      COMMAND "$<TARGET_FILE:tower-entity-accounting-tests>" cap
      DEPENDS tower-entity-accounting-tests USES_TERMINAL VERBATIM)
  endif()
  set(target_once_objects)
  tower_target_registry_runtime("${work_triple}")
  get_property(target_registry_runtime GLOBAL PROPERTY TOWER_TARGET_REGISTRY_RUNTIME)
  foreach(unit IN ITEMS tests/target_once backend/target_once_linux)
    string(REPLACE "/" "_" once_name "${unit}")
    tower_runtime_object(${once_name} "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/${unit}.tower" "${work_triple}")
    list(APPEND target_once_objects "${${once_name}_OBJECT}")
  endforeach()
  add_executable(tower-target-once-tests ${target_once_objects}
    "${target_registry_runtime}"
    "${CMAKE_CURRENT_BINARY_DIR}/host_work_linux.o" "${CMAKE_CURRENT_BINARY_DIR}/host_work_dispatch.o" "${work_runtime}")
  set_target_properties(tower-target-once-tests PROPERTIES LINKER_LANGUAGE C)
  target_link_libraries(tower-target-once-tests PRIVATE Threads::Threads ${CMAKE_DL_LIBS})
  target_link_options(tower-target-once-tests PRIVATE
    -Wl,--export-dynamic-symbol=work_thread_entry -Wl,--export-dynamic-symbol=backend_register_targets)
  add_test(NAME tower-target-registry-once COMMAND tower-target-once-tests)
  set_tests_properties(tower-target-registry-once PROPERTIES TIMEOUT 30 SKIP_RETURN_CODE 77)
  include("${CMAKE_CURRENT_LIST_DIR}/TowerWorkPolicyTests.cmake")
  if(TOWER_SANITIZER STREQUAL "thread")
    # Deliberately invalid sensitivity control: explicit target only, never an
    # ordinary passing CTest. The unchanged probe needs the buffer provider.
    tower_guest_runtime(sanitizer-race "${work_triple}" posix ON)
    get_property(race_runtime GLOBAL PROPERTY TOWER_GUEST_sanitizer-race_OBJECT)
    tower_runtime_object(sanitizer-race-probe
      "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/sanitizer_race_probe.tower" "${work_triple}" SOURCE)
    add_executable(tower-sanitizer-race-control EXCLUDE_FROM_ALL
      "${sanitizer-race-probe_OBJECT}" "${host_memory_OBJECT}" "${race_runtime}")
    set_target_properties(tower-sanitizer-race-control PROPERTIES LINKER_LANGUAGE C)
    target_link_libraries(tower-sanitizer-race-control PRIVATE Threads::Threads ${CMAKE_DL_LIBS})
    target_link_options(tower-sanitizer-race-control PRIVATE -Wl,--export-dynamic-symbol=work_thread_entry)
  endif()
  if(NOT CMAKE_CROSSCOMPILING AND NOT TOWER_SANITIZER AND work_triple MATCHES "^x86_64-.*linux.*gnu")
    # Work-policy registration supplies the public native-test guest and count checker.
    get_property(work_guest GLOBAL PROPERTY TOWER_GUEST_native-test_OBJECT)
    set(work_guest_args --test-native-runtime "${work_guest}")
    set(work_allocator "${CMAKE_CURRENT_BINARY_DIR}/runtime-allocate.o")
    add_custom_target(tower-work-native-test-support DEPENDS "${work_allocator}"
      tower-guest-native-test tower-selected-test-count)
    function(tower_work_native_selections suite unit owner_summary direct_summary)
      add_dependencies(tower-${suite}-tests tower-work-native-test-support)
      foreach(selection IN ITEMS owner direct)
        set(entry "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/${unit}.tower")
        set(summary "${owner_summary}")
        if(selection STREQUAL "direct")
          set(entry "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/${unit}_test.tower")
          set(summary "${direct_summary}")
        endif()
        foreach(jobs IN ITEMS 1 4)
          set(name "tower-${suite}-${selection}-jobs-${jobs}")
          add_test(NAME "${name}" COMMAND tower-selected-test-count "${summary} passed for ${entry}"
            "${TOWER_BOOTSTRAP_COMPILER}" --test "${entry}" --jobs "${jobs}" --test-details
            ${ARGN} --link "${work_allocator}")
          set_tests_properties("${name}" PROPERTIES LABELS "native;focused" TIMEOUT 60)
        endforeach()
      endforeach()
    endfunction()
    # Ready owner discovery includes eight graph and five budget declarations.
    tower_work_native_selections(work-ready work_ready "18 tests" "5 tests" ${work_guest_args})
    tower_work_native_selections(work-schedule-budget work_schedule_budget_fixture "19 tests" "6 tests" ${work_guest_args})
    set(affinity_oracle "${CMAKE_CURRENT_BINARY_DIR}/work_linux_affinity_faults.stdout")
    file(GENERATE OUTPUT "${affinity_oracle}" CONTENT "412\n544\n0\n")
    add_custom_target(tower-affinity-test-support DEPENDS tower-work-native-test-support)
    tower_work_native_selections(work-linux-affinity-faults work_linux_affinity_faults "6 tests" "1 test"
      --test-oracle "${affinity_oracle}" ${work_guest_args} --link "${affinity_transport}")
  endif()
  if(work_triple MATCHES "^x86_64-.*linux")
    tower_work_fixture(entity_create_result OFF)
  endif()
endif()

if(TOWER_WORK_TESTS AND TOWER_BROWSER_THREADS)
  tower_runtime_object(tower-lr-budget-checks "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/lr_budget.tower" wasm32-unknown-unknown)
  target_sources(tower-browser PRIVATE "${tower-lr-budget-checks_OBJECT}")
  set(work_input "${CMAKE_CURRENT_BINARY_DIR}/tower_work_tests.tower")
  file(GENERATE OUTPUT "${work_input}" CONTENT
    "import tower;\nimport tests.work_pool;\nimport host.work_wasi;\nimport host.work_memory_wasi;\nimport host.work_dispatch;\nimport host.memory;\n")
  tower_runtime_object(tower-work-tests "${work_input}" wasm32-unknown-unknown)
  add_executable(tower-work-tests "${tower-work-tests_OBJECT}"
    "${CMAKE_CURRENT_BINARY_DIR}/runtime-allocate.o" "${CMAKE_CURRENT_BINARY_DIR}/runtime-trap.o")
  set_target_properties(tower-work-tests PROPERTIES LINKER_LANGUAGE C SUFFIX .wasm)
  target_link_options(tower-work-tests PRIVATE -mexec-model=reactor
    -Wl,--export=work_thread_entry -Wl,--export-table -Wl,--growable-table
    -Wl,--initial-memory=8388608 -Wl,--max-memory=2147483648
    "-Wl,--allow-undefined-file=${CMAKE_CURRENT_SOURCE_DIR}/cmake/WorkImports.txt")
endif()
if(TARGET towerc)
  function(tower_companion_test name fixture workers)
    add_test(NAME ${name}-${workers}
      COMMAND $<TARGET_FILE:towerc> "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/${fixture}"
        --test --test-details --jobs ${workers}
        --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
        --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower" ${ARGN})
    set_tests_properties(${name}-${workers} PROPERTIES FAIL_REGULAR_EXPRESSION "0 tests selected")
  endfunction()
  add_test(NAME tower-semantic-iteration-companions
    COMMAND $<TARGET_FILE:towerc> --test
      "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/semantic_iteration.tower"
      --test-details --jobs 4
      --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
      --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower")
  set_tests_properties(tower-semantic-iteration-companions PROPERTIES
    FAIL_REGULAR_EXPRESSION "0 tests selected")
  set(output_cases generation-layout-frontier generic-cast-inference generic-pointer-alias type-return-dependencies
    type_numeric_composition nominal_wrapper_known numeric_wrapper_minimal numeric_wrapper_known token_text)
  foreach(workers IN ITEMS 1 4)
    tower_companion_test(tower-fixture-diagnostics tests/fixture_diagnostics.tower ${workers})
    tower_companion_test(tower-borrowed-foreach tests/iteration_parallel_unit.tower ${workers})
    foreach(fixture IN ITEMS operators null_operators compound_operators)
      tower_companion_test(tower-${fixture}-owner tests/${fixture}.tower ${workers})
      tower_companion_test(tower-${fixture}-direct tests/${fixture}_test.tower ${workers})
    endforeach()
    add_test(NAME tower-parser-precedence-${workers}
      COMMAND $<TARGET_FILE:towerc> --test
        "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/lr_runtime.tower"
        --test-details --jobs ${workers})
    set_tests_properties(tower-parser-precedence-${workers} PROPERTIES
      FAIL_REGULAR_EXPRESSION "0 tests selected")
    foreach(entry IN ITEMS owner direct)
      if(entry STREQUAL "owner")
        set(fixture work_graph)
        set(count 13) # Eight graph tests plus five budget tests.
      else()
        set(fixture work_graph_test)
        set(count 8)
      endif()
      set(input "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/library/${fixture}.tower")
      add_test(NAME tower-work-resume-${entry}-${workers}
        COMMAND "${CMAKE_COMMAND}" "-DTOWER_COMPILER=$<TARGET_FILE:towerc>"
          "-DTOWER_INPUT=${input}" "-DTOWER_WORKERS=${workers}" "-DTOWER_RESOURCES=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding"
          "-DTOWER_TEST_SUFFIX=_test.tower" "-DTOWER_FINAL_LINE=${count} tests passed for ${input}"
          -P "${CMAKE_CURRENT_SOURCE_DIR}/cmake/TowerTestOutput.cmake")
    endforeach()

    add_test(NAME tower-counted-loops-${workers}
      COMMAND $<TARGET_FILE:towerc> --test
        "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/semantic_control_test.tower"
        --test-details --jobs ${workers})
    set_tests_properties(tower-counted-loops-${workers} PROPERTIES
      FAIL_REGULAR_EXPRESSION "0 tests selected")
    add_test(NAME tower-utf8-companion-${workers}
      COMMAND $<TARGET_FILE:towerc> --test --test-details --jobs ${workers}
        "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/utf8.tower")
    set_tests_properties(tower-utf8-companion-${workers} PROPERTIES
      FAIL_REGULAR_EXPRESSION "0 tests selected")
    set(location_owner "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/syntax_source_cases/snapshot.tower")
    add_test(NAME tower-source-location-${workers}
      COMMAND "${CMAKE_COMMAND}" "-DTOWER_COMPILER=$<TARGET_FILE:towerc>"
        "-DTOWER_INPUT=${location_owner}" "-DTOWER_WORKERS=${workers}" "-DTOWER_RESOURCES=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding"
        "-DTOWER_TEST_SUFFIX=_test.tower" "-DTOWER_FINAL_LINE=1 test passed for ${location_owner}"
        -P "${CMAKE_CURRENT_SOURCE_DIR}/cmake/TowerTestOutput.cmake")
    tower_companion_test(tower-struct-field-values compiler/semantic_values_test.tower ${workers})
    tower_companion_test(tower-bytecode-package compiler/bytecode_package.tower ${workers})
    tower_companion_test(tower-inference-types compiler/semantic_types_test.tower ${workers})
    tower_companion_test(tower-generic-call-inference compiler/semantic_call_inference_test.tower ${workers})
    tower_companion_test(tower-decltype-lazy-body tests/decltype_lazy_body.tower ${workers})
    tower_companion_test(tower-decltype-field-types tests/decltype_type_fields.tower ${workers})
    tower_companion_test(tower-template-specializations compiler/generics_test.tower ${workers})
    tower_companion_test(tower-forward-bindings tests/forward.tower ${workers})
    add_test(NAME tower-semantic-defer-companion-${workers}
      COMMAND $<TARGET_FILE:towerc> --test --test-details --jobs ${workers}
        "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/semantic_defer.tower"
        --bedrock "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/bedrock.tower"
        --foundation "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/foundation.tower")
    set_tests_properties(tower-semantic-defer-companion-${workers} PROPERTIES
      FAIL_REGULAR_EXPRESSION "0 tests selected")
    # Run these two explicit test blocks with just their own imports.
    # The owner regression above uses the default _test.tower discovery rule.
    tower_companion_test(tower-fixed-array-iteration compiler/semantic_iteration_test.tower ${workers} --test-suffix _spec.tower)
    tower_companion_test(tower-generic-body-copy-types compiler/generic_body_types_test.tower ${workers})
    tower_companion_test(tower-semantic-layout-registry compiler/semantic_layout_test.tower ${workers} --test-suffix _spec.tower)
    tower_companion_test(tower-default-initialization compiler/semantic_expressions_test.tower ${workers})
    set(aggregate_suite "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/compiler/semantic_aggregates_test.tower")
    add_test(NAME tower-named_initialization_test-${workers}
      COMMAND "${CMAKE_COMMAND}" "-DTOWER_COMPILER=$<TARGET_FILE:towerc>"
        "-DTOWER_INPUT=${aggregate_suite}" "-DTOWER_WORKERS=${workers}"
        "-DTOWER_RESOURCES=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding"
        "-DTOWER_TEST_SUFFIX=_spec.tower" "-DTOWER_FINAL_LINE=6 tests passed for ${aggregate_suite}"
        -P "${CMAKE_CURRENT_SOURCE_DIR}/cmake/TowerTestOutput.cmake")
    foreach(name IN ITEMS ${output_cases} decltype_type_fields alias_type_query_controls module_loop_queries
        module_header_capture_controls)
      string(REPLACE "-" "_" fixture "${name}")
      set(input "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/tests/${fixture}")
      set(expected)
      if(name IN_LIST output_cases)
        set(expected "-DTOWER_EXPECTED=${input}.expected")
      endif()
      add_test(NAME tower-${name}-${workers}
        COMMAND "${CMAKE_COMMAND}"
          "-DTOWER_COMPILER=$<TARGET_FILE:towerc>"
          "-DTOWER_INPUT=${input}.tower"
          "-DTOWER_WORKERS=${workers}"
          "-DTOWER_RESOURCES=${CMAKE_CURRENT_SOURCE_DIR}/scaffolding"
          ${expected} -P "${CMAKE_CURRENT_SOURCE_DIR}/cmake/TowerTestOutput.cmake")
    endforeach()
  endforeach()
endif()
