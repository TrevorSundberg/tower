#include "../compiler-syntax-validation.hpp"
#include "../syntax.hpp"
#include <cassert>
#include <cstdio>
#include <map>
#include <random>
#include <string>
#include <vector>
extern "C" {
bool reference_syntax_validate(const SyntaxRuleView*,size_t,TowerNode* const*,size_t,TowerNode*,TowerByteBuffer*,size_t*,TowerNode**);
size_t tower_test_buffer_count();
void tower_test_buffer_fail_after(size_t);
}
namespace {
TowerNodeRef node(SyntaxKind kind) {
  auto value=TowerNodeRef::adopt(tower_node_create()); syntax_attach(value.get(),kind); return value;
}
TowerNodeRef term(std::string_view text,bool literal=false,char repetition=0,std::string_view capture="",size_t offset=SIZE_MAX) {
  auto value=node(SyntaxKind::Term); auto& data=syntax_node(value.get());
  data.text=text; data.literal=literal; data.repetition=repetition; data.capture=capture; data.start=offset;
  return value;
}
TowerNodeRef sequence(const std::vector<TowerNodeRef>& terms,size_t offset=SIZE_MAX) {
  auto value=node(SyntaxKind::Alternative); auto& data=syntax_node(value.get()); data.start=offset;
  for(const auto& term:terms) { tower_node_attach(term.get(),value.get()); data.items.push_back(term.get()); }
  return value;
}
struct Fixture {
  std::map<std::string,std::vector<TowerNodeRef>> definitions;
  std::vector<TowerNode*> tokens;
  std::vector<TowerNodeRef> extra_tokens;
  Fixture() {
    for(auto* entity:syntax_node(syntax_native_bedrock()).items) {
      const auto& data=syntax_node(entity);
      if(data.kind==SyntaxKind::Rule) {
        auto& list=definitions[data.name];
        for(auto* alternative:data.items) list.emplace_back(alternative);
      } else tokens.push_back(entity);
    }
  }
  void rule(const std::string& name,const std::vector<TowerNodeRef>& terms,size_t offset=SIZE_MAX) {
    definitions[name]={sequence(terms,offset)};
  }
  void token(const char* name,bool skip) {
    extra_tokens.push_back(node(skip?SyntaxKind::Skip:SyntaxKind::Token));
    syntax_node(extra_tokens.back().get()).name=name; tokens.push_back(extra_tokens.back().get());
  }
};
struct View {
  std::vector<std::vector<TowerNode*>> alternatives;
  std::vector<SyntaxRuleView> rules;
  std::vector<TowerNode*> pending;
  View(const Fixture& fixture) {
    alternatives.reserve(fixture.definitions.size()); rules.reserve(fixture.definitions.size());
    for(const auto& [name,list]:fixture.definitions) {
      auto& items=alternatives.emplace_back();
      for(const auto& item:list) items.push_back(item.get());
      rules.push_back({name.data(),name.size(),items.data(),items.size()});
    }
    pending.resize(rules.size());
  }
};
std::string text(const TowerByteBuffer& error) { return error.length?std::string(reinterpret_cast<const char*>(error.data),error.length):""; }
std::string compare(const Fixture& fixture,const char* expected=nullptr,size_t expected_offset=SIZE_MAX) {
  View x(fixture),y(fixture); TowerByteBuffer a{},b{}; size_t ax=777777,bx=ax;
  const auto buffers=tower_test_buffer_count(),nodes=tower_node_get_allocated_count();
  auto actual=syntax_validate(x.rules.data(),x.rules.size(),fixture.tokens.data(),fixture.tokens.size(),syntax_component_type(),&a,&ax,x.pending.data());
  auto reference=reference_syntax_validate(y.rules.data(),y.rules.size(),fixture.tokens.data(),fixture.tokens.size(),syntax_component_type(),&b,&bx,y.pending.data());
  auto message=text(a);
  if(actual!=reference || message!=text(b) || ax!=bx || x.pending!=y.pending)
    std::fprintf(stderr,"Validation parity: actual=%s at %zu; reference=%s at %zu\n",message.c_str(),ax,text(b).c_str(),bx);
  assert(actual==reference && message==text(b) && ax==bx && x.pending==y.pending);
  if(expected) { assert(message==expected); assert(actual==message.empty()); }
  if(expected_offset!=SIZE_MAX) assert(ax==expected_offset);
  bytes_dispose(&a); bytes_dispose(&b);
  assert(tower_test_buffer_count()==buffers && tower_node_get_allocated_count()==nodes);
  return message;
}
void failures(const Fixture& fixture) {
  const auto expected=compare(fixture); View view(fixture);
  const auto buffers=tower_test_buffer_count(),nodes=tower_node_get_allocated_count();
  bool finished=false;
  for(size_t failure=0;failure<1024 && !finished;++failure) {
    TowerByteBuffer error{}; size_t offset=123;
    tower_test_buffer_fail_after(failure);
    auto success=syntax_validate(view.rules.data(),view.rules.size(),fixture.tokens.data(),fixture.tokens.size(),syntax_component_type(),&error,&offset,view.pending.data());
    tower_test_buffer_fail_after(SIZE_MAX);
    finished=success || error.length!=0;
    if(finished) { assert(text(error)==expected); assert(success==expected.empty()); }
    else for(auto* term:view.pending) assert(!term);
    bytes_dispose(&error);
    assert(tower_test_buffer_count()==buffers && tower_node_get_allocated_count()==nodes);
  }
  assert(finished);
}
}
void syntax_validation_tests() {
  syntax_native_bedrock(); syntax_component_type();
  const auto buffers=tower_test_buffer_count(),nodes=tower_node_get_allocated_count();
  { Fixture f; compare(f,""); failures(f); }
  {
    Fixture f; f.rule("A",{term("B",false,0,"",10)}); f.rule("B",{term("Missing",false,0,"",20)});
    compare(f,""); failures(f);
    f.rule("Statement",{term("A",false,0,"",30)});
    compare(f,"Cannot activate incomplete grammar: Statement -> A -> B -> Missing (undefined rule 'Missing')",20);
    failures(f);
    f.rule("Missing",{term("ok",true)}); compare(f,"");
    f.rule("Missing",{}); compare(f,"Statement must consume input");
  }
  {
    Fixture f; f.rule("A",{term("B")}); f.rule("B",{term("A")});
    compare(f,"Unproductive grammar rule: A");
    f.definitions["B"].push_back(sequence({term("x",true)})); compare(f,"");
    f.rule("B",{}); f.rule("A",{term("B",false,'+')}); compare(f,"Cannot repeat nullable rule: B");
    f.rule("A",{term("B",false,'?')}); compare(f,"");
  }
  {
    Fixture f; f.rule("A",{term("Whitespace")}); compare(f,""); // Skip names are not tokens.
    f.rule("Statement",{term("A")}); compare(f,"Cannot activate incomplete grammar: Statement -> A -> Whitespace (undefined rule 'Whitespace')");
    f.rule("Statement",{term("Identifier")}); compare(f,"");
    f.rule("Identifier",{term("x",true)}); compare(f,"Name already defines a token or skip rule: Identifier");
  }
  for(const char* literal:{"","a b","//","/*","a'"}) {
    Fixture f; f.rule("A",{term(literal,true,0,"",5)}); assert(!compare(f).empty()); failures(f);
  }
  {
    Fixture f; f.rule("A",{term("a",true,0,"name"),term("b",true,0,"name")});
    compare(f,"Duplicate capture: name"); failures(f);
    f.rule("A",{term("a",true,0,std::string_view("a\0b",3)),term("b",true,0,std::string_view("a\0c",3))}); compare(f,"");
    f.rule(std::string("A\0x",3),{term("Identifier")}); compare(f,"");
    f.rule("Statement",{term(std::string_view("A\0x",3))}); compare(f,"");
    auto wildcard=term(""); syntax_node(wildcard.get()).terminal_set=true;
    f.rule("A",{wildcard}); compare(f,"");
  }
  for(const char* name:{"GrammarAlternatives","GrammarAssignment","GrammarAtom","GrammarDeclaration","GrammarReplacement","GrammarSequence","GrammarSkipDeclaration","GrammarStyle","GrammarSuffix","GrammarTerm","GrammarTokenDeclaration"}) {
    Fixture f; f.definitions.erase(name); assert(!compare(f).empty());
    f.rule(name,{term("x",true)},93); compare(f);
  }
  {
    Fixture f; f.rule("GrammarDeclaration",{term("x",true,0,"name")},81);
    compare(f,"Declaration rule GrammarDeclaration must preserve capture 'op'",81); failures(f);
    f.rule("GrammarAtom",{term("x",true)});
    compare(f,"GrammarAtom must capture a literal, reference or capture name");
  }
  {
    Fixture f; std::vector<TowerNodeRef> terms;
    for(size_t i=0;i<1500;++i) terms.push_back(term("a",true,0,"capture"+std::to_string(i)));
    f.rule("A",terms); compare(f,"");
    syntax_node(terms.back().get()).capture="capture0"; compare(f,"Duplicate capture: capture0");
  }
  // Random cyclic/acyclic dependency graphs, multiple missing names, repeats,
  // optional branches and empty alternatives check selection/order, not only acceptance.
  std::mt19937 random(0x56414c49);
  for(size_t trial=0;trial<600;++trial) {
    Fixture f; const size_t count=1+random()%12;
    for(size_t rule=0;rule<count;++rule) {
      auto& alternatives=f.definitions["R"+std::to_string(rule)];
      for(size_t a=0,n=1+random()%3;a<n;++a) {
        std::vector<TowerNodeRef> terms;
        for(size_t t=0,n=random()%5;t<n;++t) {
          const unsigned kind=random()%6; std::string name;
          if(kind==0) name="literal"; else if(kind==1) name="Identifier"; else name="R"+std::to_string(random()%(count+3));
          auto item=term(name,kind==0,"\0*+?"[random()%4],"",trial*100+t);
          if(kind==5) syntax_node(item.get()).terminal_set=true;
          terms.push_back(item);
        }
        alternatives.push_back(sequence(terms));
      }
    }
    if(trial%2) f.rule("Statement",{term("R0")});
    compare(f);
  }
  assert(tower_test_buffer_count()==buffers && tower_node_get_allocated_count()==nodes);
}
