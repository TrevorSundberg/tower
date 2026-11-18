#include "../compiler-utf8.hpp"
#include <array>
#include <cassert>
#include <cstdio>
#include <cstring>
#if defined(__unix__) || defined(__APPLE__)
#include <sys/mman.h>
#include <unistd.h>
#endif

extern "C" size_t reference_utf8_decode(const uint8_t*, size_t, uint32_t*);
extern "C" size_t reference_utf8_encode(uint32_t, uint8_t*, size_t);
extern "C" uint32_t reference_utf8_validate(const uint8_t*, size_t, uint32_t);

static uint32_t random_bits = 0x729831ab;
static uint32_t next() { random_bits ^= random_bits << 13; random_bits ^= random_bits >> 17; random_bits ^= random_bits << 5; return random_bits; }

static void check(const uint8_t* bytes, size_t size) {
  uint32_t actual = 0xdeadbeef, expected = actual;
  auto count = tower_utf8_decode(bytes, size, &actual);
  assert(count == reference_utf8_decode(bytes, size, &expected));
  assert(actual == expected);
  if (!count) assert(actual == 0);
  for (auto policy : {0u, 1u, 42u})
    assert(tower_utf8_validate(bytes, size, policy) == reference_utf8_validate(bytes, size, policy));
}

int main() {
  check(nullptr, 0);
  // Every Unicode scalar, all surrogate values, and the first out-of-range value.
  for (uint32_t scalar = 0; scalar <= 0x110000; ++scalar) {
    std::array<uint8_t, 6> actual, expected;
    actual.fill(0xa5); expected.fill(0xa5);
    const auto count = tower_utf8_encode(scalar, actual.data() + 1, 4);
    assert(count == reference_utf8_encode(scalar, expected.data() + 1, 4));
    assert(actual == expected);
    assert(tower_utf8_encode(scalar, nullptr, 0) == count);
    if (count) {
      uint32_t decoded = 0;
      assert(tower_utf8_decode(actual.data() + 1, count, &decoded) == count);
      assert(decoded == scalar);
      assert(tower_utf8_validate(actual.data() + 1, count, 0) == 1);
      assert(tower_utf8_validate(actual.data() + 1, count, 1) == (scalar != 0));
      for (size_t capacity = 0; capacity < count; ++capacity) {
        auto before = actual;
        assert(tower_utf8_encode(scalar, actual.data() + 1, capacity) == 0);
        assert(actual == before);
        check(actual.data() + 1, capacity);
      }
    }
  }
  assert(tower_utf8_encode(0xffffffff, nullptr, 0) == 0);
  // Every one/two-byte input, including overlong and continuation-byte errors.
  uint8_t pair[2];
  for (unsigned first = 0; first < 256; ++first) {
    pair[0] = uint8_t(first); check(pair, 1);
    for (unsigned second = 0; second < 256; ++second) { pair[1] = uint8_t(second); check(pair, 2); }
  }
  // Deterministic mixed buffers, invalid tails and misplaced continuations.
  uint8_t bytes[32];
  for (unsigned trial = 0; trial < 100000; ++trial) {
    for (auto& byte : bytes) byte = uint8_t(next());
    check(bytes, next() % 33);
  }
#if defined(__unix__) || defined(__APPLE__)
  // Generated Tower objects aren't C++ sanitizer-instrumented. Put raw input
  // and output immediately before an inaccessible page to check their bounds.
  const auto page = size_t(sysconf(_SC_PAGESIZE));
  auto* memory = static_cast<uint8_t*>(mmap(nullptr, page * 2, PROT_READ | PROT_WRITE, MAP_PRIVATE | MAP_ANONYMOUS, -1, 0));
  assert(memory != MAP_FAILED);
  assert(mprotect(memory + page, page, PROT_NONE) == 0);
  for (size_t size = 0; size <= 4; ++size) {
    auto* data = memory + page - size;
    for (unsigned trial = 0; trial < 10000; ++trial) {
      for (size_t i = 0; i < size; ++i) data[i] = uint8_t(next());
      check(data, size);
    }
    for (uint32_t scalar : {0u, 0x7fu, 0x80u, 0x7ffu, 0x800u, 0xd800u, 0xffffu, 0x10000u, 0x10ffffu, 0x110000u}) {
      std::memset(data, 0xa5, size);
      uint8_t expected[4] = {0xa5, 0xa5, 0xa5, 0xa5};
      assert(tower_utf8_encode(scalar, data, size) == reference_utf8_encode(scalar, expected, size));
      assert(std::memcmp(data, expected, size) == 0);
    }
  }
  assert(munmap(memory, page * 2) == 0);
#endif
  puts("Tower-written UTF-8: exhaustive scalars, malformed inputs and buffer boundaries passed.");
}
