// Transitional bootstrap/reference. Production links lr-analysis.tower instead.
#include "../compiler-lr.hpp"
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
  LRConflict conflict{SIZE_MAX,{},{}};
  size_t rows=0;
};
extern "C" {
LRRuntime* lr_runtime_create(LRStates* source) {
  auto* value=new LRRuntime;
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
}
