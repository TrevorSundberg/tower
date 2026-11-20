// Transitional seed/reference. Production reads shared entities in lr_grammar.tower.
#include "../compiler-lr.hpp"
#include "../parser.hpp"
#include <vector>
#include <string>
#include <map>
#include <algorithm>
#include <numeric>
#include <tuple>

struct LRGrammar {
  std::vector<std::string> names;
  std::vector<size_t> order;
  std::vector<LRProduction> rules;
  std::vector<LRSymbol> symbols;
  std::vector<void*> rule_nodes, symbol_nodes;
  std::vector<bool> generated;
  std::vector<std::string> captures;
  std::vector<std::pair<std::string,size_t>> missing;
};
extern "C" {
LRGrammar* lr_grammar_create(void* input,void* rule_kind,void* reference_kind,void* string_kind,void* range_kind) {
  auto* root=static_cast<TowerNode*>(input);
  auto* result=new LRGrammar;
  result->names.push_back("S'"); result->rules.push_back({0,0,0});
  result->rule_nodes.push_back(nullptr); result->generated.push_back(false);
  std::map<std::string,size_t> names;
  for(size_t i=0;i<tower_node_get_child_count(root);++i) {
    auto* node=tower_node_get_child(root,i);
    auto* rule=static_cast<Rule*>(tower_node_get_component_userdata(node,static_cast<TowerNode*>(rule_kind)));
    if(!rule) { delete result; return nullptr; }
    auto [found,added]=names.try_emplace(parser_rule_get_name(rule),result->names.size());
    if(added) result->names.push_back(found->first);
    result->rules.push_back({found->second,0,0}); result->rule_nodes.push_back(node);
    result->generated.push_back(parser_rule_get_generated(rule));
  }
  std::vector<size_t> order(result->names.size()); std::iota(order.begin(),order.end(),0);
  std::sort(order.begin(),order.end(),[&](size_t a,size_t b){return std::tie(result->names[a],a)<std::tie(result->names[b],b);});
  result->order.resize(order.size());
  for(size_t i=0;i<order.size();++i) result->order[order[i]]=i;
  auto append=[&](LRSymbol symbol,TowerNode* node,const char* capture="") {
    result->symbols.push_back(symbol); result->symbol_nodes.push_back(node); result->captures.push_back(capture);
  };
  if(result->names.size()>1) { append({1,0xfffffffe,0xfffffffe},nullptr); result->rules[0].count=1; }
  for(size_t r=1;r<result->rules.size();++r) {
    auto& rule=result->rules[r]; rule.begin=result->symbols.size();
    auto* parent=static_cast<TowerNode*>(result->rule_nodes[r]);
    for(size_t i=0;i<tower_node_get_child_count(parent);++i) {
      auto* node=tower_node_get_child(parent,i);
      if(auto* ref=static_cast<Reference*>(tower_node_get_component_userdata(node,static_cast<TowerNode*>(reference_kind)))) {
        const auto* name=parser_reference_get_name(ref); auto found=names.find(name);
        if(found==names.end()) result->missing.emplace_back(name,result->symbols.size());
        append({found==names.end()?SIZE_MAX:found->second,0xfffffffe,0xfffffffe},node,parser_reference_get_capture(ref));
      }
      if(auto* text=static_cast<String*>(tower_node_get_component_userdata(node,static_cast<TowerNode*>(string_kind))))
        for(size_t p=0;p<parser_string_get_length(text);++p) {
          auto id=parser_string_get_data(text)[p]; append({SIZE_MAX,id,id},node);
        }
      if(auto* range=static_cast<Range*>(tower_node_get_component_userdata(node,static_cast<TowerNode*>(range_kind)))) {
        auto first=parser_range_get_start(range),last=parser_range_get_end(range);
        append({SIZE_MAX,std::min(first,last),std::max(first,last)},node);
      }
    }
    rule.count=result->symbols.size()-rule.begin;
  }
  return result;
}
void lr_grammar_destroy(LRGrammar* value) { delete value; }
size_t lr_grammar_rule_count(LRGrammar* value) { return value->rules.size(); }
const LRProduction* lr_grammar_rule_data(LRGrammar* value) { return value->rules.data(); }
void* lr_grammar_rule_node(LRGrammar* value,size_t index) { return value->rule_nodes[index]; }
bool lr_grammar_generated(LRGrammar* value,size_t index) { return value->generated[index]; }
size_t lr_grammar_symbol_count(LRGrammar* value) { return value->symbols.size(); }
const LRSymbol* lr_grammar_symbol_data(LRGrammar* value) { return value->symbols.data(); }
void* lr_grammar_symbol_node(LRGrammar* value,size_t index) { return value->symbol_nodes[index]; }
const char* lr_grammar_capture(LRGrammar* value,size_t index) { return value->captures[index].c_str(); }
size_t lr_grammar_name_count(LRGrammar* value) { return value->names.size(); }
const char* lr_grammar_name(LRGrammar* value,size_t index) { return value->names[index].c_str(); }
size_t lr_grammar_name_order(LRGrammar* value,size_t index) { return value->order[index]; }
size_t lr_grammar_missing_count(LRGrammar* value) { return value->missing.size(); }
const char* lr_grammar_missing_name(LRGrammar* value,size_t index) { return value->missing[index].first.c_str(); }
bool lr_grammar_resolve(LRGrammar* value,size_t index,uint32_t id) {
  if(index>=value->missing.size() || id==0xfffffffe) return false;
  auto& symbol=value->symbols[value->missing[index].second]; symbol.first=symbol.last=id; return true;
}
void lr_grammar_finish(LRGrammar* value) {
  std::vector<LRProduction>().swap(value->rules);
  std::vector<LRSymbol>().swap(value->symbols);
  std::fill(value->rule_nodes.begin(),value->rule_nodes.end(),nullptr);
  std::fill(value->symbol_nodes.begin(),value->symbol_nodes.end(),nullptr);
  std::vector<std::pair<std::string,size_t>>().swap(value->missing);
}
}
