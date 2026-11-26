# Check the guest exit before accepting its selection summary. A passing-output
# regex on a CTest alone would also accept a nonzero exit with matching text.
execute_process(COMMAND "${TOWER_COMPILER}" "${TOWER_INPUT}"
  --test --test-details --jobs "${TOWER_WORKERS}" --test-suffix _spec.tower
  --bedrock "${TOWER_RESOURCES}/bedrock.tower"
  --foundation "${TOWER_RESOURCES}/foundation.tower"
  COMMAND_ECHO STDOUT RESULT_VARIABLE status
  OUTPUT_VARIABLE output ERROR_VARIABLE details ECHO_ERROR_VARIABLE)
if(NOT status STREQUAL "0" OR NOT output STREQUAL "")
  message(FATAL_ERROR "Test command exited ${status}. Guest stdout=[${output}]")
endif()
set(noun tests)
if(TOWER_EXPECTED_TESTS EQUAL 1)
  set(noun test)
endif()
set(summary "${TOWER_EXPECTED_TESTS} ${noun} passed for ${TOWER_INPUT}\n")
string(FIND "\n${details}" "\n${summary}" position)
if(position EQUAL -1)
  message(FATAL_ERROR "Expected the compiler to report: ${summary}")
endif()
