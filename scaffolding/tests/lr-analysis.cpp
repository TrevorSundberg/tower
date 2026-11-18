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
LRRuntime* reference_lr_runtime_create(LRStates*);
void reference_lr_runtime_destroy(LRRuntime*);
bool reference_lr_runtime_conflict(LRRuntime*, LRConflict*);
size_t reference_lr_runtime_row_count(LRRuntime*);
size_t reference_lr_runtime_action_count(LRRuntime*, size_t);
const LRAction* reference_lr_runtime_actions(LRRuntime*, size_t);
size_t reference_lr_runtime_default(LRRuntime*, size_t);
bool reference_lr_runtime_action(LRRuntime*, size_t, uint32_t, LRAction*);
size_t reference_lr_runtime_goto_count(LRRuntime*, size_t);
const LRGoto* reference_lr_runtime_goto_data(LRRuntime*, size_t);
size_t reference_lr_runtime_goto(LRRuntime*, size_t, size_t);
void reference_lr_runtime_specialize(LRRuntime*, LRStates*);
size_t reference_lr_runtime_sequence(LRRuntime*);
LRParser* reference_lr_parser_create(LRRuntime*, bool, bool);
void reference_lr_parser_destroy(LRParser*);
uint32_t reference_lr_parser_step(LRParser*, bool, uint32_t, bool, size_t, size_t, LRStep*);
bool reference_lr_parser_commit(LRParser*, const LRStep*, size_t, size_t);
size_t reference_lr_parser_frame_count(LRParser*);
void reference_lr_parser_frame(LRParser*, size_t, LRFrame*);
void reference_lr_parser_sequence_forest(LRParser*, LRFrame*);
size_t reference_lr_parser_consumed(LRParser*);
bool reference_lr_parser_shifted(LRParser*);
void reference_lr_parser_work(LRParser*, LRWork*);
size_t tower_test_buffer_count();
void tower_test_buffer_fail_after(size_t);
}
namespace {
void compare_action(const LRAction& a, const LRAction& b) {
  assert(a.first==b.first && a.last==b.last && a.rule==b.rule && a.state==b.state);
}
void compare_control(LRRuntime* actual, LRRuntime* expected, const std::vector<uint32_t>& tokens,
    bool prefix, bool specialize, size_t error_at=SIZE_MAX) {
  auto* a=lr_parser_create(actual,prefix,specialize); auto* b=reference_lr_parser_create(expected,prefix,specialize);
  assert(a && b);
  size_t position=0; bool ready=false;
  for(size_t iteration=0;iteration<512;++iteration) {
    const auto id=position<tokens.size() ? tokens[position] : 0xfffffffeu;
    const auto length=position<tokens.size() && position%3 ? 2u : 0u;
    LRStep x,y;
    const auto kind=lr_parser_step(a,ready,id,position==error_at,10+position*3,length,&x);
    assert(kind==reference_lr_parser_step(b,ready,id,position==error_at,10+position*3,length,&y));
    assert(x.rule==y.rule && x.next==y.next && x.pop==y.pop && x.start==y.start && x.end==y.end && x.id==y.id && x.kind==y.kind);
    assert(lr_parser_consumed(a)==reference_lr_parser_consumed(b));
    assert(lr_parser_shifted(a)==reference_lr_parser_shifted(b));
    LRWork aw,bw; lr_parser_work(a,&aw); reference_lr_parser_work(b,&bw);
    assert(aw.actions==bw.actions && aw.shifts==bw.shifts && aw.reductions==bw.reductions && aw.popped==bw.popped);
    const auto count=lr_parser_frame_count(a);
    assert(count==reference_lr_parser_frame_count(b));
    for(size_t i=0;i<count;++i) {
      LRFrame af,bf; lr_parser_frame(a,i,&af); reference_lr_parser_frame(b,i,&bf);
      assert(af.state==bf.state && af.first==bf.first && af.last==bf.last && af.start==bf.start && af.length==bf.length);
    }
    LRFrame af,bf; lr_parser_sequence_forest(a,&af); reference_lr_parser_sequence_forest(b,&bf);
    assert(af.first==bf.first && af.last==bf.last && af.start==bf.start && af.length==bf.length);
    if(kind==LR_NEED_INPUT) { assert(!ready); ready=true; continue; }
    if(kind==LR_SHIFT || kind==LR_SEQUENCE_SHIFT || kind==LR_REDUCE || kind==LR_SEQUENCE_REDUCE) {
      assert(lr_parser_commit(a,&x,iteration,iteration));
      assert(reference_lr_parser_commit(b,&y,iteration,iteration));
      if(kind==LR_SEQUENCE_REDUCE) break;
      if(kind==LR_SHIFT || kind==LR_SEQUENCE_SHIFT) { ++position; ready=false; }
    } else { assert(kind!=LR_INVALID); break; }
  }
  lr_parser_destroy(a); reference_lr_parser_destroy(b);
}
void compare_runtime(LRStates* actual, LRStates* expected, size_t nonterminals) {
  auto* a=lr_runtime_create(actual); auto* b=reference_lr_runtime_create(expected);
  assert(a && b);
  LRConflict left,right;
  assert(lr_runtime_conflict(a,&left)==reference_lr_runtime_conflict(b,&right));
  assert(left.state==right.state);
  if(left.state!=SIZE_MAX) {
    compare_action(left.left,right.left); compare_action(left.right,right.right);
  } else {
    lr_runtime_specialize(a,actual); reference_lr_runtime_specialize(b,expected);
    assert(lr_runtime_sequence(a)==reference_lr_runtime_sequence(b));
    assert(lr_runtime_row_count(a)==reference_lr_runtime_row_count(b));
    for(size_t state=0;state<lr_states_count(actual);++state) {
      assert(lr_runtime_default(a,state)==reference_lr_runtime_default(b,state));
      auto count=lr_runtime_action_count(a,state);
      assert(count==reference_lr_runtime_action_count(b,state));
      const auto* actions=lr_runtime_actions(a,state); const auto* other=reference_lr_runtime_actions(b,state);
      std::vector<uint32_t> probes{0,0xfffffffd,0xfffffffe,0xffffffff,0x200000,32};
      for(size_t i=0;i<count;++i) {
        compare_action(actions[i],other[i]);
        for(auto id:{actions[i].first,actions[i].last}) {
          probes.push_back(id); probes.push_back(id-1); probes.push_back(id+1);
        }
      }
      for(auto id:probes) {
        LRAction x,y;
        auto found=lr_runtime_action(a,state,id,&x);
        assert(found==reference_lr_runtime_action(b,state,id,&y));
        if(found) compare_action(x,y);
      }
      for(size_t n=0;n<=nonterminals;++n)
        assert(lr_runtime_goto(a,state,n)==reference_lr_runtime_goto(b,state,n));
      assert(lr_runtime_goto_count(a,state)==reference_lr_runtime_goto_count(b,state));
      const auto* gotos=lr_runtime_goto_data(a,state); const auto* expected_gotos=reference_lr_runtime_goto_data(b,state);
      for(size_t i=0;i<lr_runtime_goto_count(a,state);++i)
        assert(gotos[i].nonterminal==expected_gotos[i].nonterminal && gotos[i].state==expected_gotos[i].state);
    }
    std::vector<uint32_t> walk;
    size_t state=0;
    for(size_t i=0;i<20;++i) {
      auto count=lr_runtime_action_count(a,state); auto* actions=lr_runtime_actions(a,state);
      auto* shift=std::find_if(actions,actions+count,[](auto action){return action.state!=SIZE_MAX;});
      if(shift==actions+count) break;
      walk.push_back(shift->first); state=shift->state;
    }
    for(bool prefix:{false,true}) for(bool specialize:{false,true}) {
      compare_control(a,b,{},prefix,specialize);
      compare_control(a,b,walk,prefix,specialize);
      auto incomplete=walk; if(!incomplete.empty()) incomplete.pop_back();
      compare_control(a,b,incomplete,prefix,specialize);
      auto trailing=walk; trailing.push_back(0xfffffffc);
      compare_control(a,b,trailing,prefix,specialize);
      compare_control(a,b,walk,prefix,specialize,walk.size()/2);
    }
  }
  lr_runtime_destroy(a); reference_lr_runtime_destroy(b);
}
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
  compare_runtime(states,expected_states,nonterminals);
  assert(lr_states_lalr(states,true)); assert(reference_lr_states_lalr(expected_states,true));
  compare_runtime(states,expected_states,nonterminals);
  lr_states_destroy(states); reference_lr_states_destroy(expected_states);
  lr_analysis_destroy(a); reference_lr_analysis_destroy(b);
}
bool allocation_trial() {
  const LRProduction rules[]={{0,0,1},{1,1,3},{1,4,0},{2,4,1},{2,5,1}};
  const LRSymbol symbols[]={{1,0,0},{2,0,0},{1,0,0},{SIZE_MAX,100,200},{SIZE_MAX,0x200000,0x200004},{SIZE_MAX,42,42}};
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
    auto* states=lr_states_create(analysis); ok=states && lr_states_lalr(states,false);
    if(ok) {
      auto* runtime=lr_runtime_create(states); ok=runtime!=nullptr;
      if(ok) { LRConflict conflict; assert(!lr_runtime_conflict(runtime,&conflict)); }
      lr_runtime_destroy(runtime);
    }
    lr_states_destroy(states);
  }
  lr_items_destroy(input); lr_items_destroy(output); lr_analysis_destroy(analysis);
  return ok;
}
bool control_allocation_trial(bool specialize) {
  std::vector<LRSymbol> symbols{{1,0,0}};
  for(uint32_t i=0;i<16;++i) symbols.push_back({SIZE_MAX,32+i,32+i});
  const LRProduction rules[]={{0,0,1},{1,1,16}};
  auto* analysis=lr_analysis_create(rules,2,symbols.data(),symbols.size(),2);
  LRStates* states=nullptr; LRRuntime* runtime=nullptr; LRParser* parser=nullptr;
  bool ok=analysis && lr_analysis_compute(analysis);
  if(ok) { states=lr_states_create(analysis); ok=states && lr_states_lalr(states,false); }
  if(ok) { runtime=lr_runtime_create(states); ok=runtime!=nullptr; }
  if(ok) {
    if(specialize) lr_runtime_specialize(runtime,states);
    parser=lr_parser_create(runtime,false,specialize); ok=parser!=nullptr;
  }
  if(ok) for(size_t position=0;position<16;++position) {
    LRStep step;
    auto kind=lr_parser_step(parser,true,uint32_t(32+position),false,position,1,&step);
    assert(kind==LR_SHIFT || kind==LR_SEQUENCE_SHIFT);
    ok=lr_parser_commit(parser,&step,position,position);
    if(!ok) break;
  }
  if(ok) {
    LRStep step; auto kind=lr_parser_step(parser,true,0xfffffffe,false,16,0,&step);
    assert(kind==LR_REDUCE || kind==LR_SEQUENCE_REDUCE);
    ok=lr_parser_commit(parser,&step,16,16);
  }
  lr_parser_destroy(parser); lr_runtime_destroy(runtime); lr_states_destroy(states); lr_analysis_destroy(analysis);
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
  for(bool specialize:{false,true}) {
    success=false;
    for(size_t i=0;i<4096 && !success;++i) {
      tower_test_buffer_fail_after(i); success=control_allocation_trial(specialize);
      tower_test_buffer_fail_after(SIZE_MAX);
      assert(tower_test_buffer_count()==baseline);
    }
    assert(success);
  }
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
  // Empty input, maximum-range boundaries, many disjoint singleton alternatives
  // (including deliberate direct-hash collisions), and shared reduction rows.
  compare({{0,0,1},{1,1,0}},{{1,0,0}},2);
  compare({{0,0,1},{1,1,1},{1,2,1}},{{1,0,0},{SIZE_MAX,0xfffffff0,0xffffffff},{SIZE_MAX,0xfffffffe,0xfffffffe}},2);
  {
    std::vector<LRProduction> rules{{0,0,1}};
    std::vector<LRSymbol> symbols{{1,0,0}};
    for(size_t i=0;i<128;++i) {
      rules.push_back({1,symbols.size(),2});
      symbols.push_back({SIZE_MAX,uint32_t(0x200000+i*1024),uint32_t(0x200000+i*1024)});
      symbols.push_back({2,0,0});
    }
    rules.push_back({2,symbols.size(),1}); symbols.push_back({SIZE_MAX,1,4});
    compare(rules,symbols,3);
  }
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
