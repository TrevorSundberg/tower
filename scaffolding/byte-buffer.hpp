#pragma once
#include <cstddef>
#include <cstdint>

// Temporary C ABI mirror of library/bytes.tower's ByteBuffer; tested at both widths.
struct TowerByteBuffer { uint8_t* data; size_t length, capacity; };
extern "C" void bytes_init(TowerByteBuffer*);
extern "C" bool bytes_reserve(TowerByteBuffer*, size_t needed);
extern "C" bool bytes_append(TowerByteBuffer*, const uint8_t* source, size_t count);
extern "C" bool bytes_push(TowerByteBuffer*, uint8_t value);
extern "C" bool bytes_assign_text(TowerByteBuffer*, const uint8_t* source, size_t count);
extern "C" void bytes_dispose(TowerByteBuffer*);
