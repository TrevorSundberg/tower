#include "../compiler-lr.hpp"
#include "../parser.hpp"
#include <cassert>
#include <cstring>
#include <random>
#include <string>
#include <vector>
extern "C" {
LRGrammar* reference_lr_grammar_create(void*,void*,void*,void*,void*);
void reference_lr_grammar_destroy(LRGrammar*);
size_t reference_lr_grammar_rule_count(LRGrammar*);
const LRProduction* reference_lr_grammar_rule_data(LRGrammar*);
void* reference_lr_grammar_rule_node(LRGrammar*,size_t);
bool reference_lr_grammar_generated(LRGrammar*,size_t);
size_t reference_lr_grammar_symbol_count(LRGrammar*);
const LRSymbol* reference_lr_grammar_symbol_data(LRGrammar*);
void* reference_lr_grammar_symbol_node(LRGrammar*,size_t);
const char* reference_lr_grammar_capture(LRGrammar*,size_t);
size_t reference_lr_grammar_name_count(LRGrammar*);
const char* reference_lr_grammar_name(LRGrammar*,size_t);
size_t reference_lr_grammar_name_order(LRGrammar*,size_t);
size_t reference_lr_grammar_missing_count(LRGrammar*);
const char* reference_lr_grammar_missing_name(LRGrammar*,size_t);
bool reference_lr_grammar_resolve(LRGrammar*,size_t,uint32_t);
size_t tower_test_buffer_count();
void tower_test_buffer_fail_after(size_t);
}
namespace {
LRGrammar* create(TowerNode* root,bool reference=false) {
  auto fn=reference ? reference_lr_grammar_create : lr_grammar_create;
  return fn(root,parser_rule_get_type(),parser_reference_get_type(),parser_string_get_type(),parser_range_get_type());
}
void compare(TowerNode* root) {
  auto* actual=create(root); auto* expected=create(root,true);
  assert(actual && expected);
  const auto missing=lr_grammar_missing_count(actual);
  assert(missing==reference_lr_grammar_missing_count(expected));
  for(size_t i=0;i<missing;++i) {
    assert(!strcmp(lr_grammar_missing_name(actual,i),reference_lr_grammar_missing_name(expected,i)));
    assert(!lr_grammar_resolve(actual,i,PARSER_ID_EOF));
    assert(lr_grammar_resolve(actual,i,uint32_t(0x200000+i)));
    assert(reference_lr_grammar_resolve(expected,i,uint32_t(0x200000+i)));
  }
  assert(!lr_grammar_resolve(actual,missing,42));
  assert(lr_grammar_name_count(actual)==reference_lr_grammar_name_count(expected));
  for(size_t i=0;i<lr_grammar_name_count(actual);++i) {
    assert(!strcmp(lr_grammar_name(actual,i),reference_lr_grammar_name(expected,i)));
    assert(lr_grammar_name_order(actual,i)==reference_lr_grammar_name_order(expected,i));
  }
  assert(lr_grammar_rule_count(actual)==reference_lr_grammar_rule_count(expected));
  for(size_t i=0;i<lr_grammar_rule_count(actual);++i) {
    auto a=lr_grammar_rule_data(actual)[i], b=reference_lr_grammar_rule_data(expected)[i];
    assert(a.owner==b.owner && a.begin==b.begin && a.count==b.count);
    assert(lr_grammar_rule_node(actual,i)==reference_lr_grammar_rule_node(expected,i));
    assert(lr_grammar_generated(actual,i)==reference_lr_grammar_generated(expected,i));
  }
  assert(lr_grammar_symbol_count(actual)==reference_lr_grammar_symbol_count(expected));
  const auto symbols=lr_grammar_symbol_count(actual);
  for(size_t i=0;i<symbols;++i) {
    auto a=lr_grammar_symbol_data(actual)[i], b=reference_lr_grammar_symbol_data(expected)[i];
    assert(a.nonterminal==b.nonterminal && a.first==b.first && a.last==b.last);
    assert(lr_grammar_symbol_node(actual,i)==reference_lr_grammar_symbol_node(expected,i));
    assert(!strcmp(lr_grammar_capture(actual,i),reference_lr_grammar_capture(expected,i)));
  }
  // Table labels/captures are revision snapshots. Their source can be edited or
  // released after the construction inputs have been consumed.
  lr_grammar_finish(actual);
  tower_node_release_ref(root);
  for(size_t i=0;i<lr_grammar_name_count(actual);++i)
    assert(!strcmp(lr_grammar_name(actual,i),reference_lr_grammar_name(expected,i)));
  for(size_t i=0;i<symbols;++i)
    assert(!strcmp(lr_grammar_capture(actual,i),reference_lr_grammar_capture(expected,i)));
  lr_grammar_destroy(actual); reference_lr_grammar_destroy(expected);
}
}
void lr_grammar_tests() {
  auto* root=tower_node_create();
  const char* names[] = {"Root","later","S'","","z","alpha","雪"};
  for(auto name:names) {
    auto* rule=parser_rule_create_subtree(root,name,true);
    for(auto reference:names) {
      auto* node=parser_reference_create_subtree(rule,reference);
      auto* ref=static_cast<Reference*>(tower_node_get_component_userdata(node,parser_reference_get_type()));
      parser_reference_set_capture(ref,"snapshot");
    }
    parser_string_create_subtree_utf8_null_terminated(rule,"abc");
    parser_range_create_subtree(rule,0xffffffff,0xfffffff0);
    parser_reference_create_subtree(rule,"external");
  }
  const auto baseline=tower_test_buffer_count();
  bool success=false;
  for(size_t i=0;i<2048 && !success;++i) {
    tower_test_buffer_fail_after(i);
    auto* value=create(root); success=value!=nullptr;
    lr_grammar_destroy(value);
    tower_test_buffer_fail_after(SIZE_MAX);
    assert(tower_test_buffer_count()==baseline);
  }
  assert(success); compare(root);
  std::mt19937 random(0x4752414d);
  for(size_t trial=0;trial<150;++trial) {
    const auto before=tower_test_buffer_count();
    auto* grammar=tower_node_create();
    size_t rules=1+random()%32;
    for(size_t r=0;r<rules;++r) {
      auto* rule=parser_rule_create_subtree(grammar,names[random()%7],random()%2!=0);
      size_t count=random()%8;
      for(size_t i=0;i<count;++i) {
        auto choice=random()%4;
        if(choice==0 || choice==3) {
          auto* node=parser_reference_create_subtree(rule,random()%2 ? names[random()%7] : "unbound");
          auto* ref=static_cast<Reference*>(tower_node_get_component_userdata(node,parser_reference_get_type()));
          parser_reference_set_capture(ref,names[random()%7]);
          if(choice==3) {
            parser_string_append_utf8_null_terminated(parser_string_create(node),"xy");
            auto* range=parser_range_create(node);
            parser_range_set_start(range,9); parser_range_set_end(range,2);
          }
        } else if(choice==1) parser_string_create_subtree_utf8_null_terminated(rule,random()%2 ? "abc雪" : "");
        else parser_range_create_subtree(rule,random(),random());
      }
    }
    compare(grammar);
    assert(tower_test_buffer_count()==before);
  }
}
