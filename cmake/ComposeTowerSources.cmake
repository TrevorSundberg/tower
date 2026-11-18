# Temporary source composition until Tower imports exist. Preserve declaration order.
file(READ "${ENTITIES}" entities)
file(READ "${PARSER}" parser)
file(READ "${GENERICS}" generics)
file(WRITE "${OUTPUT}" "${entities}\n${parser}\n${generics}")
