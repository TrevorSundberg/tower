#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

int32_t fixture_add(int32_t a, int32_t b) { return a + b; }
int32_t fixture_sum(int32_t* values, size_t count) { int32_t sum = 0; for (size_t i = 0; i < count; ++i) sum += values[i]; return sum; }
void fixture_write(int32_t* values, size_t count) { for (size_t i = 0; i < count; ++i) values[i] = (int32_t)i + 10; }
int32_t* fixture_identity(int32_t* value) { return value; }
uint64_t fixture_wide(uint64_t value) { return value + 1; }
uint8_t fixture_byte(uint8_t value) { return (uint8_t)(value + 1); }
bool fixture_bool(bool value) { return !value; }
size_t fixture_length(const uint8_t* text) { size_t n = 0; while (text[n]) ++n; return n; }
struct PointerBox { uint8_t tag; int32_t* data; size_t count; };
size_t fixture_box(struct PointerBox* box) { box->data[1] = box->tag + 40; return sizeof(*box); }
extern int32_t tower_twice(int32_t value);
int32_t fixture_callback(int32_t value) { return tower_twice(value); }
