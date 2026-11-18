// Transitional native bootstrap/reference for Tower syntax components.
#include "../syntax-nodes.hpp"
#include <cstring>
#include <new>
#include <utility>
extern "C" void* tower_allocate(size_t,size_t);
extern "C" void tower_deallocate(void*);
extern "C" {
size_t syntax_pattern_size() { return sizeof(LexPattern); }
void syntax_pattern_retain(const LexPattern* value) { if(value) ++value->references; }
void syntax_pattern_release(const LexPattern* value) {
  if(!value || --value->references) return;
  lex_table_destroy(value->table);
  if(value->grammar) tower_node_release_ref(value->grammar);
  tower_deallocate(const_cast<LexPattern*>(value));
}
LexPattern* syntax_pattern_create(TowerNode* grammar) {
  auto* memory=tower_allocate(sizeof(LexPattern),1); if(!memory) return nullptr;
  auto* value=new(memory) LexPattern{}; value->references=1; value->table=lex_table_create();
  if(!value->table) { syntax_pattern_release(value); return nullptr; }
  if(grammar) tower_node_add_ref(grammar);
  value->grammar=grammar; return value;
}
size_t syntax_node_size() { return sizeof(SyntaxNode); }
void syntax_node_init(SyntaxNode* value) {
  std::memset(value,0,sizeof(*value)); value->start=value->end=SIZE_MAX;
}
void syntax_node_source(SyntaxNode* value,const SyntaxSource* source) {
  syntax_source_retain(source); syntax_source_release(value->source); value->source=source;
}
void syntax_node_pattern(SyntaxNode* value,const LexPattern* pattern) {
  syntax_pattern_retain(pattern); syntax_pattern_release(value->compiled); value->compiled=pattern;
}
void syntax_node_replacement(SyntaxNode* value,TowerNode* replacement) {
  if(replacement) tower_node_add_ref(replacement);
  if(value->replacement) tower_node_release_ref(value->replacement);
  value->replacement=replacement;
}
void syntax_node_dispose(SyntaxNode* value) {
  bytes_dispose(&value->name.storage); bytes_dispose(&value->text.storage);
  bytes_dispose(&value->capture.storage); bytes_dispose(&value->style.storage);
  tower_deallocate(value->items.data); value->items={};
  for(size_t i=0;i<value->comments.length;++i) bytes_dispose(&value->comments.data[i].storage);
  tower_deallocate(value->comments.data); value->comments={};
  syntax_node_source(value,nullptr); syntax_node_pattern(value,nullptr); syntax_node_replacement(value,nullptr);
}
bool syntax_comments_push(SyntaxComments* values,const char* text,size_t length) {
  if(length==SIZE_MAX || values->length==SIZE_MAX) return false;
  TowerByteBuffer snapshot{};
  if(!bytes_assign_text(&snapshot,reinterpret_cast<const uint8_t*>(text),length)) return false;
  TowerByteBuffer storage{reinterpret_cast<uint8_t*>(values->data),values->length*sizeof(CoreName),values->capacity*sizeof(CoreName)};
  if(values->length >= SIZE_MAX/sizeof(CoreName) || !bytes_reserve(&storage,(values->length+1)*sizeof(CoreName))) {
    bytes_dispose(&snapshot); return false;
  }
  values->data=reinterpret_cast<CoreName*>(storage.data); values->capacity=storage.capacity/sizeof(CoreName);
  values->data[values->length++].storage=snapshot; return true;
}
int32_t syntax_nodes_equal(TowerNode* a,TowerNode* b,TowerNode* type,bool locations) {
  std::vector<std::pair<TowerNode*,TowerNode*>> pending{{a,b}};
  while(!pending.empty()) {
    auto [left,right]=pending.back(); pending.pop_back();
    if(left==right) continue;
    if(!left || !right) return 0;
    auto* x=static_cast<SyntaxNode*>(tower_node_get_component_userdata(left,type));
    auto* y=static_cast<SyntaxNode*>(tower_node_get_component_userdata(right,type));
    if(!x || !y) return 0;
    if(x->kind!=y->kind || x->name!=y->name || x->text!=y->text || x->capture!=y->capture ||
       x->style!=y->style || x->literal!=y->literal || x->append!=y->append ||
       x->contextual!=y->contextual || x->terminal_set!=y->terminal_set ||
       x->repetition!=y->repetition || x->items.size()!=y->items.size()) return 0;
    if(locations && x->kind==SyntaxKind::Template && (x->start!=y->start || x->end!=y->end)) return 0;
    for(size_t i=0;i<x->items.size();++i) pending.emplace_back(x->items[i],y->items[i]);
    pending.emplace_back(x->replacement,y->replacement);
  }
  return 1;
}
size_t syntax_node_offset(size_t field) {
  const size_t offsets[]={offsetof(SyntaxNode,kind),offsetof(SyntaxNode,name),offsetof(SyntaxNode,text),offsetof(SyntaxNode,capture),offsetof(SyntaxNode,style),offsetof(SyntaxNode,source),offsetof(SyntaxNode,literal),offsetof(SyntaxNode,append),offsetof(SyntaxNode,contextual),offsetof(SyntaxNode,terminal_set),offsetof(SyntaxNode,repetition),offsetof(SyntaxNode,items),offsetof(SyntaxNode,replacement),offsetof(SyntaxNode,comments),offsetof(SyntaxNode,start),offsetof(SyntaxNode,end),offsetof(SyntaxNode,compiled)};
  return field<std::size(offsets)?offsets[field]:0;
}
}
