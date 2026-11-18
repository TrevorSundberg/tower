#pragma once
#include <cstddef>
#include <cstdint>

// Implemented in compiler/utf8.tower. Raw pointer + length C ABI, no allocation.
// Decode clears *value on failure; callers provide a writable u32 disjoint from input.
extern "C" size_t tower_utf8_decode(const uint8_t* data, size_t size, uint32_t* value);
// Null output queries size. Invalid input/insufficient capacity writes nothing.
extern "C" size_t tower_utf8_encode(uint32_t scalar, uint8_t* output, size_t capacity);
// Empty buffers are valid; reject_nul is an explicit source-text policy.
extern "C" uint32_t tower_utf8_validate(const uint8_t* data, size_t size, uint32_t reject_nul);
