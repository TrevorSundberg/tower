# Temporary composition until Tower imports exist. Templates precede their users.
file(READ "${VECTOR}" vector)
file(READ "${PAYLOADS}" payloads)
file(READ "${LEXER}" lexer)
file(WRITE "${OUTPUT}" "${vector}\n${payloads}\n${lexer}")
