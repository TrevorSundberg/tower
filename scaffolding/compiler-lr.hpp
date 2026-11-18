#pragma once
#include <cstddef>
#include <cstdint>

// Private, disposable LR analysis indexes. Grammar entities remain authoritative.
// All indices use the current grammar's production/symbol order.
struct LRProduction { size_t owner, begin, count; };
struct LRSymbol { size_t nonterminal; uint32_t first, last; };
struct LRItem { size_t rule, position; uint32_t first, last; };
struct SymbolRange { uint32_t first, last; };
struct LRTransition { size_t symbol, state; };
struct LRAction { uint32_t first, last; size_t rule, state; };
struct LRGoto { size_t nonterminal, state; };
struct LRConflict { size_t state; LRAction left, right; };
struct LRRuntime;
struct LRAnalysis;
struct LRItems;
struct LRPropagation;
struct LRStates;
extern "C" {
LRAnalysis* lr_analysis_create(const LRProduction*, size_t, const LRSymbol*, size_t, size_t);
void lr_analysis_destroy(LRAnalysis*);
bool lr_analysis_compute(LRAnalysis*);
bool lr_analysis_failed(LRAnalysis*);
void lr_analysis_order(LRAnalysis*, size_t, size_t);
bool lr_analysis_nullable(LRAnalysis*, size_t);
size_t lr_analysis_first_count(LRAnalysis*, size_t);
const SymbolRange* lr_analysis_first_data(LRAnalysis*, size_t);
LRItems* lr_items_create();
void lr_items_destroy(LRItems*);
bool lr_items_insert(LRItems*, const LRItem*);
size_t lr_items_count(LRItems*);
const LRItem* lr_items_data(LRItems*);
bool lr_items_close(LRAnalysis*, LRItems*, bool);
bool lr_items_goto(LRAnalysis*, LRItems*, const LRSymbol*, LRItems*, bool);
LRPropagation* lr_propagation_create(size_t);
void lr_propagation_destroy(LRPropagation*);
bool lr_propagation_seed(LRPropagation*, size_t, uint32_t, uint32_t);
bool lr_propagation_edge(LRPropagation*, size_t, size_t);
bool lr_propagation_solve(LRPropagation*);
size_t lr_propagation_count(LRPropagation*, size_t);
const SymbolRange* lr_propagation_data(LRPropagation*, size_t);
LRStates* lr_states_create(LRAnalysis*);
void lr_states_destroy(LRStates*);
size_t lr_states_count(LRStates*);
LRItems* lr_states_items(LRStates*, size_t);
size_t lr_states_origin(LRStates*, size_t);
size_t lr_states_edge_count(LRStates*, size_t);
const LRTransition* lr_states_edges(LRStates*, size_t);
bool lr_states_lalr(LRStates*, bool);
size_t lr_states_action_count(LRStates*, size_t);
const LRAction* lr_states_actions(LRStates*, size_t);
LRRuntime* lr_runtime_create(LRStates*);
void lr_runtime_destroy(LRRuntime*);
bool lr_runtime_conflict(LRRuntime*, LRConflict*);
size_t lr_runtime_row_count(LRRuntime*);
size_t lr_runtime_action_count(LRRuntime*, size_t);
const LRAction* lr_runtime_actions(LRRuntime*, size_t);
size_t lr_runtime_default(LRRuntime*, size_t);
bool lr_runtime_action(LRRuntime*, size_t, uint32_t, LRAction*);
size_t lr_runtime_goto_count(LRRuntime*, size_t);
const LRGoto* lr_runtime_goto_data(LRRuntime*, size_t);
size_t lr_runtime_goto(LRRuntime*, size_t, size_t);
}
