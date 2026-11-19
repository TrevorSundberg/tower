# Generate a module manifest. Tower owns dependency discovery, ordering, parsing,
# identity and diagnostics; CMake selects the platform's implementation modules.
set(source "import tower;\n")
function(tower_import path)
  get_filename_component(directory "${OUTPUT}" DIRECTORY)
  get_filename_component(absolute "${path}" ABSOLUTE)
  file(RELATIVE_PATH name "${directory}" "${absolute}")
  string(REGEX REPLACE "\\.tower$" "" name "${name}")
  set(source "${source}import \"${name}\";\n" PARENT_SCOPE)
endfunction()
