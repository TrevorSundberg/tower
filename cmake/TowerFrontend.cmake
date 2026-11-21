# Task 1 source ownership. Keep registration isolated from host/package work.
set(TOWER_FRONTEND_SOURCES
  "${CMAKE_CURRENT_LIST_DIR}/../scaffolding/compiler/parser_state.tower"
  "${CMAKE_CURRENT_LIST_DIR}/../scaffolding/compiler/frontend_table.tower"
  "${CMAKE_CURRENT_LIST_DIR}/../scaffolding/compiler/frontend_diagnostics.tower"
  "${CMAKE_CURRENT_LIST_DIR}/../scaffolding/compiler/frontend_cache.tower"
  "${CMAKE_CURRENT_LIST_DIR}/../scaffolding/compiler/frontend_pattern.tower"
  "${CMAKE_CURRENT_LIST_DIR}/../scaffolding/compiler/frontend_bedrock.tower"
  "${CMAKE_CURRENT_LIST_DIR}/../scaffolding/compiler/frontend_world.tower"
  "${CMAKE_CURRENT_LIST_DIR}/../scaffolding/compiler/frontend_modules.tower"
  "${CMAKE_CURRENT_LIST_DIR}/../scaffolding/compiler/syntax_session_diagnostic.tower"
  "${CMAKE_CURRENT_LIST_DIR}/../scaffolding/compiler/syntax_session_next.tower")
