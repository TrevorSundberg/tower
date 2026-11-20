include("${CMAKE_CURRENT_LIST_DIR}/TowerModule.cmake")
tower_import("${ROOT}/scaffolding/compiler/foundation_types.tower")
tower_import("${ROOT}/scaffolding/tests/shared_entities.tower")
file(WRITE "${OUTPUT}" "${source}")
