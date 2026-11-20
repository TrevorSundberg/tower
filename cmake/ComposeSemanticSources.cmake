include("${CMAKE_CURRENT_LIST_DIR}/TowerModule.cmake")
tower_import("${ROOT}/scaffolding/compiler/services.tower")
file(WRITE "${OUTPUT}" "${source}")
