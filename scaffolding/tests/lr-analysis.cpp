#include "../compiler-lr.hpp"
#include <cassert>
#include <cstring>
#include <random>
#include <vector>
#include <algorithm>
extern "C" {
LRAnalysis* reference_lr_analysis_create(const LRProduction*, size_t, const LRSymbol*, size_t, size_t);
void reference_lr_analysis_destroy(LRAnalysis*);
bool reference_lr_analysis_compute(LRAnalysis*);
void reference_lr_analysis_order(LRAnalysis*, size_t, size_t);
bool reference_lr_analysis_nullable(LRAnalysis*, size_t);
size_t reference_lr_analysis_first_count(LRAnalysis*, size_t);
const SymbolRange* reference_lr_analysis_first_data(LRAnalysis*, size_t);
LRItems* reference_lr_items_create();
void reference_lr_items_destroy(LRItems*);
bool reference_lr_items_insert(LRItems*, const LRItem*);
size_t reference_lr_items_count(LRItems*);
const LRItem* reference_lr_items_data(LRItems*);
bool reference_lr_items_close(LRAnalysis*, LRItems*, bool);
bool reference_lr_items_goto(LRAnalysis*, LRItems*, const LRSymbol*, LRItems*, bool);
LRPropagation* reference_lr_propagation_create(size_t);
void reference_lr_propagation_destroy(LRPropagation*);
bool reference_lr_propagation_seed(LRPropagation*, size_t, uint32_t, uint32_t);
bool reference_lr_propagation_edge(LRPropagation*, size_t, size_t);
bool reference_lr_propagation_solve(LRPropagation*);
size_t reference_lr_propagation_count(LRPropagation*, size_t);
const SymbolRange* reference_lr_propagation_data(LRPropagation*, size_t);
LRStates* reference_lr_states_create(LRAnalysis*);
void reference_lr_states_destroy(LRStates*);
size_t reference_lr_states_count(LRStates*);
LRItems* reference_lr_states_items(LRStates*, size_t);
size_t reference_lr_states_origin(LRStates*, size_t);
size_t reference_lr_states_edge_count(LRStates*, size_t);
const LRTransition* reference_lr_states_edges(LRStates*, size_t);
bool reference_lr_states_lalr(LRStates*, bool);
size_t reference_lr_states_action_count(LRStates*, size_t);
const LRAction* reference_lr_states_actions(LRStates*, size_t);
size_t tower_test_buffer_count();
void tower_test_buffer_fail_after(size_t);
}
namespace {
void compare_items(LRItems* a, LRItems* b) {
  assert(lr_items_count(a)==reference_lr_items_count(b));
  const auto* actual=lr_items_data(a); const auto* expected=reference_lr_items_data(b);
  for(size_t i=0;i<lr_items_count(a);++i) {
    assert(actual[i].rule==expected[i].rule && actual[i].position==expected[i].position);
    assert(actual[i].first==expected[i].first && actual[i].last==expected[i].last);
  }
}
void compare(const std::vector<LRProduction>& rules, const std::vector<LRSymbol>& symbols, size_t nonterminals) {
  auto* a=lr_analysis_create(rules.data(),rules.size(),symbols.data(),symbols.size(),nonterminals);
  auto* b=reference_lr_analysis_create(rules.data(),rules.size(),symbols.data(),symbols.size(),nonterminals);
  assert(a && b && lr_analysis_compute(a) && reference_lr_analysis_compute(b));
  // Exercise source-name order separately from the numeric nonterminal IDs.
  for(size_t n=0;n<nonterminals;++n) {
    lr_analysis_order(a,n,nonterminals-n-1); reference_lr_analysis_order(b,n,nonterminals-n-1);
  }
  for(size_t n=0;n<nonterminals;++n) {
    assert(lr_analysis_nullable(a,n)==reference_lr_analysis_nullable(b,n));
    assert(lr_analysis_first_count(a,n)==reference_lr_analysis_first_count(b,n));
    auto* ranges=lr_analysis_first_data(a,n); auto* reference=reference_lr_analysis_first_data(b,n);
    for(size_t i=0;i<lr_analysis_first_count(a,n);++i)
      assert(ranges[i].first==reference[i].first && ranges[i].last==reference[i].last);
  }
  for(bool lookahead:{false,true}) {
    auto* actual=lr_items_create(); auto* expected=reference_lr_items_create();
    // Seed every production at multiple positions, including reductions; cover
    // mutual recursion, epsilon cycles, nullable suffixes and disjoint ranges.
    for(size_t i=0;i<rules.size();++i) for(size_t p=0;p<=rules[i].count;p+=2) {
      LRItem item{i,p,lookahead ? uint32_t(0xfffffffdu-i) : 0,lookahead ? uint32_t(0xfffffffdu-i) : 0};
      assert(lr_items_insert(actual,&item)); assert(reference_lr_items_insert(expected,&item));
    }
    assert(lr_items_close(a,actual,lookahead)); assert(reference_lr_items_close(b,expected,lookahead));
    compare_items(actual,expected);
    // Closing a closed set and inserting duplicates must be idempotent.
    assert(lr_items_close(a,actual,lookahead)); compare_items(actual,expected);
    for(const auto& symbol:symbols) {
      auto* next=lr_items_create(); auto* reference=reference_lr_items_create();
      assert(lr_items_goto(a,actual,&symbol,next,lookahead));
      assert(reference_lr_items_goto(b,expected,&symbol,reference,lookahead));
      compare_items(next,reference);
      lr_items_destroy(next); reference_lr_items_destroy(reference);
    }
    lr_items_destroy(actual); reference_lr_items_destroy(expected);
  }
  auto* states=lr_states_create(a); auto* expected_states=reference_lr_states_create(b);
  assert(states && expected_states);
  assert(lr_states_lalr(states,false)); assert(reference_lr_states_lalr(expected_states,false));
  assert(lr_states_count(states)==reference_lr_states_count(expected_states));
  for(size_t i=0;i<lr_states_count(states);++i) {
    compare_items(lr_states_items(states,i),reference_lr_states_items(expected_states,i));
    assert(lr_states_origin(states,i)==reference_lr_states_origin(expected_states,i));
    assert(lr_states_edge_count(states,i)==reference_lr_states_edge_count(expected_states,i));
    auto* edges=lr_states_edges(states,i); auto* expected=reference_lr_states_edges(expected_states,i);
    for(size_t j=0;j<lr_states_edge_count(states,i);++j)
      assert(edges[j].symbol==expected[j].symbol && edges[j].state==expected[j].state);
    assert(lr_states_action_count(states,i)==reference_lr_states_action_count(expected_states,i));
    auto* actions=lr_states_actions(states,i); auto* reference_actions=reference_lr_states_actions(expected_states,i);
    for(size_t j=0;j<lr_states_action_count(states,i);++j) {
      const auto& a=actions[j]; const auto& b=reference_actions[j];
      assert(a.first==b.first && a.last==b.last && a.rule==b.rule && a.state==b.state);
    }
  }
  lr_states_destroy(states); reference_lr_states_destroy(expected_states);
  lr_analysis_destroy(a); reference_lr_analysis_destroy(b);
}
bool allocation_trial() {
  const LRProduction rules[]={{0,0,1},{1,1,3},{1,4,0},{2,4,1},{2,5,1}};
  const LRSymbol symbols[]={{1,0,0},{2,0,0},{1,0,0},{SIZE_MAX,100,200},{SIZE_MAX,0x200000,0x200004},{2,0,0}};
  auto* analysis=lr_analysis_create(rules,5,symbols,6,3);
  if(!analysis) return false;
  auto* input=lr_items_create(); auto* output=lr_items_create();
  LRItem seed{0,0,0xfffffffe,0xfffffffe};
  bool ok=input && output && lr_analysis_compute(analysis) && lr_items_insert(input,&seed)
    && lr_items_close(analysis,input,true) && lr_items_goto(analysis,input,&symbols[0],output,true);
  auto* propagation=lr_propagation_create(3);
  ok=ok && propagation && lr_propagation_seed(propagation,0,1,3)
    && lr_propagation_edge(propagation,0,1) && lr_propagation_edge(propagation,1,2)
    && lr_propagation_edge(propagation,2,0) && lr_propagation_solve(propagation);
  lr_propagation_destroy(propagation);
  if(ok) {
    auto* states=lr_states_create(analysis); ok=states && lr_states_lalr(states,true); lr_states_destroy(states);
  }
  lr_items_destroy(input); lr_items_destroy(output); lr_analysis_destroy(analysis);
  return ok;
}
void compare_propagation(std::mt19937& random) {
  const size_t count=1+random()%80;
  auto* actual=lr_propagation_create(count); auto* reference=reference_lr_propagation_create(count);
  assert(actual && reference);
  // Mutate after a fixed point too: newly added dependencies and seeds invalidate
  // exactly the affected propagation work, including duplicate/self/cyclic edges.
  for(size_t round=0;round<3;++round) {
    for(size_t i=0;i<count*3;++i) {
      size_t source=random()%count,destination=random()%count;
      assert(lr_propagation_edge(actual,source,destination));
      assert(reference_lr_propagation_edge(reference,source,destination));
    }
    for(size_t i=0;i<count;++i) {
      uint32_t first=uint32_t(random()%12)+0x200000,last=first+uint32_t(random()%4);
      size_t index=random()%count;
      assert(lr_propagation_seed(actual,index,first,last));
      assert(reference_lr_propagation_seed(reference,index,first,last));
    }
    assert(lr_propagation_solve(actual)); assert(reference_lr_propagation_solve(reference));
    assert(lr_propagation_solve(actual));
    for(size_t i=0;i<count;++i) {
      assert(lr_propagation_count(actual,i)==reference_lr_propagation_count(reference,i));
      auto* a=lr_propagation_data(actual,i); auto* b=reference_lr_propagation_data(reference,i);
      for(size_t j=0;j<lr_propagation_count(actual,i);++j) assert(a[j].first==b[j].first && a[j].last==b[j].last);
    }
  }
  lr_propagation_destroy(actual); reference_lr_propagation_destroy(reference);
}
}
void lr_analysis_tests() {
  const auto baseline=tower_test_buffer_count();
  bool success=false;
  for(size_t i=0;i<1024 && !success;++i) {
    tower_test_buffer_fail_after(i); success=allocation_trial();
    tower_test_buffer_fail_after(SIZE_MAX);
    assert(tower_test_buffer_count()==baseline);
  }
  assert(success);
  // Force several kernel hash-table resizes, using IDs above Unicode. This is
  // also the table-building path used before the fixed-sequence DFA shortcut.
  {
    std::vector<LRSymbol> symbols;
    for(uint32_t i=0;i<512;++i) symbols.push_back({SIZE_MAX,0x200000+i,0x200000+i});
    const LRProduction rule{0,0,symbols.size()};
    auto* analysis=lr_analysis_create(&rule,1,symbols.data(),symbols.size(),1);
    assert(analysis && lr_analysis_compute(analysis));
    auto* states=lr_states_create(analysis);
    assert(states && lr_states_count(states)==513 && lr_states_lalr(states,false));
    for(size_t i=0;i<512;++i) {
      assert(lr_states_edge_count(states,i)==1);
      assert(lr_states_edges(states,i)[0].state==i+1);
    }
    assert(lr_states_action_count(states,512)==1);
    const auto& final=lr_states_actions(states,512)[0];
    assert(final.rule==0 && final.first==0xfffffffe && final.last==0xfffffffe);
    lr_states_destroy(states); lr_analysis_destroy(analysis);
    assert(tower_test_buffer_count()==baseline);
  }
  std::mt19937 random(0x4c525441);
  for(size_t trial=0;trial<150;++trial) {
    std::vector<LRProduction> rules;
    std::vector<LRSymbol> symbols;
    size_t nonterminals=1+random()%6;
    for(size_t i=0;i<nonterminals*2;++i) {
      size_t count=random()%5;
      rules.push_back({i%nonterminals,symbols.size(),count});
      for(size_t j=0;j<count;++j) {
        if(random()%2) symbols.push_back({random()%nonterminals,0,0});
        else { uint32_t first=uint32_t(random()%10)+(trial%2?0x200000:32); symbols.push_back({SIZE_MAX,first,uint32_t(first+random()%4)}); }
      }
    }
    compare(rules,symbols,nonterminals);
    compare_propagation(random);
    assert(tower_test_buffer_count()==baseline);
  }
}
