# Temporary composition until Tower imports exist. Templates precede their users.
file(READ "${VECTOR}" vector)
file(READ "${PAYLOADS}" payloads)
file(READ "${LEXER}" lexer)
file(READ "${REGEX}" regex)
file(READ "${AUTOMATON}" automaton)
file(READ "${LOWERING}" lowering)
file(WRITE "${OUTPUT}" "${vector}\n${payloads}\n${lexer}\n${regex}\n${automaton}\n${lowering}")
