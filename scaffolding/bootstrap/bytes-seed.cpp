// Independent transitional bootstrap/reference only; production uses bytes.tower.
#include "../byte-buffer.hpp"
#include <cstring>
#include <limits>
extern "C" void* tower_reallocate(void*, size_t, size_t);
extern "C" void tower_deallocate(void*);

extern "C" void bytes_init(TowerByteBuffer* b) { *b = {}; }
extern "C" bool bytes_reserve(TowerByteBuffer* b, size_t needed) {
  if (needed <= b->capacity) return true;
  size_t capacity = b->capacity <= SIZE_MAX / 2 ? b->capacity * 2 : needed;
  if (capacity < needed) capacity = needed;
  if (capacity < 16) capacity = 16;
  auto* data = static_cast<uint8_t*>(tower_reallocate(b->data, capacity, 1));
  if (!data) return false;
  b->data = data; b->capacity = capacity;
  return true;
}
static bool alias(TowerByteBuffer* b, const uint8_t* source, size_t count, size_t& offset, bool& inside) {
  offset = reinterpret_cast<uintptr_t>(source) - reinterpret_cast<uintptr_t>(b->data);
  inside = offset < b->capacity;
  return !inside || (offset <= b->length && count <= b->length - offset);
}
extern "C" bool bytes_append(TowerByteBuffer* b, const uint8_t* source, size_t count) {
  if (!count) return true;
  if (count > SIZE_MAX - b->length) return false;
  size_t offset; bool inside;
  if (!alias(b, source, count, offset, inside) || !bytes_reserve(b, b->length + count)) return false;
  if (inside) source = b->data + offset;
  std::memmove(b->data + b->length, source, count); b->length += count;
  return true;
}
extern "C" bool bytes_push(TowerByteBuffer* b, uint8_t value) { return bytes_append(b, &value, 1); }
extern "C" bool bytes_assign_text(TowerByteBuffer* b, const uint8_t* source, size_t count) {
  if (count == SIZE_MAX) return false;
  size_t offset; bool inside;
  if (!alias(b, source, count, offset, inside) || !bytes_reserve(b, count + 1)) return false;
  if (count) std::memmove(b->data, inside ? b->data + offset : source, count);
  b->data[count] = 0; b->length = count;
  return true;
}
extern "C" void bytes_dispose(TowerByteBuffer* b) { tower_deallocate(b->data); bytes_init(b); }
