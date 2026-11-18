#include "../syntax-nodes.hpp"
#include <cassert>
#include <cstring>
#include <type_traits>
#include <vector>

extern "C" size_t tower_test_buffer_count();
extern "C" void tower_test_buffer_fail_after(size_t);

namespace {
bool reference_equal(TowerNode* a,TowerNode* b,bool locations) {
  std::vector<std::pair<TowerNode*,TowerNode*>> pending{{a,b}};
  while(!pending.empty()) {
    auto [left,right]=pending.back(); pending.pop_back();
    if(left==right) continue;
    if(!left || !right) return false;
    auto* x=syntax_get(left); auto* y=syntax_get(right);
    if(!x || !y) return false;
    if(x->kind!=y->kind || x->name!=y->name || x->text!=y->text || x->capture!=y->capture ||
       x->style!=y->style || x->literal!=y->literal || x->append!=y->append ||
       x->contextual!=y->contextual || x->terminal_set!=y->terminal_set ||
       x->repetition!=y->repetition || x->items.size()!=y->items.size()) return false;
    if(locations && x->kind==SyntaxKind::Template && (x->start!=y->start || x->end!=y->end)) return false;
    for(size_t i=0;i<x->items.size();++i) pending.emplace_back(x->items[i],y->items[i]);
    pending.emplace_back(x->replacement,y->replacement);
  }
  return true;
}
void compare(TowerNode* a,TowerNode* b) {
  for(bool locations:{false,true}) {
    assert(syntax_equal(a,b,locations)==reference_equal(a,b,locations));
    assert(syntax_equal(b,a,locations)==reference_equal(b,a,locations));
  }
}
TowerNodeRef node(SyntaxKind kind) {
  auto result=TowerNodeRef::adopt(tower_node_create()); syntax_attach(result.get(),kind); return result;
}
}
void syntax_nodes_tests() {
  syntax_component_type();
  const auto buffers=tower_test_buffer_count(), nodes=tower_node_get_allocated_count();
  static_assert(std::is_standard_layout_v<SyntaxNode> && std::is_trivially_destructible_v<SyntaxNode>);
  static_assert(std::is_standard_layout_v<LexPattern> && std::is_trivially_destructible_v<LexPattern>);
  assert(syntax_node_size()==sizeof(SyntaxNode) && syntax_pattern_size()==sizeof(LexPattern));
  const size_t offsets[]={offsetof(SyntaxNode,kind),offsetof(SyntaxNode,name),offsetof(SyntaxNode,text),offsetof(SyntaxNode,capture),offsetof(SyntaxNode,style),offsetof(SyntaxNode,source),offsetof(SyntaxNode,literal),offsetof(SyntaxNode,append),offsetof(SyntaxNode,contextual),offsetof(SyntaxNode,terminal_set),offsetof(SyntaxNode,repetition),offsetof(SyntaxNode,items),offsetof(SyntaxNode,replacement),offsetof(SyntaxNode,comments),offsetof(SyntaxNode,start),offsetof(SyntaxNode,end),offsetof(SyntaxNode,compiled)};
  for(size_t i=0;i<std::size(offsets);++i) assert(syntax_node_offset(i)==offsets[i]);
  {
    auto a=node(SyntaxKind::Rule), b=node(SyntaxKind::Rule);
    auto& x=syntax_node(a.get()); auto& y=syntax_node(b.get());
    assert(x.start==SIZE_MAX && x.end==SIZE_MAX && !x.source && !x.replacement && !x.compiled);
    assert(x.name.empty() && x.items.empty() && x.comments.size()==0);
    compare(a.get(),b.get()); compare(a.get(),nullptr);
    for(auto field:{&SyntaxNode::name,&SyntaxNode::text,&SyntaxNode::capture,&SyntaxNode::style}) {
      x.*field=std::string_view("a\0b",3); compare(a.get(),b.get()); assert(!syntax_equal(a.get(),b.get()));
      y.*field=std::string_view("a\0c",3); compare(a.get(),b.get()); assert(!syntax_equal(a.get(),b.get()));
      y.*field=x.*field; compare(a.get(),b.get()); assert(syntax_equal(a.get(),b.get()));
    }
    for(auto field:{&SyntaxNode::literal,&SyntaxNode::append,&SyntaxNode::contextual,&SyntaxNode::terminal_set}) {
      x.*field=true; compare(a.get(),b.get()); assert(!syntax_equal(a.get(),b.get()));
      y.*field=true; compare(a.get(),b.get()); assert(syntax_equal(a.get(),b.get()));
    }
    x.repetition='*'; compare(a.get(),b.get()); assert(!syntax_equal(a.get(),b.get()));
    y.repetition='*';
    x.start=7; x.end=11; y.start=70; y.end=110;
    compare(a.get(),b.get()); assert(syntax_equal(a.get(),b.get(),true));
    x.kind=SyntaxKind::Template; compare(a.get(),b.get()); assert(!syntax_equal(a.get(),b.get()));
    y.kind=SyntaxKind::Template; compare(a.get(),b.get());
    assert(syntax_equal(a.get(),b.get()) && !syntax_equal(a.get(),b.get(),true));
    y.start=x.start; y.end=x.end;
    auto source=SyntaxSourceRef::adopt(syntax_source_create("retained.tower","source",6));
    syntax_node_source(&x,source.get()); syntax_node_source(&x,source.get());
    assert(source->references==2);
    x.comments.emplace_back("comment");
    compare(a.get(),b.get()); assert(syntax_equal(a.get(),b.get(),true));
    // Copy an existing comment across list growth, preserving embedded NULs.
    while(x.comments.size()<8) x.comments.emplace_back(std::string_view("q\0r",3));
    auto saved=x.comments.data[1].view();
    assert(syntax_comments_push(&x.comments,saved.data(),saved.size()));
    assert(x.comments.data[8].view()==saved && !x.comments.data[8].data()[3]);
    auto c=node(SyntaxKind::Template), d=node(SyntaxKind::Template);
    syntax_node_replacement(&x,c.get()); syntax_node_replacement(&x,c.get());
    assert(tower_node_get_ref_count(c.get())==2);
    compare(a.get(),b.get()); assert(!syntax_equal(a.get(),b.get()));
    syntax_node_replacement(&y,d.get());
    compare(a.get(),b.get()); assert(syntax_equal(a.get(),b.get(),true));
    auto pattern=LexPatternRef::adopt(syntax_pattern_create(c.get())); assert(pattern);
    assert(tower_node_get_ref_count(c.get())==3 && pattern->references==1);
    syntax_node_pattern(&x,pattern.get()); syntax_node_pattern(&x,pattern.get());
    assert(pattern->references==2);
    auto retained=pattern; auto moved=std::move(retained); assert(!retained && moved.get()==pattern.get());
    compare(a.get(),b.get()); assert(syntax_equal(a.get(),b.get(),true));
    source={}; pattern={}; moved={};
    assert(x.source->references==1 && x.compiled->references==1);
    assert(tower_node_remove_component(a.get(),syntax_component_type()));
    assert(tower_node_get_ref_count(c.get())==1);
    auto& fresh=syntax_attach(a.get(),SyntaxKind::Document);
    assert(!fresh.source && !fresh.compiled && !fresh.replacement && !fresh.comments.size());
  }
  assert(tower_test_buffer_count()==buffers && tower_node_get_allocated_count()==nodes);
  {
    auto a=node(SyntaxKind::Rule), b=node(SyntaxKind::Rule);
    auto& x=syntax_node(a.get()); auto& y=syntax_node(b.get());
    for(size_t i=0;i<64;++i) {
      auto left=node(SyntaxKind::Term), right=node(SyntaxKind::Term);
      syntax_node(left.get()).text=std::to_string(i); syntax_node(right.get()).text=std::to_string(i);
      tower_node_attach(left.get(),a.get()); tower_node_attach(right.get(),b.get());
      x.items.push_back(left.get()); y.items.push_back(right.get());
    }
    compare(a.get(),b.get()); assert(syntax_equal(a.get(),b.get()));
    const auto live=tower_test_buffer_count();
    bool success=false;
    for(size_t failure=0;failure<16 && !success;++failure) {
      tower_test_buffer_fail_after(failure);
      auto result=syntax_nodes_equal(a.get(),b.get(),syntax_component_type(),false);
      tower_test_buffer_fail_after(SIZE_MAX);
      assert(result==-1 || result==1); success=result==1;
      assert(tower_test_buffer_count()==live);
    }
    assert(success);
    for(size_t i=0;i<x.items.size();++i) {
      syntax_node(x.items[i]).text="different"; compare(a.get(),b.get()); assert(!syntax_equal(a.get(),b.get()));
      syntax_node(x.items[i]).text=std::to_string(i);
    }
    auto empty=TowerNodeRef::adopt(tower_node_create());
    compare(a.get(),empty.get());
  }
  assert(tower_test_buffer_count()==buffers && tower_node_get_allocated_count()==nodes);
  {
    auto owner=node(SyntaxKind::Term);
    auto& comments=syntax_node(owner.get()).comments;
    for(size_t i=0;i<8;++i) comments.emplace_back("preserved");
    const auto live=tower_test_buffer_count();
    for(size_t failure=0;failure<2;++failure) {
      auto* data=comments.data; const auto capacity=comments.capacity;
      tower_test_buffer_fail_after(failure);
      assert(!syntax_comments_push(&comments,comments.data[0].data(),9));
      tower_test_buffer_fail_after(SIZE_MAX);
      assert(comments.data==data && comments.capacity==capacity && comments.size()==8);
      for(const auto& comment:comments) assert(comment=="preserved");
      assert(tower_test_buffer_count()==live);
    }
    assert(!syntax_comments_push(&comments,nullptr,SIZE_MAX));
    for(size_t failure=0;failure<2;++failure) {
      tower_test_buffer_fail_after(failure);
      assert(!syntax_pattern_create(owner.get()));
      tower_test_buffer_fail_after(SIZE_MAX);
      assert(tower_node_get_ref_count(owner.get())==1 && tower_test_buffer_count()==live);
    }
  }
  assert(tower_test_buffer_count()==buffers && tower_node_get_allocated_count()==nodes);
}
