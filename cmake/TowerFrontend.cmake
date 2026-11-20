# Task 1 source ownership. Keep registration isolated from host/package work.
set(TOWER_FRONTEND_SOURCES
  "${CMAKE_CURRENT_LIST_DIR}/../scaffolding/compiler/parser-state.tower"
  "${CMAKE_CURRENT_LIST_DIR}/../scaffolding/compiler/frontend-table.tower"
  "${CMAKE_CURRENT_LIST_DIR}/../scaffolding/compiler/frontend-diagnostics.tower"
  "${CMAKE_CURRENT_LIST_DIR}/../scaffolding/compiler/frontend-cache.tower"
  "${CMAKE_CURRENT_LIST_DIR}/../scaffolding/compiler/frontend-pattern.tower"
  "${CMAKE_CURRENT_LIST_DIR}/../scaffolding/compiler/frontend-bedrock.tower"
  "${CMAKE_CURRENT_LIST_DIR}/../scaffolding/compiler/frontend-modules.tower")
