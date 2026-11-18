// Transitional reference. Production token selection runs syntax-lexer.tower.
#include "../compiler-syntax-lexer.hpp"
#include <vector>
#include <string_view>
#include <algorithm>
struct LexiconToken { LexerTable* table; uint32_t id; const char* style; bool skip,contextual,identifier; };
struct LexiconLiteral { const char* text; size_t length; uint32_t id; bool word,declaration; };
struct SyntaxLexicon { std::vector<LexiconToken> tokens; std::vector<LexiconLiteral> literals,starts; };
namespace {
bool letter(unsigned char c) { return (c>='a' && c<='z') || (c>='A' && c<='Z') || c=='_'; }
bool word(std::string_view text) {
  return !text.empty() && letter(text.front()) && std::all_of(text.begin(),text.end(),[](unsigned char c){return letter(c) || (c>='0' && c<='9');});
}
bool prefix(const char* source,size_t length,size_t start,const char* text,size_t count) {
  return start<=length && count<=length-start && std::string_view(source+start,count)==std::string_view(text,count);
}
bool accepts(LRRuntime* runtime,size_t state,uint32_t id,LexiconChoice* choice) {
  if(!runtime || state==SIZE_MAX) return false;
  ++choice->checks; LRAction action; return lr_runtime_action(runtime,state,id,&action);
}
size_t match(LexerTable* table,const char* source,size_t length,size_t start) {
  return lex_table_match(table,reinterpret_cast<const uint8_t*>(source),length,start);
}
void reset(LexiconChoice* choice) { *choice={0,0xfffffffe,"",false,0}; }
}
extern "C" {
SyntaxLexicon* lexicon_create() { return new SyntaxLexicon; }
void lexicon_destroy(SyntaxLexicon* value) { delete value; }
bool lexicon_token(SyntaxLexicon* value,LexerTable* table,uint32_t id,const char* style,bool skip,bool contextual,bool identifier) {
  value->tokens.push_back({table,id,style,skip,contextual,identifier}); return true;
}
bool lexicon_literal(SyntaxLexicon* value,const char* text,size_t length,uint32_t id,bool declaration) {
  value->literals.push_back({text,length,id,word({text,length}),declaration}); return true;
}
bool lexicon_start(SyntaxLexicon* value,const char* text,size_t length) { value->starts.push_back({text,length,0,false,false}); return true; }
void lexicon_choose(SyntaxLexicon* value,const char* source,size_t length,size_t start,bool declaration,LRRuntime* runtime,size_t state,LexiconChoice* choice) {
  reset(choice);
  for(auto token:value->tokens) {
    if(token.contextual && !accepts(runtime,state,token.id,choice)) continue;
    auto count=match(token.table,source,length,start);
    if(count>choice->length || (count && count==choice->length && token.contextual && !accepts(runtime,state,choice->id,choice))) {
      choice->length=count; choice->id=token.id; choice->style=token.style; choice->skipped=token.skip;
    }
  }
  for(auto literal:value->literals)
    if((!declaration || literal.declaration || accepts(runtime,state,literal.id,choice)) && literal.length>=choice->length &&
        prefix(source,length,start,literal.text,literal.length)) {
      choice->length=literal.length; choice->id=literal.id; choice->style=literal.word ? "keyword" : "operator"; choice->skipped=false;
    }
}
void lexicon_skip(SyntaxLexicon* value,const char* source,size_t length,size_t start,LexiconChoice* choice) {
  reset(choice);
  for(auto token:value->tokens) if(token.skip) {
    auto count=match(token.table,source,length,start);
    if(count>choice->length) { choice->length=count; choice->id=token.id; choice->style=token.style; choice->skipped=true; }
  }
}
size_t lexicon_identifier(SyntaxLexicon* value,const char* source,size_t length,size_t start) {
  for(auto token:value->tokens) if(token.identifier) return match(token.table,source,length,start);
  return 0;
}
bool lexicon_declaration(SyntaxLexicon* value,const char* source,size_t length,size_t start) {
  for(auto keyword:value->starts) if(prefix(source,length,start,keyword.text,keyword.length)) {
    bool longer=false;
    for(auto token:value->tokens) if(!token.skip && !token.contextual && match(token.table,source,length,start)>keyword.length) { longer=true; break; }
    if(!longer) return true;
  }
  return false;
}
}
