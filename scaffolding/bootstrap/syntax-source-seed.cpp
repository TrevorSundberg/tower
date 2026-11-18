// Transitional source-snapshot reference for the native bootstrap.
#include "../compiler-source.hpp"
#include <algorithm>
#include <cstring>
#include <new>
extern "C" void* tower_allocate(size_t,size_t);
extern "C" void tower_deallocate(void*);
extern "C" {
size_t syntax_source_size() { return sizeof(SyntaxSource); }
void syntax_source_retain(const SyntaxSource* value) { if(value) ++value->references; }
void syntax_source_release(const SyntaxSource* source) {
  if(!source || --source->references) return;
  auto* value=const_cast<SyntaxSource*>(source);
  bytes_dispose(&value->name.storage); bytes_dispose(&value->text.storage); tower_deallocate(value);
}
SyntaxSource* syntax_source_create(const char* name,const char* text,size_t length) {
  if(length==SIZE_MAX) return nullptr;
  auto* memory=tower_allocate(sizeof(SyntaxSource),1); if(!memory) return nullptr;
  auto* value=new(memory) SyntaxSource{}; value->references=1;
  if(!bytes_assign_text(&value->name.storage,reinterpret_cast<const uint8_t*>(name),strlen(name)) ||
      !bytes_assign_text(&value->text.storage,reinterpret_cast<const uint8_t*>(text),length)) {
    syntax_source_release(value); return nullptr;
  }
  return value;
}
void syntax_source_location(const SyntaxSource* value,size_t offset,size_t* line,size_t* column) {
  *line=*column=1;
  for(size_t i=0;i<std::min(offset,value->text.size());++i) {
    const auto byte=static_cast<unsigned char>(value->text.data()[i]);
    if(byte=='\n') { ++*line; *column=1; }
    else if((byte&0xc0)!=0x80) ++*column;
  }
}
}
