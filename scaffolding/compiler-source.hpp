#pragma once
#include "foundation-values.hpp"
#include <utility>

// Native view only. Allocation, text ownership, reference count and coordinates
// are implemented in compiler/syntax-source.tower.
struct SyntaxSource { mutable size_t references; CoreName name, text; };
extern "C" {
size_t syntax_source_size();
SyntaxSource* syntax_source_create(const char*, const char*, size_t);
void syntax_source_retain(const SyntaxSource*);
void syntax_source_release(const SyntaxSource*);
void syntax_source_location(const SyntaxSource*, size_t, size_t*, size_t*);
}
class SyntaxSourceRef {
  const SyntaxSource* value = nullptr;
public:
  SyntaxSourceRef() = default;
  explicit SyntaxSourceRef(const SyntaxSource* source) : value(source) { syntax_source_retain(value); }
  static SyntaxSourceRef adopt(const SyntaxSource* source) { SyntaxSourceRef result; result.value = source; return result; }
  SyntaxSourceRef(const SyntaxSourceRef& other) : value(other.value) { syntax_source_retain(value); }
  SyntaxSourceRef(SyntaxSourceRef&& other) noexcept : value(std::exchange(other.value, nullptr)) {}
  ~SyntaxSourceRef() { syntax_source_release(value); }
  SyntaxSourceRef& operator=(SyntaxSourceRef other) noexcept { std::swap(value, other.value); return *this; }
  const SyntaxSource* get() const { return value; }
  const SyntaxSource* operator->() const { return value; }
  explicit operator bool() const { return value != nullptr; }
};
