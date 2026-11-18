#include "../compiler-syntax-lexer.hpp"
#include "../lex-pattern.hpp"
#include <cassert>
#include <cstring>
#include <random>
#include <string>
#include <vector>
extern "C" {
SyntaxLexicon* reference_lexicon_create();
void reference_lexicon_destroy(SyntaxLexicon*);
bool reference_lexicon_token(SyntaxLexicon*,LexerTable*,uint32_t,const char*,bool,bool,bool);
bool reference_lexicon_literal(SyntaxLexicon*,const char*,size_t,uint32_t,bool);
bool reference_lexicon_start(SyntaxLexicon*,const char*,size_t);
void reference_lexicon_choose(SyntaxLexicon*,const char*,size_t,size_t,bool,LRRuntime*,size_t,LexiconChoice*);
void reference_lexicon_skip(SyntaxLexicon*,const char*,size_t,size_t,LexiconChoice*);
size_t reference_lexicon_identifier(SyntaxLexicon*,const char*,size_t,size_t);
bool reference_lexicon_declaration(SyntaxLexicon*,const char*,size_t,size_t);
size_t tower_test_buffer_count();
void tower_test_buffer_fail_after(size_t);
}
namespace {
LRRuntime* runtime(std::initializer_list<uint32_t> accepted) {
  std::vector<LRProduction> rules{{0,0,1}};
  std::vector<LRSymbol> symbols{{1,0,0}};
  for(auto id:accepted) { rules.push_back({1,symbols.size(),1}); symbols.push_back({SIZE_MAX,id,id}); }
  auto* analysis=lr_analysis_create(rules.data(),rules.size(),symbols.data(),symbols.size(),2);
  assert(analysis && lr_analysis_compute(analysis));
  auto* states=lr_states_create(analysis); assert(states && lr_states_lalr(states,false));
  auto* result=lr_runtime_create(states); assert(result);
  lr_states_destroy(states); lr_analysis_destroy(analysis); return result;
}
void equal(const LexiconChoice& a,const LexiconChoice& b) {
  assert(a.length==b.length && a.id==b.id && a.skipped==b.skipped && a.checks==b.checks);
  assert(!strcmp(a.style,b.style));
}
}
void syntax_lexer_tests() {
  std::string error;
  auto warm=lex_pattern_compile("a",error); assert(warm);
  const auto baseline=tower_test_buffer_count();
  {
    const char* patterns[]={"[a-z_][a-z0-9_]*","[a-z]+","[ \\t]+","[ \\t]+","[0-9]+","雪+"};
    const char* styles[]={"identifier","contextual","comment","contextual trivia","number","unicode"};
    std::vector<std::shared_ptr<const LexPattern>> compiled;
    auto* a=lexicon_create(); auto* b=reference_lexicon_create(); assert(a && b);
    for(size_t i=0;i<6;++i) {
      compiled.push_back(lex_pattern_compile(patterns[i],error)); assert(compiled.back());
      const bool skip=i==2 || i==3, contextual=i==1 || i==3;
      assert(lexicon_token(a,compiled.back()->table,uint32_t(10+i),styles[i],skip,contextual,i==0));
      assert(reference_lexicon_token(b,compiled.back()->table,uint32_t(10+i),styles[i],skip,contextual,i==0));
    }
    const char* literals[]={"for","fn","+","++","雪"};
    for(size_t i=0;i<5;++i) {
      assert(lexicon_literal(a,literals[i],strlen(literals[i]),uint32_t(20+i),i==0));
      assert(reference_lexicon_literal(b,literals[i],strlen(literals[i]),uint32_t(20+i),i==0));
    }
    for(const char* text:{"for","fn"}) {
      assert(lexicon_start(a,text,strlen(text)) && reference_lexicon_start(b,text,strlen(text)));
    }
    std::vector<LRRuntime*> contexts{nullptr,runtime({10}),runtime({11}),runtime({10,11}),runtime({13,22}),runtime({21,23,24})};
    std::vector<std::string> inputs{"","for","forage","fn","fn_name","name","name_","123"," ","\t  ","+","++","+++","雪","雪雪"};
    std::mt19937 random(0x4c455849);
    const std::string alphabet="forname_ 012+\t雪";
    for(size_t i=0;i<150;++i) {
      std::string text;
      for(size_t j=0,count=random()%16;j<count;++j) text+=alphabet[random()%alphabet.size()];
      inputs.push_back(text);
    }
    for(const auto& source:inputs) for(size_t start=0;start<=source.size()+1;++start) {
      LexiconChoice x,y;
      lexicon_skip(a,source.data(),source.size(),start,&x);
      reference_lexicon_skip(b,source.data(),source.size(),start,&y); equal(x,y);
      assert(lexicon_identifier(a,source.data(),source.size(),start)==reference_lexicon_identifier(b,source.data(),source.size(),start));
      assert(lexicon_declaration(a,source.data(),source.size(),start)==reference_lexicon_declaration(b,source.data(),source.size(),start));
      for(auto* context:contexts) for(bool declaration:{false,true}) {
        lexicon_choose(a,source.data(),source.size(),start,declaration,context,0,&x);
        reference_lexicon_choose(b,source.data(),source.size(),start,declaration,context,0,&y); equal(x,y);
      }
    }
    LexiconChoice choice;
    lexicon_choose(a,"forage",6,0,false,nullptr,0,&choice); assert(choice.id==10 && choice.length==6);
    lexicon_choose(a,"name",4,0,false,contexts[2],0,&choice); assert(choice.id==11);
    lexicon_choose(a,"name",4,0,false,contexts[3],0,&choice); assert(choice.id==10);
    lexicon_choose(a,"for",3,0,true,nullptr,0,&choice); assert(choice.id==20 && !strcmp(choice.style,"keyword"));
    lexicon_choose(a,"fn",2,0,true,nullptr,0,&choice); assert(choice.id==10);
    lexicon_choose(a,"fn",2,0,true,contexts[5],0,&choice); assert(choice.id==21);
    assert(lexicon_declaration(a,"for",3,0) && !lexicon_declaration(a,"forage",6,0));
    for(auto* context:contexts) if(context) lr_runtime_destroy(context);
    lexicon_destroy(a); reference_lexicon_destroy(b);
  }
  assert(tower_test_buffer_count()==baseline);
  tower_test_buffer_fail_after(0); assert(!lexicon_create()); tower_test_buffer_fail_after(SIZE_MAX);
  {
    auto* value=lexicon_create(); assert(value);
    tower_test_buffer_fail_after(0);
    assert(!lexicon_token(value,warm->table,1,"token",false,false,true));
    tower_test_buffer_fail_after(SIZE_MAX);
    LexiconChoice choice; lexicon_choose(value,"a",1,0,false,nullptr,0,&choice); assert(!choice.length && choice.id==0xfffffffe);
    assert(lexicon_token(value,warm->table,1,"token",false,false,true));
    tower_test_buffer_fail_after(0); assert(!lexicon_literal(value,"a",1,2,true)); tower_test_buffer_fail_after(SIZE_MAX);
    lexicon_choose(value,"a",1,0,false,nullptr,0,&choice); assert(choice.id==1 && choice.length==1);
    tower_test_buffer_fail_after(0); assert(!lexicon_start(value,"a",1)); tower_test_buffer_fail_after(SIZE_MAX);
    assert(!lexicon_declaration(value,"a",1,0));
    lexicon_destroy(value);
  }
  assert(tower_test_buffer_count()==baseline);
}
