include("${CMAKE_CURRENT_LIST_DIR}/TowerModule.cmake")
tower_import("${ROOT}/scaffolding/compiler/interpreter.tower")
tower_import("${ROOT}/scaffolding/host/invocation_execution.tower")
file(WRITE "${OUTPUT}" "${source}")
