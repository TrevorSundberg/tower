#pragma once
#include <string>
#include <vector>
#include <cstdint>
#include <map>

struct TowerObject {
  std::string error, raw, optimized;
  size_t error_offset = 0;
  unsigned pointer_bytes = 4;
  std::vector<uint8_t> bytes;
  std::vector<std::string> exports, imports;
  std::map<std::string, std::vector<std::string>> signatures;
  std::map<std::string, double> timings;
};
// Both native and browser drivers lower the same nodes through this implementation.
TowerObject tower_emit_object(const char* source, const std::string& triple, bool optimize = true, bool library = false);
unsigned tower_target_pointer_bytes(const std::string& triple, std::string& error);
std::string tower_disassemble(const std::vector<uint8_t>& bytes, const std::string& triple);
