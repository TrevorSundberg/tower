#include "../byte-buffer.hpp"
#include <algorithm>
#include <cassert>
#include <cstdlib>
#include <cstring>
#include <map>
#include <vector>
#include <cstdio>

extern "C" void reference_bytes_init(TowerByteBuffer*);
extern "C" bool reference_bytes_reserve(TowerByteBuffer*, size_t);
extern "C" bool reference_bytes_append(TowerByteBuffer*, const uint8_t*, size_t);
extern "C" bool reference_bytes_push(TowerByteBuffer*, uint8_t);
extern "C" bool reference_bytes_assign_text(TowerByteBuffer*, const uint8_t*, size_t);
extern "C" void reference_bytes_dispose(TowerByteBuffer*);

static std::map<void*, size_t> allocations;
static bool fail_next;
static size_t calls;
static void check_guard(void* p, size_t size) {
  auto* bytes = static_cast<uint8_t*>(p);
  for (size_t i = 0; i < 16; ++i) assert(bytes[ptrdiff_t(i) - 16] == 0xa5 && bytes[size + i] == 0xa5);
}
extern "C" void tower_deallocate(void* p) {
  if (!p) return;
  auto found = allocations.find(p); assert(found != allocations.end());
  check_guard(p, found->second); allocations.erase(found);
  std::free(static_cast<uint8_t*>(p) - 16);
}
extern "C" void* tower_reallocate(void* p, size_t count, size_t size) {
  ++calls;
  if (fail_next) { fail_next = false; return nullptr; }
  if (size && count > SIZE_MAX / size) return nullptr;
  size_t bytes = count * size; if (bytes > 262144) return nullptr;
  if (!bytes) { tower_deallocate(p); return nullptr; }
  auto* raw = static_cast<uint8_t*>(std::malloc(bytes + 32)); assert(raw);
  std::memset(raw, 0xa5, bytes + 32); auto* result = raw + 16;
  if (p) {
    auto found = allocations.find(p); assert(found != allocations.end());
    std::memcpy(result, p, std::min(bytes, found->second));
    tower_deallocate(p);
  }
  allocations[result] = bytes; return result; // Every successful resize moves.
}
static uint32_t state = 0x7148abcd;
static uint32_t next() { state ^= state << 13; state ^= state >> 17; state ^= state << 5; return state; }
static void equal(const TowerByteBuffer& actual, const TowerByteBuffer& expected) {
  assert(actual.length == expected.length && actual.capacity == expected.capacity);
  if (actual.capacity) assert(std::memcmp(actual.data, expected.data, actual.capacity) == 0);
  for (auto [p, size] : allocations) check_guard(p, size);
}
int main() {
  static_assert(offsetof(TowerByteBuffer, length) == sizeof(void*));
  static_assert(offsetof(TowerByteBuffer, capacity) == sizeof(void*) + sizeof(size_t));
  static_assert(sizeof(TowerByteBuffer) == sizeof(void*) + sizeof(size_t) * 2);
  TowerByteBuffer actual{}, expected{};
  bytes_init(&actual); reference_bytes_init(&expected);
  assert(bytes_append(&actual, nullptr, 0));
  assert(bytes_assign_text(&actual, nullptr, 0));
  assert(reference_bytes_assign_text(&expected, nullptr, 0));
  assert(actual.data[0] == 0 && actual.length == 0);
  equal(actual, expected);
  for (size_t step = 0; step < 20000; ++step) {
    const unsigned op = next() % 7;
    const size_t count = next() % 100, offset = actual.length ? next() % (actual.length + 1) : 0;
    std::vector<uint8_t> input(count); for (auto& byte : input) byte = uint8_t(next());
    const bool fail = next() % 5 == 0;
    auto apply = [&](TowerByteBuffer* b, bool reference) {
      fail_next = fail;
      bool result = true;
      switch (op) {
        case 0: result = reference ? reference_bytes_reserve(b, count * 30) : bytes_reserve(b, count * 30); break;
        case 1: result = reference ? reference_bytes_append(b, input.data(), count) : bytes_append(b, input.data(), count); break;
        case 2: result = reference ? reference_bytes_push(b, uint8_t(count)) : bytes_push(b, uint8_t(count)); break;
        case 3: result = reference ? reference_bytes_assign_text(b, input.data(), count) : bytes_assign_text(b, input.data(), count); break;
        case 4: if (b->data) result = reference ? reference_bytes_append(b, b->data + offset, b->length - offset) : bytes_append(b, b->data + offset, b->length - offset); break;
        case 5: if (b->data) result = reference ? reference_bytes_assign_text(b, b->data + offset, b->length - offset) : bytes_assign_text(b, b->data + offset, b->length - offset); break;
        case 6: if (reference) reference_bytes_dispose(b); else bytes_dispose(b); break;
      }
      fail_next = false; return result;
    };
    const auto old = actual;
    std::vector<uint8_t> content; if (actual.capacity) content.assign(actual.data, actual.data + actual.capacity);
    const bool result = apply(&actual, false);
    assert(result == apply(&expected, true)); equal(actual, expected);
    if (!result) {
      assert(actual.data == old.data && actual.length == old.length && actual.capacity == old.capacity);
      if (actual.capacity) assert(std::memcmp(actual.data, content.data(), content.size()) == 0);
    }
  }
  bytes_dispose(&actual); reference_bytes_dispose(&expected);
  // Adding a terminator to a completely full buffer must rebase its own input
  // after realloc moves it; read-before-free bugs can otherwise look like success.
  uint8_t full[16]; for (size_t i = 0; i < 16; ++i) full[i] = uint8_t(i);
  assert(bytes_append(&actual, full, 16)); assert(actual.capacity == 16);
  auto* old_pointer = actual.data;
  assert(bytes_assign_text(&actual, actual.data, 16));
  assert(actual.data != old_pointer && actual.length == 16 && actual.data[16] == 0);
  assert(std::memcmp(actual.data, full, 16) == 0);
  bytes_dispose(&actual);
  assert(bytes_append(&actual, reinterpret_cast<const uint8_t*>("abc"), 3));
  const auto before = calls;
  assert(!bytes_append(&actual, actual.data + actual.length, 1));
  assert(!bytes_assign_text(&actual, actual.data + actual.length + 1, 1));
  assert(!bytes_assign_text(&actual, nullptr, SIZE_MAX));
  assert(calls == before && actual.length == 3);
  auto artificial = actual; artificial.length = artificial.capacity = SIZE_MAX - 2;
  assert(!bytes_append(&artificial, nullptr, 3));
  assert(artificial.data == actual.data && calls == before);
  bytes_dispose(&actual); bytes_dispose(&actual); assert(allocations.empty());
  puts("Tower byte buffers: moving growth, failure atomicity, aliasing, guards and overflow passed.");
}
