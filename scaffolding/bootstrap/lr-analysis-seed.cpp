// Transitional bootstrap/reference. Production links lr-analysis.tower instead.
#include "../compiler-lr.hpp"
#include "../compiler-parse-tree.hpp"
#include "../parser.hpp"
#include <algorithm>
#include <vector>
#include <tuple>
#include <map>
#include <memory>

struct LRAnalysis {
  const LRProduction* rules;
  size_t rule_count;
  const LRSymbol* symbols;
  std::vector<std::vector<size_t>> productions;
  std::vector<std::vector<SymbolRange>> first;
  std::vector<bool> nullable;
  std::vector<size_t> order;
};
struct LRItems { std::vector<LRItem> values; };
struct ReferenceLRState {
  LRItems items;
  size_t origin;
  std::vector<LRTransition> edges;
  std::vector<LRAction> actions;
  size_t base=0;
};
struct LRStates { std::vector<std::unique_ptr<ReferenceLRState>> states; LRAnalysis* analysis; };
struct LRPropagation {
  std::vector<std::vector<SymbolRange>> ranges;
  std::vector<std::vector<size_t>> edges;
};
namespace {
bool less(const SymbolRange& a, const SymbolRange& b) { return std::tie(a.first,a.last) < std::tie(b.first,b.last); }
bool less(const LRItem& a, const LRItem& b) { return std::tie(a.rule,a.position,a.first,a.last) < std::tie(b.rule,b.position,b.first,b.last); }
template<class T> bool insert(std::vector<T>& values, const T& value) {
  auto found = std::lower_bound(values.begin(), values.end(), value, [](const T& a, const T& b) { return less(a,b); });
  if (found != values.end() && !less(value,*found)) return false;
  values.insert(found, value); return true;
}
}
extern "C" {
LRAnalysis* lr_analysis_create(const LRProduction* rules, size_t count, const LRSymbol* symbols, size_t symbol_count, size_t nonterminals) {
  auto* result = new LRAnalysis{rules,count,symbols};
  result->productions.resize(nonterminals); result->first.resize(nonterminals); result->nullable.resize(nonterminals);
  for(size_t n=0;n<nonterminals;++n) result->order.push_back(n);
  for (size_t i=0; i<count; ++i) {
    const auto& r=rules[i];
    if(r.owner>=nonterminals || r.begin>symbol_count || r.count>symbol_count-r.begin) { delete result; return nullptr; }
    result->productions[r.owner].push_back(i);
  }
  return result;
}
void lr_analysis_destroy(LRAnalysis* value) { delete value; }
bool lr_analysis_failed(LRAnalysis*) { return false; }
void lr_analysis_order(LRAnalysis* value,size_t index,size_t order) { value->order[index]=order; }
bool lr_analysis_compute(LRAnalysis* value) {
  bool changed;
  do {
    changed=false;
    for(size_t i=0;i<value->rule_count;++i) {
      const auto& r=value->rules[i]; bool nullable=true;
      for(size_t p=0;p<r.count;++p) {
        const auto& s=value->symbols[r.begin+p];
        if(s.nonterminal==SIZE_MAX) { changed |= insert(value->first[r.owner],SymbolRange{s.first,s.last}); nullable=false; break; }
        if(s.nonterminal>=value->first.size()) return false;
        if(s.nonterminal!=r.owner) for(const auto& range:value->first[s.nonterminal]) changed |= insert(value->first[r.owner],range);
        if(!value->nullable[s.nonterminal]) { nullable=false; break; }
      }
      if(nullable && !value->nullable[r.owner]) { value->nullable[r.owner]=true; changed=true; }
    }
  } while(changed);
  return true;
}
bool lr_analysis_nullable(LRAnalysis* value, size_t n) { return value->nullable[n]; }
size_t lr_analysis_first_count(LRAnalysis* value, size_t n) { return value->first[n].size(); }
const SymbolRange* lr_analysis_first_data(LRAnalysis* value, size_t n) { return value->first[n].data(); }
LRItems* lr_items_create() { return new LRItems; }
void lr_items_destroy(LRItems* value) { delete value; }
bool lr_items_insert(LRItems* value, const LRItem* item) { insert(value->values,*item); return true; }
size_t lr_items_count(LRItems* value) { return value->values.size(); }
const LRItem* lr_items_data(LRItems* value) { return value->values.data(); }
bool lr_items_close(LRAnalysis* value, LRItems* items, bool lookahead) {
  std::vector<LRItem> pending=items->values;
  while(!pending.empty()) {
    auto item=pending.back(); pending.pop_back();
    const auto& rule=value->rules[item.rule];
    if(item.position>=rule.count) continue;
    const auto& symbol=value->symbols[rule.begin+item.position];
    if(symbol.nonterminal==SIZE_MAX) continue;
    std::vector<SymbolRange> ranges;
    if(lookahead) {
      bool nullable=true;
      for(size_t p=item.position+1;p<rule.count;++p) {
        const auto& next=value->symbols[rule.begin+p];
        if(next.nonterminal==SIZE_MAX) { insert(ranges,SymbolRange{next.first,next.last}); nullable=false; break; }
        for(const auto& range:value->first[next.nonterminal]) insert(ranges,range);
        if(!value->nullable[next.nonterminal]) { nullable=false; break; }
      }
      if(nullable) insert(ranges,SymbolRange{item.first,item.last});
    } else ranges.push_back({0,0});
    for(auto r:value->productions[symbol.nonterminal]) for(const auto& range:ranges) {
      LRItem next{r,0,range.first,range.last};
      if(insert(items->values,next)) pending.push_back(next);
    }
  }
  return true;
}
bool lr_items_goto(LRAnalysis* value, LRItems* input, const LRSymbol* symbol, LRItems* output, bool lookahead) {
  for(auto item:input->values) {
    const auto& rule=value->rules[item.rule];
    if(item.position>=rule.count) continue;
    const auto& next=value->symbols[rule.begin+item.position];
    if(next.nonterminal!=symbol->nonterminal) continue;
    if(next.nonterminal==SIZE_MAX && (symbol->first<next.first || symbol->last>next.last)) continue;
    ++item.position; insert(output->values,item);
  }
  return lr_items_close(value,output,lookahead);
}
LRPropagation* lr_propagation_create(size_t count) {
  auto* result=new LRPropagation;
  result->ranges.resize(count); result->edges.resize(count); return result;
}
void lr_propagation_destroy(LRPropagation* value) { delete value; }
bool lr_propagation_seed(LRPropagation* value, size_t index, uint32_t first, uint32_t last) {
  insert(value->ranges[index],SymbolRange{first,last}); return true;
}
bool lr_propagation_edge(LRPropagation* value, size_t source, size_t destination) {
  value->edges[source].push_back(destination); return true;
}
bool lr_propagation_solve(LRPropagation* value) {
  bool changed;
  do {
    changed=false;
    for(size_t i=0;i<value->ranges.size();++i) for(auto to:value->edges[i]) if(i!=to)
      for(const auto& range:value->ranges[i]) changed |= insert(value->ranges[to],range);
  } while(changed);
  return true;
}
size_t lr_propagation_count(LRPropagation* value, size_t index) { return value->ranges[index].size(); }
const SymbolRange* lr_propagation_data(LRPropagation* value, size_t index) { return value->ranges[index].data(); }
LRStates* lr_states_create(LRAnalysis* value) {
  auto* result=new LRStates;
  result->analysis=value;
  using Key=std::vector<std::pair<size_t,size_t>>;
  std::map<Key,size_t> interned;
  std::vector<size_t> pending;
  const auto kernel=[&](const LRItem& i) { return i.position || !i.rule || !value->rules[i.rule].count; };
  const auto intern=[&](LRItems items,size_t origin) {
    Key key;
    for(const auto& item:items.values) if(kernel(item)) key.emplace_back(item.rule,item.position);
    auto found=interned.find(key);
    if(found!=interned.end()) return found->second;
    const auto index=result->states.size();
    auto state=std::make_unique<ReferenceLRState>(); state->items=std::move(items); state->origin=origin;
    result->states.push_back(std::move(state)); interned.emplace(std::move(key),index); pending.push_back(index); return index;
  };
  LRItems initial; initial.values.push_back({0,0,0,0}); lr_items_close(value,&initial,false); intern(std::move(initial),SIZE_MAX);
  const auto symbol_key=[&](size_t index) {
    const auto& s=value->symbols[index];
    return s.nonterminal==SIZE_MAX ? std::tuple(1,size_t(s.first),s.last) : std::tuple(0,value->order[s.nonterminal],uint32_t(0));
  };
  while(!pending.empty()) {
    auto* state=result->states[pending.back()].get(); pending.pop_back();
    std::map<std::tuple<int,size_t,uint32_t>,size_t> symbols;
    for(bool want_kernel:{true,false}) for(const auto& item:state->items.values) {
      const auto& r=value->rules[item.rule];
      if(kernel(item)==want_kernel && item.position<r.count) {
        const auto index=r.begin+item.position; symbols.emplace(symbol_key(index),index);
      }
    }
    for(const auto& entry:symbols) {
      LRItems next; lr_items_goto(value,&state->items,&value->symbols[entry.second],&next,false);
      state->edges.push_back({entry.second,intern(std::move(next),entry.second)});
    }
  }
  return result;
}
void lr_states_destroy(LRStates* value) { delete value; }
size_t lr_states_count(LRStates* value) { return value->states.size(); }
LRItems* lr_states_items(LRStates* value,size_t index) { return &value->states[index]->items; }
size_t lr_states_origin(LRStates* value,size_t index) { return value->states[index]->origin; }
size_t lr_states_edge_count(LRStates* value,size_t index) { return value->states[index]->edges.size(); }
const LRTransition* lr_states_edges(LRStates* value,size_t index) { return value->states[index]->edges.data(); }
bool lr_states_lalr(LRStates* value,bool constructs) {
  auto* analysis=value->analysis;
  size_t count=0;
  for(auto& s:value->states) { s->base=count; count+=s->items.values.size(); }
  std::unique_ptr<LRPropagation> graph(lr_propagation_create(count));
  const auto index=[&](size_t state,const LRItem& item) {
    const auto& s=*value->states[state];
    LRItem key{item.rule,item.position,0,0};
    auto found=std::lower_bound(s.items.values.begin(),s.items.values.end(),key,[](const LRItem& a,const LRItem& b){return less(a,b);});
    if(found==s.items.values.end() || less(key,*found)) return SIZE_MAX;
    return s.base+size_t(found-s.items.values.begin());
  };
  const auto link=[&](size_t source,size_t state,const LRItem& item) {
    size_t destination=index(state,item);
    if(destination==SIZE_MAX) return false;
    if(item.first==0xfffffffd) return lr_propagation_edge(graph.get(),source,destination);
    return lr_propagation_seed(graph.get(),destination,item.first,item.last);
  };
  const auto kernel=[&](const LRItem& item){return item.position || !item.rule || !analysis->rules[item.rule].count;};
  size_t start=index(0,LRItem{0,0,0,0}); if(start==SIZE_MAX) return false;
  lr_propagation_seed(graph.get(),start,0xfffffffe,0xfffffffe);
  if(constructs) for(auto r:analysis->first[analysis->rules[0].owner]) lr_propagation_seed(graph.get(),start,r.first,r.last);
  for(size_t state=0;state<value->states.size();++state) {
    const auto& s=*value->states[state];
    for(const auto& item:s.items.values) if(kernel(item)) {
      size_t source=index(state,item);
      LRItems closure; closure.values.push_back({item.rule,item.position,0xfffffffd,0xfffffffd});
      lr_items_close(analysis,&closure,true);
      for(const auto& c:closure.values) if(!analysis->rules[c.rule].count) if(!link(source,state,c)) return false;
      // Preserve the original algorithm's exact symbol/range identity. A
      // partially overlapping range from another kernel is not this transition.
      for(const auto& edge:s.edges) {
        const auto& symbol=analysis->symbols[edge.symbol];
        bool present=false;
        for(const auto& c:closure.values) {
          const auto& r=analysis->rules[c.rule];
          if(c.position>=r.count) continue;
          const auto& next=analysis->symbols[r.begin+c.position];
          if(next.nonterminal==symbol.nonterminal && (next.nonterminal!=SIZE_MAX ||
              (next.first==symbol.first && next.last==symbol.last))) present=true;
        }
        if(!present) continue;
        LRItems next; lr_items_goto(analysis,&closure,&analysis->symbols[edge.symbol],&next,true);
        for(const auto& c:next.values) if(kernel(c)) if(!link(source,edge.state,c)) return false;
      }
    }
  }
  lr_propagation_solve(graph.get());
  for(const auto& s:value->states) {
    s->actions.clear();
    for(const auto& edge:s->edges) {
      const auto& symbol=analysis->symbols[edge.symbol];
      if(symbol.nonterminal==SIZE_MAX) s->actions.push_back({symbol.first,symbol.last,SIZE_MAX,edge.state});
    }
    for(size_t i=0;i<s->items.values.size();++i) {
      const auto& item=s->items.values[i];
      if(item.position!=analysis->rules[item.rule].count) continue;
      for(auto range:graph->ranges[s->base+i]) s->actions.push_back({range.first,range.last,item.rule,SIZE_MAX});
    }
  }
  return true;
}
size_t lr_states_action_count(LRStates* value,size_t index) { return value->states[index]->actions.size(); }
const LRAction* lr_states_actions(LRStates* value,size_t index) { return value->states[index]->actions.data(); }
}

// Temporary independent reference/seed. Production uses lr-runtime.tower.
struct ReferenceRuntimeState {
  std::vector<LRAction> actions;
  std::vector<LRGoto> gotos;
  size_t reduction=SIZE_MAX;
};
struct LRRuntime {
  std::vector<ReferenceRuntimeState> states;
  std::vector<LRProduction> rules;
  std::vector<SymbolRange> sequence;
  std::vector<size_t> sequence_states;
  size_t sequence_rule=SIZE_MAX;
  LRConflict conflict{SIZE_MAX,{},{}};
  size_t rows=0;
};
extern "C" {
LRRuntime* lr_runtime_create(LRStates* source) {
  auto* value=new LRRuntime;
  value->rules.assign(source->analysis->rules,source->analysis->rules+source->analysis->rule_count);
  value->states.resize(source->states.size());
  using Key=std::vector<std::tuple<uint32_t,uint32_t,size_t,size_t>>;
  std::map<Key,size_t> rows;
  for(size_t i=0;i<source->states.size();++i) {
    auto& state=value->states[i];
    auto actions=source->states[i]->actions;
    std::sort(actions.begin(),actions.end(),[](const auto& a,const auto& b) {
      return std::tie(a.first,a.last,a.state,a.rule)<std::tie(b.first,b.last,b.state,b.rule);
    });
    for(auto action:actions) {
      if(!state.actions.empty()) {
        auto& previous=state.actions.back();
        if(previous.rule==action.rule && previous.state==action.state &&
            uint64_t(action.first)<=uint64_t(previous.last)+1) {
          previous.last=std::max(previous.last,action.last); continue;
        }
        if(action.first<=previous.last) {
          value->conflict={i,previous,action}; return value;
        }
      }
      state.actions.push_back(action);
    }
    Key key;
    for(auto action:state.actions) {
      key.emplace_back(action.first,action.last,action.state,action.rule);
      if(action.first==0xfffffffe && action.last==0xfffffffe) state.reduction=action.rule;
    }
    rows.try_emplace(key,rows.size());
    for(auto action:state.actions) if(action.rule!=state.reduction) state.reduction=SIZE_MAX;
    for(auto edge:source->states[i]->edges) {
      auto n=source->analysis->symbols[edge.symbol].nonterminal;
      if(n!=SIZE_MAX) state.gotos.push_back({n,edge.state});
    }
    std::sort(state.gotos.begin(),state.gotos.end(),[](auto a,auto b){return a.nonterminal<b.nonterminal;});
  }
  value->rows=rows.size(); return value;
}
void lr_runtime_destroy(LRRuntime* value) { delete value; }
bool lr_runtime_conflict(LRRuntime* value,LRConflict* result) { *result=value->conflict; return result->state!=SIZE_MAX; }
size_t lr_runtime_row_count(LRRuntime* value) { return value->rows; }
size_t lr_runtime_action_count(LRRuntime* value,size_t state) { return value->states[state].actions.size(); }
const LRAction* lr_runtime_actions(LRRuntime* value,size_t state) { return value->states[state].actions.data(); }
size_t lr_runtime_default(LRRuntime* value,size_t state) { return value->states[state].reduction; }
bool lr_runtime_action(LRRuntime* value,size_t state,uint32_t id,LRAction* result) {
  for(auto action:value->states[state].actions) if(id>=action.first && id<=action.last) { *result=action; return true; }
  return false;
}
size_t lr_runtime_goto_count(LRRuntime* value,size_t state) { return value->states[state].gotos.size(); }
const LRGoto* lr_runtime_goto_data(LRRuntime* value,size_t state) { return value->states[state].gotos.data(); }
size_t lr_runtime_goto(LRRuntime* value,size_t state,size_t nonterminal) {
  for(auto edge:value->states[state].gotos) if(edge.nonterminal==nonterminal) return edge.state;
  return SIZE_MAX;
}
void lr_runtime_specialize(LRRuntime* value,LRStates* source) {
  size_t root=SIZE_MAX;
  for(size_t i=0;i<value->rules.size();++i) if(value->rules[i].owner==1) {
    if(root!=SIZE_MAX) return;
    root=i;
  }
  if(root==SIZE_MAX) return;
  auto rule=value->rules[root];
  if(!rule.count || rule.count>4096) return;
  for(size_t i=0;i<rule.count;++i) {
    const auto& s=source->analysis->symbols[rule.begin+i];
    if(s.nonterminal!=SIZE_MAX || s.last>=0xfffffffd) return;
  }
  std::vector<SymbolRange> sequence;
  std::vector<size_t> states{0};
  for(size_t i=0;i<rule.count;++i) {
    const auto& s=source->analysis->symbols[rule.begin+i]; LRAction action;
    if(!lr_runtime_action(value,states.back(),s.first,&action) || action.state==SIZE_MAX) return;
    states.push_back(action.state); sequence.push_back({s.first,s.last});
  }
  value->sequence_rule=root; value->sequence=std::move(sequence); value->sequence_states=std::move(states);
}
size_t lr_runtime_sequence(LRRuntime* value) { return value->sequence_rule; }
}

struct LRParser {
  LRRuntime* runtime;
  std::vector<LRFrame> stack{{0,SIZE_MAX,SIZE_MAX,0,0}};
  LRWork work{};
  bool prefix=false,shifted=false,finishing=false,sequence=false;
  size_t consumed=0;
  std::vector<bool> evidence;
  LRFrame forest{0,SIZE_MAX,SIZE_MAX,0,0};
};
extern "C" {
LRParser* lr_parser_create(LRRuntime* runtime,bool prefix,bool specialize) {
  auto* result=new LRParser;
  result->runtime=runtime; result->prefix=prefix;
  result->sequence=specialize && runtime->sequence_rule!=SIZE_MAX;
  return result;
}
void lr_parser_destroy(LRParser* value) { delete value; }
static uint32_t reference_parser_decide(LRParser* value,bool ready,uint32_t id,bool error,LRStep* result) {
  auto* runtime=value->runtime;
  if(value->sequence) {
    const size_t position=value->evidence.size();
    bool complete=position==runtime->sequence.size();
    bool needs_input=!complete || !value->prefix;
    if(needs_input && !ready) return LR_NEED_INPUT;
    ++value->work.actions; result->rule=runtime->sequence_rule;
    if(complete) {
      if(needs_input && (id!=0xfffffffe || error)) return LR_UNEXPECTED;
      result->next=lr_runtime_goto(runtime,0,runtime->rules[result->rule].owner);
      result->start=value->forest.start; result->end=value->forest.start+value->forest.length;
      return LR_SEQUENCE_REDUCE;
    }
    const auto range=runtime->sequence[position];
    if(error || id<range.first || id>range.last) return LR_UNEXPECTED;
    result->next=runtime->sequence_states[position+1]; result->pop=position; return LR_SEQUENCE_SHIFT;
  }
  const size_t state=value->stack.back().state;
  LRAction action{0,0,SIZE_MAX,SIZE_MAX};
  bool found=false;
  if(value->prefix && !ready) {
    action.rule=lr_runtime_default(runtime,state); found=action.rule!=SIZE_MAX;
  }
  if(found) ++value->work.actions;
  else {
    if(!ready && !value->finishing) return LR_NEED_INPUT;
    if(value->finishing) { id=0xfffffffe; error=false; }
    if(!error) { ++value->work.actions; found=lr_runtime_action(runtime,state,id,&action); }
    if(!found && value->prefix && value->shifted && !value->finishing) {
      ++value->work.actions; found=lr_runtime_action(runtime,state,0xfffffffe,&action);
      if(found) { value->finishing=true; id=0xfffffffe; }
    }
  }
  if(!found) return LR_UNEXPECTED;
  result->id=id; result->rule=action.rule; result->next=action.state;
  if(action.state!=SIZE_MAX) return LR_SHIFT;
  if(!action.rule) return value->prefix && !value->shifted ? LR_EMPTY_PREFIX : LR_ACCEPT;
  const auto rule=runtime->rules[action.rule];
  if(rule.count>=value->stack.size()) return LR_INVALID;
  result->pop=rule.count;
  if(!ready || value->finishing) result->start=value->consumed;
  result->end=result->start;
  const auto begin=value->stack.size()-rule.count;
  if(rule.count) {
    result->start=result->end=value->stack[begin].start;
    for(size_t i=begin;i<value->stack.size();++i)
      result->end=std::max(result->end,value->stack[i].start+value->stack[i].length);
  }
  result->next=lr_runtime_goto(runtime,value->stack[begin-1].state,rule.owner);
  return result->next==SIZE_MAX ? LR_INVALID : LR_REDUCE;
}
uint32_t lr_parser_step(LRParser* value,bool ready,uint32_t id,bool error,size_t start,size_t length,LRStep* result) {
  *result={SIZE_MAX,SIZE_MAX,0,start,start+length,id,0};
  return result->kind=reference_parser_decide(value,ready,id,error,result);
}
bool lr_parser_commit(LRParser* value,const LRStep* step,size_t first,size_t last) {
  if(step->kind==LR_SEQUENCE_SHIFT) {
    value->evidence.push_back(step->end!=step->start);
    const auto end=std::max(value->forest.start+value->forest.length,step->end);
    if(value->evidence.size()==1) value->forest.start=step->start;
    value->forest.length=end-value->forest.start;
    value->forest.first=first; value->forest.last=last;
    value->consumed=step->end; value->shifted=true; ++value->work.shifts; return true;
  }
  value->stack.resize(value->stack.size()-step->pop);
  value->stack.push_back({step->next,first,last,step->start,step->end-step->start});
  if(step->kind==LR_SHIFT) {
    value->consumed=step->end; value->shifted=true; ++value->work.shifts;
  } else { ++value->work.reductions; value->work.popped+=step->pop; value->sequence=false; }
  return true;
}
size_t lr_parser_frame_count(LRParser* value) { return value->sequence ? value->evidence.size()+1 : value->stack.size(); }
void lr_parser_frame(LRParser* value,size_t index,LRFrame* result) {
  if(value->sequence) *result={value->runtime->sequence_states[index],SIZE_MAX,SIZE_MAX,0,index?size_t(value->evidence[index-1]):0};
  else *result=value->stack[index];
}
const LRFrame* lr_parser_frames(LRParser* value) { return value->stack.data(); }
void lr_parser_sequence_forest(LRParser* value,LRFrame* result) { *result=value->forest; }
size_t lr_parser_consumed(LRParser* value) { return value->consumed; }
bool lr_parser_shifted(LRParser* value) { return value->shifted; }
void lr_parser_work(LRParser* value,LRWork* result) { *result=value->work; }
}

struct LRProbe {
  LRRuntime* runtime;
  LRProbeBudget* budget;
  std::vector<LRProbeFrame> frames;
};
extern "C" {
LRProbe* lr_probe_create(LRParser* parser,LRProbeBudget* budget) {
  auto* value=new LRProbe{parser->runtime,budget,{}};
  for(size_t i=0;i<lr_parser_frame_count(parser);++i) {
    LRFrame frame; lr_parser_frame(parser,i,&frame);
    value->frames.push_back({frame.state,frame.length!=0});
  }
  return value;
}
LRProbe* lr_probe_clone(LRProbe* value) { return new LRProbe(*value); }
void lr_probe_destroy(LRProbe* value) { delete value; }
void lr_probe_reset(LRProbe* value) { value->frames={{0,false}}; }
size_t lr_probe_count(LRProbe* value) { return value->frames.size(); }
const LRProbeFrame* lr_probe_frames(LRProbe* value) { return value->frames.data(); }
bool lr_probe_accepts(LRProbe* value,uint32_t id) {
  LRAction action; return lr_runtime_action(value->runtime,value->frames.back().state,id,&action);
}
uint32_t lr_probe_step(LRProbe* value,uint32_t id,size_t* before) {
  *before=SIZE_MAX;
  auto& stack=value->frames;
  for(size_t steps=0;steps<128 && value->budget->remaining;++steps) {
    --value->budget->remaining;
    const auto state=stack.back().state; LRAction action;
    if(!lr_runtime_action(value->runtime,state,id,&action)) return 0;
    if(action.state!=SIZE_MAX) { *before=state; stack.push_back({action.state,false}); return 1; }
    if(!action.rule) return 2;
    const auto rule=value->runtime->rules[action.rule];
    if(rule.count>=stack.size()) return 0;
    const auto begin=stack.end()-rule.count;
    bool consumed=std::any_of(begin,stack.end(),[](auto frame){return frame.consumed;});
    stack.erase(begin,stack.end());
    const auto next=lr_runtime_goto(value->runtime,stack.back().state,rule.owner);
    if(next==SIZE_MAX) return 0;
    stack.push_back({next,consumed});
  }
  value->budget->complete=false; return 0;
}
}

// Reference tree assembly, retained only for the native bootstrap/differential tests.
extern "C" {
bool lr_tree_needs_label(void* node,void* kind) {
  auto* data=node ? static_cast<Match*>(tower_node_get_component_userdata(static_cast<TowerNode*>(node),static_cast<TowerNode*>(kind))) : nullptr;
  return !data || !*parser_match_get_label(data);
}
uint32_t lr_tree_shift(LRParser* parser,void* arena,LRGrammar* grammar,void* kind,const LRStep* step,void** input,const char* label) {
  auto* forest=static_cast<ParseForestStore*>(arena);
  auto* node=static_cast<TowerNode*>(*input); const bool supplied=node;
  if(node && tower_node_get_parent(node)) return 2;
  if(!node) node=tower_node_create();
  auto* data=static_cast<Match*>(tower_node_get_component_userdata(node,static_cast<TowerNode*>(kind)));
  if(!data) {
    data=parser_match_create(node); parser_match_set_id(data,step->id);
    parser_match_set_start(data,step->start); parser_match_set_length(data,step->end-step->start);
  }
  if(!*parser_match_get_label(data)) parser_match_set_label(data,label);
  ParseForest nodes;
  if(!parse_forest_leaf(forest,node,&nodes)) { if(!supplied) tower_node_release_ref(node); return 0; }
  *input=nullptr;
  if(step->kind==LR_SEQUENCE_SHIFT) {
    LRFrame frame; lr_parser_sequence_forest(parser,&frame);
    ParseForest joined{frame.first,frame.last};
    const auto symbol=parser->runtime->rules[step->rule].begin+step->pop;
    if(!parse_forest_join(forest,&joined,nodes.first,nodes.last,lr_grammar_capture(grammar,symbol))) return 0;
    nodes=joined;
  }
  return lr_parser_commit(parser,step,nodes.first,nodes.last);
}
bool lr_tree_reduce(LRParser* parser,void* arena,LRGrammar* grammar,const LRStep* step,void** result) {
  *result=nullptr; auto* forest=static_cast<ParseForestStore*>(arena);
  const auto rule=parser->runtime->rules[step->rule]; ParseForest children;
  if(step->kind==LR_SEQUENCE_REDUCE) {
    LRFrame frame; lr_parser_sequence_forest(parser,&frame); children={frame.first,frame.last};
  } else {
    const auto count=lr_parser_frame_count(parser),begin=count-step->pop;
    const auto* frames=lr_parser_frames(parser);
    for(size_t i=begin;i<count;++i)
      if(!parse_forest_join(forest,&children,frames[i].first,frames[i].last,lr_grammar_capture(grammar,rule.begin+i-begin))) return false;
  }
  if(!lr_grammar_generated(grammar,step->rule) || rule.owner==1) {
    auto* node=tower_node_create(); auto* data=parser_match_create(node);
    parser_match_set_id(data,uint32_t(rule.owner)); parser_match_set_rule_index(data,step->rule);
    parser_match_set_start(data,step->start); parser_match_set_length(data,step->end-step->start);
    parser_match_set_label(data,lr_grammar_name(grammar,rule.owner));
    if(!parse_forest_attach(forest,node,children.first)) {
      tower_node_release_ref(node); return false;
    }
    if(step->kind==LR_SEQUENCE_REDUCE) {
      const auto ok=lr_parser_commit(parser,step,SIZE_MAX,SIZE_MAX);
      if(ok) *result=node; else tower_node_release_ref(node);
      return ok;
    }
    if(!parse_forest_leaf(forest,node,&children)) { tower_node_release_ref(node); return false; }
  }
  return lr_parser_commit(parser,step,children.first,children.last);
}
void* lr_tree_accept(LRParser* parser,void* arena) {
  if(lr_parser_frame_count(parser)!=2) return nullptr;
  LRFrame frame; lr_parser_frame(parser,1,&frame);
  if(frame.first!=frame.last || frame.first==SIZE_MAX) return nullptr;
  return parse_forest_take(static_cast<ParseForestStore*>(arena),frame.first);
}
}
