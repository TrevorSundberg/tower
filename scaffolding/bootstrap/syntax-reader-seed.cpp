// Transitional native bootstrap/reference. Production declaration reading is Tower.
#include "../compiler-syntax-reader.hpp"
#include "../parser.hpp"
#include <algorithm>
#include <cstring>
#include <string>
namespace {
bool letter(char c) { return (c>='a' && c<='z') || (c>='A' && c<='Z') || c=='_'; }
bool digit(char c) { return c>='0' && c<='9'; }
struct Reader {
  const SyntaxSource* source; TowerNode* match_kind; std::string error;
  TowerNode* member(TowerNode* n,const char* role) { return n?tower_node_get_child_member(n,role):nullptr; }
  TowerNode* required(TowerNode* n,const char* role) {
    auto* value=member(n,role);
    if(!value && error.empty()) error="Malformed bedrock tree: missing capture '"+std::string(role)+"'";
    return value;
  }
  Match* span(TowerNode* n) {
    auto* m=n?static_cast<Match*>(tower_node_get_component_userdata(n,match_kind)):nullptr;
    if(!m) { if(error.empty()) error="Malformed bedrock tree: missing source span"; return nullptr; }
    const auto start=parser_match_get_start(m), length=parser_match_get_length(m);
    if(start>source->text.size() || length>source->text.size()-start) {
      if(error.empty()) error="Malformed bedrock tree: source span outside source";
      return nullptr;
    }
    return m;
  }
  std::string text(TowerNode* n) {
    auto* m=span(n); return m?std::string(source->text.view().substr(parser_match_get_start(m),parser_match_get_length(m))):"";
  }
  SyntaxNode* attach(TowerNode* n,SyntaxKind kind) {
    auto& value=syntax_attach(n,kind); auto* m=span(n); if(!m) return nullptr;
    value.start=parser_match_get_start(m); value.end=value.start+parser_match_get_length(m);
    syntax_node_source(&value,source); return &value;
  }
  bool name(TowerNode* n,CoreName& output) {
    auto value=text(n); if(!error.empty()) return false;
    if(!syntax_identifier_decode(value.data(),value.size(),&output.storage)) error="Unable to allocate grammar declaration";
    return error.empty();
  }
  bool quoted(TowerNode* n,CoreName& output) {
    auto* m=span(n); if(!m) return false;
    auto at=parser_match_get_start(m); auto input=source->text.view();
    if(at==input.size()) { error="Unterminated quoted literal"; return false; }
    const char quote=input[at++];
    while(at<input.size()) {
      char c=input[at++];
      if(c==quote) return true;
      if(c=='\n' || c=='\r') { error="Newline in quoted literal"; return false; }
      if(c=='\\') {
        if(at==input.size()) break;
        c=input[at++];
        switch(c) {
          case 'n': c='\n'; break; case 'r': c='\r'; break; case 't': c='\t'; break;
          case '\\': case '\'': case '"': break;
          default: error="Unsupported literal escape"; return false;
        }
      }
      output+=c;
    }
    error="Unterminated quoted literal"; return false;
  }
  bool term(TowerNode* n) {
    auto* value=attach(n,SyntaxKind::Term); if(!value) return false;
    auto* atom=required(n,"atom"); auto* suffix=required(n,"suffix"); if(!error.empty()) return false;
    auto* literal=member(atom,"literal"); auto* reference=member(atom,"reference"); auto* capture=member(atom,"capture");
    if(auto* exclusions=member(atom,"set")) {
      value->terminal_set=true;
      while(exclusions && tower_node_get_child_count(exclusions)) {
        auto* item=required(exclusions,"literal"); if(!item) return false;
        auto* exclusion=attach(item,SyntaxKind::Term); if(!exclusion) return false;
        exclusion->literal=true; if(!quoted(item,exclusion->text)) return false;
        auto status=syntax_literal_check(exclusion->text.data(),exclusion->text.size());
        if(status) {
          error=status==1?"Token literal is empty. Expected at least one character between the quotes.":"Unsupported token literal: "+exclusion->text;
          return false;
        }
        value->items.push_back(item); exclusions=member(exclusions,"previous");
      }
      std::reverse(value->items.begin(),value->items.end());
    } else if(literal) {
      value->literal=true; if(!quoted(literal,value->text)) return false;
    } else if(reference || capture) {
      if(!name(reference?reference:capture,value->text)) return false;
      if(capture && !name(capture,value->capture)) return false;
    } else { error="Malformed bedrock atom: expected literal, reference or capture"; return false; }
    const auto repetition=text(suffix); if(!error.empty()) return false;
    if(!repetition.empty()) {
      if(repetition!="*" && repetition!="+" && repetition!="?") { error="Unknown grammar repetition: "+repetition; return false; }
      value->repetition=repetition[0];
    }
    return true;
  }
  bool sequence(TowerNode* n) {
    auto* value=attach(n,SyntaxKind::Alternative); if(!value) return false;
    while(tower_node_get_child_count(n)) {
      auto* item=required(n,"term"); auto* previous=required(n,"previous");
      if(!error.empty() || !term(item)) return false;
      value->items.push_back(item); n=previous;
    }
    std::reverse(value->items.begin(),value->items.end()); return true;
  }
  bool rule(TowerNode* n) {
    auto* label=required(n,"name"); auto* assignment=required(n,"op");
    auto* alternatives=required(n,"alternatives"); auto* replacement=required(n,"replacement");
    if(!error.empty()) return false;
    auto* value=attach(n,SyntaxKind::Rule); if(!value || !name(label,value->name)) return false;
    if(value->name.empty()) { error="Rule name cannot be empty"; return false; }
    auto op=text(assignment); if(!error.empty()) return false;
    if(op!="=" && op!="|=") { error="Unknown grammar assignment: "+op; return false; }
    value->append=op=="|=";
    while(alternatives) {
      auto* item=required(alternatives,"sequence"); if(!item || !sequence(item)) return false;
      value->items.push_back(item); alternatives=member(alternatives,"previous");
    }
    std::reverse(value->items.begin(),value->items.end());
    if(auto* body=member(replacement,"body")) {
      auto* m=span(body); if(!m) return false;
      if(parser_match_get_length(m)<2) { error="Replacement body must contain opening and closing delimiters"; return false; }
      auto* result=attach(body,SyntaxKind::Template); if(!result) return false;
      result->start=parser_match_get_start(m)+1; auto length=parser_match_get_length(m)-2;
      result->end=result->start+length; result->text=source->text.view().substr(result->start,length);
      syntax_node_replacement(value,body);
      for(auto* item:value->items) syntax_node_replacement(&syntax_node(item),body);
    }
    return true;
  }
  bool token(TowerNode* n,bool skipped) {
    auto* label=required(n,"name"); auto* pattern=required(n,"pattern"); auto* style=required(n,"style");
    if(!error.empty()) return false;
    auto* value=attach(n,skipped?SyntaxKind::Skip:SyntaxKind::Token);
    if(!value || !name(label,value->name)) return false;
    if(value->name.empty()) { error="Token name cannot be empty"; return false; }
    if(auto* kind=member(style,"kind")) { if(!name(kind,value->style)) return false; }
    else value->style=skipped?"":"identifier";
    auto envelope=text(pattern); if(!error.empty()) return false;
    if(envelope.size()<2) { error="Token pattern must contain opening and closing delimiters"; return false; }
    value->text=std::string_view(envelope).substr(1,envelope.size()-2);
    if(auto* mode=member(n,"mode")) value->contextual=!text(mode).empty();
    if(!error.empty()) return false;
    if(value->contextual && skipped) { error="Skip rules cannot be contextual"; return false; }
    return true;
  }
  bool finish(TowerByteBuffer* output) {
    if(error.empty()) return true;
    if(!bytes_assign_text(output,reinterpret_cast<const uint8_t*>(error.data()),error.size())) bytes_dispose(output);
    return false;
  }
};
}
extern "C" {
bool syntax_identifier_decode(const char* text,size_t length,TowerByteBuffer* output) {
  std::string_view input(text,length); std::string value;
  if(length<2 || input.front()!='\x60' || input.back()!='\x60') value=input;
  else for(size_t i=1;i+1<length;++i) {
    char c=input[i];
    if(c=='\\' && i+2<length) { c=input[++i]; if(c=='n') c='\n'; else if(c=='r') c='\r'; else if(c=='t') c='\t'; }
    value+=c;
  }
  return bytes_assign_text(output,reinterpret_cast<const uint8_t*>(value.data()),value.size());
}
uint32_t syntax_literal_check(const char* text,size_t length) {
  std::string_view value(text,length); if(value.empty()) return 1;
  bool word=letter(value.front()),letters=false;
  for(char c:value) {
    if(c==0 || c==' ' || c=='\t' || c=='\r' || c=='\n' || c=='\'' || c=='"') return 2;
    const bool alpha=letter(c)||digit(c); word&=alpha; letters|=alpha;
  }
  return (letters && !word) || value.starts_with("//") || value.starts_with("/*")?2:0;
}
size_t syntax_identifier_decode_in_place(char* text,size_t length) {
  TowerByteBuffer value{};
  if(!syntax_identifier_decode(text,length,&value)) std::abort();
  const auto count=value.length;
  std::memcpy(text,value.data,count+1); bytes_dispose(&value); return count;
}
bool syntax_read_rule(TowerNode* node,const SyntaxSource* source,TowerNode* match_kind,TowerNode*,TowerByteBuffer* error) {
  Reader reader{source,match_kind,{}}; reader.rule(node); return reader.finish(error);
}
bool syntax_read_token(TowerNode* node,const SyntaxSource* source,TowerNode* match_kind,TowerNode*,bool skipped,TowerByteBuffer* error) {
  Reader reader{source,match_kind,{}}; reader.token(node,skipped); return reader.finish(error);
}
}
