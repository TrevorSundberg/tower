# Process boundary for Tower fixtures whose complete successful output is zero.
# CTest PASS_REGULAR_EXPRESSION ignores nonzero process exits, so check both here.
foreach(required IN ITEMS TOWER_COMPILER TOWER_INPUT TOWER_WORKERS TOWER_RESOURCES)
  if(NOT DEFINED ${required} OR "${${required}}" STREQUAL "")
    message(FATAL_ERROR "Missing ${required} for the zero-output fixture")
  endif()
endforeach()
execute_process(COMMAND "${TOWER_COMPILER}" "${TOWER_INPUT}"
  --interpret --jobs "${TOWER_WORKERS}"
  --bedrock "${TOWER_RESOURCES}/bedrock.tower"
  --foundation "${TOWER_RESOURCES}/foundation.tower"
  RESULT_VARIABLE result OUTPUT_VARIABLE output ERROR_VARIABLE error)
if(NOT result STREQUAL "0" OR NOT output MATCHES "^0\r?\n$" OR NOT error STREQUAL "")
  message(FATAL_ERROR "${TOWER_INPUT}: expected exit 0, exactly 0 plus newline, and empty stderr; exit=${result}\nstdout=[${output}]\nstderr=[${error}]")
endif()
