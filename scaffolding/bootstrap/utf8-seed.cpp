// Bootstrap/reference only. Normal compiler targets link compiler/utf8.tower.
// Keep this implementation independent of generated objects to break the build cycle.
#include "../compiler-utf8.hpp"

extern "C" size_t tower_utf8_decode(const uint8_t* data, size_t size, uint32_t* value) {
  *value = 0;
  if (!size) return 0;
  uint32_t c = data[0], scalar;
  size_t count;
  uint32_t minimum;
  if (c < 128) { *value = c; return 1; }
  if (c >= 0xc2 && c <= 0xdf) { count = 2; scalar = c & 31; minimum = 0x80; }
  else if (c >= 0xe0 && c <= 0xef) { count = 3; scalar = c & 15; minimum = 0x800; }
  else if (c >= 0xf0 && c <= 0xf4) { count = 4; scalar = c & 7; minimum = 0x10000; }
  else return 0;
  if (size < count) return 0;
  for (size_t i = 1; i < count; ++i) {
    c = data[i];
    if ((c & 0xc0) != 0x80) return 0;
    scalar = (scalar << 6) | (c & 63);
  }
  if (scalar < minimum || scalar > 0x10ffff || (scalar >= 0xd800 && scalar <= 0xdfff)) return 0;
  *value = scalar;
  return count;
}

extern "C" size_t tower_utf8_encode(uint32_t scalar, uint8_t* output, size_t capacity) {
  if (scalar > 0x10ffff || (scalar >= 0xd800 && scalar <= 0xdfff)) return 0;
  size_t count = scalar <= 0x7f ? 1 : scalar <= 0x7ff ? 2 : scalar <= 0xffff ? 3 : 4;
  if (!output) return count;
  if (capacity < count) return 0;
  switch (count) {
    case 1: output[0] = uint8_t(scalar); break;
    case 2: output[0] = uint8_t(0xc0 | (scalar >> 6)); output[1] = uint8_t(0x80 | (scalar & 63)); break;
    case 3: output[0] = uint8_t(0xe0 | (scalar >> 12)); output[1] = uint8_t(0x80 | ((scalar >> 6) & 63)); output[2] = uint8_t(0x80 | (scalar & 63)); break;
    case 4: output[0] = uint8_t(0xf0 | (scalar >> 18)); output[1] = uint8_t(0x80 | ((scalar >> 12) & 63)); output[2] = uint8_t(0x80 | ((scalar >> 6) & 63)); output[3] = uint8_t(0x80 | (scalar & 63)); break;
  }
  return count;
}

extern "C" uint32_t tower_utf8_validate(const uint8_t* data, size_t size, uint32_t reject_nul) {
  size_t offset = 0;
  while (offset < size) {
    uint32_t value;
    size_t count = tower_utf8_decode(data + offset, size - offset, &value);
    if (!count || (reject_nul && value == 0)) return 0;
    offset += count;
  }
  return 1;
}
