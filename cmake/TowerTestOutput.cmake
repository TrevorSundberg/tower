# Capture exact-output cases to files. CMake string capture can normalize newlines
# and discard NUL bytes. Keep stdout and stderr separate even when the child fails.
foreach(required IN ITEMS TOWER_COMPILER TOWER_INPUT TOWER_WORKERS TOWER_RESOURCES)
  if(NOT DEFINED ${required} OR "${${required}}" STREQUAL "")
    message(FATAL_ERROR "Missing ${required} for the interpreter fixture")
  endif()
endforeach()
if(DEFINED TOWER_EXPECTED)
  get_filename_component(fixture "${TOWER_INPUT}" NAME)
  set(capture "${CMAKE_CURRENT_BINARY_DIR}/Testing/Temporary/${fixture}-${TOWER_WORKERS}")
  file(MAKE_DIRECTORY "${capture}")
  file(LOCK "${capture}" DIRECTORY)
  set(streams OUTPUT_FILE "${capture}/stdout" ERROR_FILE "${capture}/stderr")
else()
  set(streams OUTPUT_VARIABLE output ERROR_VARIABLE error)
endif()
execute_process(COMMAND "${TOWER_COMPILER}" "${TOWER_INPUT}"
  --interpret --jobs "${TOWER_WORKERS}"
  --bedrock "${TOWER_RESOURCES}/bedrock.tower"
  --foundation "${TOWER_RESOURCES}/foundation.tower"
  RESULT_VARIABLE result ${streams})
if(DEFINED TOWER_EXPECTED)
  execute_process(COMMAND "${CMAKE_COMMAND}" -E compare_files "${TOWER_EXPECTED}" "${capture}/stdout"
    RESULT_VARIABLE difference)
  file(SIZE "${capture}/stderr" error_bytes)
  if(NOT result STREQUAL "0" OR NOT difference STREQUAL "0" OR NOT error_bytes EQUAL 0)
    message(FATAL_ERROR "${fixture} (--jobs ${TOWER_WORKERS}): exit=${result}, stdout comparison=${difference}, stderr bytes=${error_bytes}\nExpected: ${TOWER_EXPECTED}\nCaptured: ${capture}/stdout and ${capture}/stderr")
  endif()
elseif(NOT result STREQUAL "0" OR NOT output MATCHES "^0\r?\n$" OR NOT error STREQUAL "")
  message(FATAL_ERROR "${TOWER_INPUT}: expected exit 0, exactly 0 plus newline, and empty stderr; exit=${result}\nstdout=[${output}]\nstderr=[${error}]")
endif()
