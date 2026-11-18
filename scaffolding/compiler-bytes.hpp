#pragma once
#include "byte-buffer.hpp"
#include <string_view>
#include <utility>

// Ownership adapter only: allocation/growth/copy/disposal policy lives in Tower.
// Immutable source snapshots are shared by syntax nodes through SyntaxSource.
class CompilerText {
  TowerByteBuffer buffer{};
public:
  CompilerText() = default;
  CompilerText(const CompilerText&) = delete;
  CompilerText& operator=(const CompilerText&) = delete;
  CompilerText(CompilerText&& other) noexcept : buffer(std::exchange(other.buffer, {})) {}
  CompilerText& operator=(CompilerText&& other) noexcept {
    if (this != &other) { bytes_dispose(&buffer); buffer = std::exchange(other.buffer, {}); }
    return *this;
  }
  ~CompilerText() { bytes_dispose(&buffer); }
  bool assign(std::string_view text) {
    return bytes_assign_text(&buffer, reinterpret_cast<const uint8_t*>(text.data()), text.size());
  }
  const char* c_str() const { return buffer.data ? reinterpret_cast<const char*>(buffer.data) : ""; }
  size_t size() const { return buffer.length; }
  char operator[](size_t index) const { return c_str()[index]; }
  std::string_view view() const { return {c_str(), size()}; }
};
