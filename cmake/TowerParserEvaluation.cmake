# Compile-only fixtures need the ordinary invocation evaluator used by semantic
# compile-time execution. Execution fixtures already supply their full host.
tower_compiler_evaluation()
get_property(parser_evaluation_targets DIRECTORY PROPERTY BUILDSYSTEM_TARGETS)
foreach(target IN LISTS parser_evaluation_targets)
  get_target_property(kind ${target} TYPE)
  if(NOT kind STREQUAL "EXECUTABLE")
    continue()
  endif()
  get_target_property(libraries ${target} LINK_LIBRARIES)
  if("tower-compiler-semantics" IN_LIST libraries
      AND NOT "tower-compiler-interpreter" IN_LIST libraries
      AND NOT "tower-compiler-evaluation" IN_LIST libraries)
    target_link_libraries(${target} PRIVATE tower-compiler-evaluation)
  endif()
endforeach()
