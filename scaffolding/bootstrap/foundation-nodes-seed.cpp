// Transitional native seed for the Tower-defined Foundation component storage.
#include "../core.hpp"
#include "../compiler-foundation.hpp"
#include <cstring>
#include <algorithm>
extern "C" void* tower_reallocate(void*, size_t, size_t);
extern "C" void tower_deallocate(void*);
static bool reserve(CoreNodes* values,size_t needed) {
  if(needed<=values->capacity) return true;
  if(needed>SIZE_MAX/sizeof(TowerNode*)) return false;
  size_t capacity=values->capacity<=SIZE_MAX/2 ? values->capacity*2 : needed;
  capacity=std::max({capacity,needed,size_t(8)});
  if(capacity>SIZE_MAX/sizeof(TowerNode*)) capacity=needed;
  auto* next=static_cast<TowerNode**>(tower_reallocate(values->data,capacity,sizeof(TowerNode*)));
  if(!next) return false;
  values->data=next; values->capacity=capacity; return true;
}
extern "C" {
size_t foundation_node_size() { return sizeof(CoreNode); }
void foundation_node_init(CoreNode* value) {
  std::memset(static_cast<void*>(value),0,sizeof(CoreNode));
  value->type.pointer_bytes=4; value->element.pointer_bytes=4; value->alignment=1;
}
void foundation_node_dispose(CoreNode* value) {
  bytes_dispose(&value->name.storage);
  for(auto* list:{&value->items,&value->locals,&value->parameters}) {
    tower_deallocate(list->data); *list={};
  }
}
bool foundation_nodes_push(CoreNodes* values,TowerNode* node) {
  const size_t needed=values->length+1;
  if(!needed || !reserve(values,needed)) return false;
  values->data[values->length++]=node; return true;
}
bool foundation_nodes_erase(CoreNodes* values,size_t first,size_t count) {
  if(first>values->length || count>values->length-first) return false;
  const auto tail=values->length-first-count;
  if(tail) std::memmove(values->data+first,values->data+first+count,tail*sizeof(TowerNode*));
  values->length-=count; return true;
}
bool foundation_nodes_prepend(CoreNodes* values,TowerNode* const* source,size_t count) {
  if(!count) return true;
  const auto total=values->length+count;
  if(total<values->length) return false;
  const auto offset=reinterpret_cast<uintptr_t>(source)-reinterpret_cast<uintptr_t>(values->data);
  const bool inside=offset<values->capacity*sizeof(TowerNode*);
  const auto index=offset/sizeof(TowerNode*);
  if(inside && (offset%sizeof(TowerNode*) || index>values->length || count>values->length-index)) return false;
  if(!reserve(values,total)) return false;
  if(values->length) std::memmove(values->data+count,values->data,values->length*sizeof(TowerNode*));
  if(inside) source=values->data+index+count;
  std::memmove(values->data,source,count*sizeof(TowerNode*));
  values->length=total; return true;
}
bool foundation_name_append(TowerByteBuffer* value,uint8_t byte) {
  const size_t needed=value->length+2;
  if(needed<value->length || !bytes_reserve(value,needed)) return false;
  value->data[value->length++]=byte; value->data[value->length]=0; return true;
}
size_t foundation_node_offset(size_t field) {
  static const size_t offsets[]={offsetof(CoreNode,kind),offsetof(CoreNode,type),offsetof(CoreNode,op),offsetof(CoreNode,name),
    offsetof(CoreNode,binding),offsetof(CoreNode,left),offsetof(CoreNode,right),offsetof(CoreNode,value),offsetof(CoreNode,target),
    offsetof(CoreNode,body),offsetof(CoreNode,otherwise),offsetof(CoreNode,items),offsetof(CoreNode,locals),offsetof(CoreNode,parameters),
    offsetof(CoreNode,element),offsetof(CoreNode,size),offsetof(CoreNode,alignment),offsetof(CoreNode,length),offsetof(CoreNode,byte_offset),
    offsetof(CoreNode,frame_size),offsetof(CoreNode,index),offsetof(CoreNode,start),offsetof(CoreNode,end),offsetof(CoreNode,bits),
    offsetof(CoreNode,constant),offsetof(CoreNode,indirect),offsetof(CoreNode,external),offsetof(CoreNode,exported),offsetof(CoreNode,global)};
  return field<sizeof(offsets)/sizeof(*offsets) ? offsets[field] : 0;
}
}
