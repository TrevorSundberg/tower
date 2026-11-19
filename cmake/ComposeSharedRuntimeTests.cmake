include("${CMAKE_CURRENT_LIST_DIR}/TowerModule.cmake")
tower_import("${ROOT}/scaffolding/compiler/foundation-types.tower")
tower_import("${ROOT}/scaffolding/tests/shared-entities.tower")
file(WRITE "${OUTPUT}" "${source}")
