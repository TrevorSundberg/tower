#pragma once
#include <cstddef>
#include <cstdint>
struct LexerTable;
struct SymbolSequence;
struct Automaton;
extern "C" {
Automaton* automaton_create(uint32_t symbol_limit);
void automaton_destroy(Automaton* value);
uint32_t automaton_error(Automaton* value);
int32_t automaton_add(Automaton* value, uint32_t kind, int32_t out, int32_t other, bool negated);
bool automaton_range(Automaton* value, int32_t index, uint32_t first, uint32_t last);
void automaton_patch(Automaton* value, int32_t index, bool other, int32_t target);
uint32_t automaton_compile(Automaton* value, int32_t start, size_t accepting, LexerTable* table, bool reject_empty);
SymbolSequence* symbol_sequence_create(size_t count);
void symbol_sequence_destroy(SymbolSequence* sequence);
void symbol_sequence_set(SymbolSequence* sequence, size_t state, uint32_t first, uint32_t last);
bool symbol_sequence_accepts(SymbolSequence* sequence, size_t state, uint32_t symbol);
LexerTable* lex_table_create();
void lex_table_destroy(LexerTable* table);
bool lex_table_set_alphabet(LexerTable* table, const uint32_t* values, size_t count);
bool lex_table_append(LexerTable* table, const int32_t* transitions, size_t count, bool accepting);
int32_t lex_table_step(LexerTable* table, size_t state, uint32_t symbol);
bool lex_table_accepts(LexerTable* table, size_t state);
size_t lex_table_match(LexerTable* table, const uint8_t* source, size_t length, size_t start);
}
