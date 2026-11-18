#include "../compiler-syntax-reader.hpp"
#include "../compiler-generics.hpp"
#include "../syntax.hpp"
#include "../format.hpp"
#include <cassert>
#include <random>
#include <string>
#include <vector>
extern "C" {
bool reference_syntax_read_rule(TowerNode*,const SyntaxSource*,TowerNode*,TowerNode*,TowerByteBuffer*);
bool reference_syntax_read_token(TowerNode*,const SyntaxSource*,TowerNode*,TowerNode*,bool,TowerByteBuffer*);
bool reference_syntax_identifier_decode(const char*,size_t,TowerByteBuffer*);
uint32_t reference_syntax_literal_check(const char*,size_t);
size_t tower_test_buffer_count();
void tower_test_buffer_fail_after(size_t);
}
namespace {
std::string contents(const TowerByteBuffer& value) { return value.length?std::string(reinterpret_cast<const char*>(value.data),value.length):""; }
TowerNodeRef clone(TowerNode* source) {
  size_t copied=0; auto result=TowerNodeRef::adopt(compiler_clone_tree(source,10000,&copied)); assert(result); return result;
}
bool read(TowerNode* node,const SyntaxSource* source,SyntaxKind kind,TowerByteBuffer* error,bool reference=false) {
  if(kind==SyntaxKind::Rule) return (reference?reference_syntax_read_rule:syntax_read_rule)(node,source,parser_match_get_type(),syntax_component_type(),error);
  return (reference?reference_syntax_read_token:syntax_read_token)(node,source,parser_match_get_type(),syntax_component_type(),kind==SyntaxKind::Skip,error);
}
void compare(TowerNode* input,const SyntaxSource* source,SyntaxKind kind,bool success,const char* expected=nullptr) {
  auto a=clone(input),b=clone(input); TowerByteBuffer x{},y{};
  const bool actual=read(a.get(),source,kind,&x),reference=read(b.get(),source,kind,&y,true);
  assert(actual==success && reference==success);
  assert(contents(x)==contents(y));
  if(expected) assert(contents(x)==expected);
  if(success) {
    assert(syntax_equal(a.get(),b.get(),true));
    assert(tower_format(a.get()).source==tower_format(b.get()).source);
    std::vector<TowerNode*> pending{a.get()};
    while(!pending.empty()) {
      auto* node=pending.back(); pending.pop_back(); const auto& value=syntax_node(node);
      assert(value.source==source && value.start<=value.end && value.end<=source->text.size());
      for(auto* item:value.items) pending.push_back(item);
      if(value.replacement) pending.push_back(value.replacement);
    }
  }
  bytes_dispose(&x); bytes_dispose(&y);
}
void fixture(const std::string& text,SyntaxKind kind,bool failures) {
  auto* session=syntax_create(text.c_str());
  auto root=TowerNodeRef::adopt(syntax_next(session));
  if(!root) std::fprintf(stderr,"Reader fixture: %s\n%s\n",text.c_str(),syntax_get_error(session));
  assert(root);
  auto* declaration=tower_node_get_child(root.get(),0);
  auto source=SyntaxSourceRef(syntax_node(declaration).source);
  syntax_destroy(session);
  compare(declaration,source.get(),kind,true);
  if(kind==SyntaxKind::Rule) {
    auto broken=clone(declaration);
    auto* assignment=tower_node_get_child_member(broken.get(),"op");
    auto* m=static_cast<Match*>(tower_node_get_component_userdata(assignment,parser_match_get_type()));
    const auto length=parser_match_get_length(m);
    parser_match_set_start(m,SIZE_MAX);
    compare(broken.get(),source.get(),kind,false,"Malformed bedrock tree: source span outside source");
    parser_match_set_start(m,source->text.size()); parser_match_set_length(m,length);
    compare(broken.get(),source.get(),kind,false,"Malformed bedrock tree: source span outside source");
    auto* replacement=tower_node_get_child_member(broken.get(),"replacement");
    if(auto* body=tower_node_get_child_member(replacement,"body")) {
      auto other=clone(declaration);
      body=tower_node_get_child_member(tower_node_get_child_member(other.get(),"replacement"),"body");
      parser_match_set_length(static_cast<Match*>(tower_node_get_component_userdata(body,parser_match_get_type())),1);
      compare(other.get(),source.get(),kind,false,"Replacement body must contain opening and closing delimiters");
    }
  } else {
    auto broken=clone(declaration);
    auto* pattern=tower_node_get_child_member(broken.get(),"pattern");
    parser_match_set_length(static_cast<Match*>(tower_node_get_component_userdata(pattern,parser_match_get_type())),1);
    compare(broken.get(),source.get(),kind,false,"Token pattern must contain opening and closing delimiters");
  }
  if(failures) {
    // Warm the persistent component-type index before measuring per-call cleanup.
    { auto warm=clone(declaration); TowerByteBuffer error{}; assert(read(warm.get(),source.get(),kind,&error)); bytes_dispose(&error); }
    const auto buffers=tower_test_buffer_count(),nodes=tower_node_get_allocated_count();
    bool success=false;
    for(size_t failure=0;failure<512 && !success;++failure) {
      {
        auto copy=clone(declaration); TowerByteBuffer error{};
        tower_test_buffer_fail_after(failure);
        success=read(copy.get(),source.get(),kind,&error);
        tower_test_buffer_fail_after(SIZE_MAX);
        if(!success) assert(!error.length || contents(error)=="Unable to allocate grammar declaration");
        bytes_dispose(&error);
      }
      assert(tower_test_buffer_count()==buffers && tower_node_get_allocated_count()==nodes);
    }
    assert(success);
  }
}
}
void syntax_reader_tests() {
  std::mt19937 random(0x52454144);
  for(size_t i=0;i<1000;++i) {
    std::string text;
    for(size_t j=0;j<i%40;++j) text+=char(random()%256);
    if(i%2) text="`"+text+"`";
    TowerByteBuffer a{},b{};
    assert(syntax_identifier_decode(text.data(),text.size(),&a));
    assert(reference_syntax_identifier_decode(text.data(),text.size(),&b));
    assert(contents(a)==contents(b));
    auto in_place=text;
    in_place.resize(syntax_identifier_decode_in_place(in_place.data(),in_place.size()));
    assert(in_place==contents(b));
    assert(syntax_literal_check(text.data(),text.size())==reference_syntax_literal_check(text.data(),text.size()));
    bytes_dispose(&a); bytes_dispose(&b);
  }
  {
    TowerByteBuffer value{}; const std::string source="prefix`a\\nb\\t\\`c`";
    assert(bytes_assign_text(&value,reinterpret_cast<const uint8_t*>(source.data()),source.size()));
    assert(syntax_identifier_decode(reinterpret_cast<const char*>(value.data)+6,value.length-6,&value));
    assert(contents(value)=="a\nb\t`c");
    auto saved=contents(value); auto* address=value.data;
    tower_test_buffer_fail_after(0);
    assert(!syntax_identifier_decode(std::string(1000,'x').data(),1000,&value));
    tower_test_buffer_fail_after(SIZE_MAX);
    assert(value.data==address && contents(value)==saved);
    assert(!syntax_identifier_decode(nullptr,SIZE_MAX,&value)); bytes_dispose(&value);
  }
  fixture("parse Example = 'a' $name:Identifier* | 'b' Identifier? | ;",SyntaxKind::Rule,true);
  fixture("parse Example = [^'{' '}']+;",SyntaxKind::Rule,true);
  fixture("parse `escaped\\tname` = Identifier;",SyntaxKind::Rule,false);
  fixture("parse Statement |= 'noop' ';' => replace { print(1); };",SyntaxKind::Rule,true);
  fixture("token Example = /[a-z]+/ when expected as string;",SyntaxKind::Token,true);
  fixture("token Example = /[a-z]+/;",SyntaxKind::Token,false);
  fixture("skip Example = /[~]+/ as comment;",SyntaxKind::Skip,true);
  fixture("skip Example = /[~]+/;",SyntaxKind::Skip,false);
  {
    auto node=TowerNodeRef::adopt(tower_node_create());
    auto source=SyntaxSourceRef::adopt(syntax_source_create("bad.tower","",0));
    TowerByteBuffer error{};
    tower_test_buffer_fail_after(0);
    assert(!syntax_read_rule(node.get(),source.get(),parser_match_get_type(),syntax_component_type(),&error));
    tower_test_buffer_fail_after(SIZE_MAX);
    assert(!error.length && !error.data);
    compare(node.get(),source.get(),SyntaxKind::Rule,false,"Malformed bedrock tree: missing capture 'name'");
  }
}
