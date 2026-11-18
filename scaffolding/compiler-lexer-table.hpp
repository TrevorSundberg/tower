#pragma once
#include <cstddef>
#include <cstdint>
struct LexerTable;
extern "C" {
LexerTable* lex_table_create();
void lex_table_destroy(LexerTable* table);
bool lex_table_set_alphabet(LexerTable* table, const uint32_t* values, size_t count);
bool lex_table_append(LexerTable* table, const int32_t* transitions, size_t count, bool accepting);
size_t lex_table_match(LexerTable* table, const uint8_t* source, size_t length, size_t start);
}
