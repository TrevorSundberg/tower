# Last compatibility adapters, implemented in Tower on the shared entity store.
tower_runtime_object(tower-compiler-legacy "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/host/legacy.tower" "${triple}")
set(legacy_profile compiler-host)
if(TOWER_PARSER_ONLY OR TOWER_BROWSER OR NOT CMAKE_BUILD_TYPE MATCHES "^(Release|RelWithDebInfo|MinSizeRel)$")
  set(legacy_profile compiler-host-debug)
endif()
tower_runtime_object(runtime-legacy-storage "${CMAKE_CURRENT_SOURCE_DIR}/scaffolding/host/legacy_storage.tower"
  "${triple}" --state ${legacy_profile})
target_sources(tower-compiler-entities INTERFACE "${tower-compiler-legacy_OBJECT}" "${runtime-legacy-storage_OBJECT}")
