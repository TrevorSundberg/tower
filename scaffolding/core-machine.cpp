#include "core.hpp"
#include <algorithm>
#include <bit>
#include <cstring>
#include <limits>
#include <utility>

namespace {
int64_t signed_value(uint64_t bits, CoreType type) {
  if (core_width(type) < 64 && (bits & (uint64_t(1) << (core_width(type) - 1)))) bits |= ~core_mask(type);
  return std::bit_cast<int64_t>(bits);
}
size_t aligned(size_t n) { return (n + 15) & ~size_t(15); }
}
CoreMachine::CoreMachine(CoreProgram source) : program(std::move(source)) {
  error = program.error; error_offset = program.error_offset; done = !error.empty();
  if (!done) {
    memory.resize(CORE_STACK_BYTES); Frame frame; frame.function = program.root; frame.base = stack;
    stack += aligned(core_node(program.root).frame_size);
    if (stack > CORE_STACK_BYTES) { fail("Tower interpreter stack exhausted", 0); done = true; return; }
    frames.push_back(std::move(frame)); enter(program.root);
  }
}
void CoreMachine::fail(const std::string& text, size_t offset) { if (error.empty()) { error = text; error_offset = offset; } }
uint8_t* CoreMachine::bytes(uint64_t address, size_t count, size_t offset) {
  // Execution-space containment only: no object, initialization or lifetime checks.
  if (address > memory.size() || count > memory.size() - size_t(address)) { fail("Address outside interpreter memory", offset); return nullptr; }
  return memory.data() + size_t(address);
}
CoreValue CoreMachine::load(uint64_t address, CoreType type, size_t offset) {
  auto size = core_type_size(type); auto* p = bytes(address, size, offset); uint64_t result = 0;
  if (p) for (size_t i = 0; i < size; ++i) result |= uint64_t(p[i]) << (i * 8);
  return {result};
}
void CoreMachine::write(uint64_t address, CoreValue value, CoreType type, size_t offset) {
  auto size = core_type_size(type); auto* p = bytes(address, size, offset);
  if (p) for (size_t i = 0; i < size; ++i) p[i] = uint8_t(value.bits >> (i * 8));
}
uint64_t CoreMachine::allocate(size_t count) {
  constexpr size_t limit = 256 * 1024 * 1024;
  if (count > limit) return 0;
  count = aligned(std::max(count, size_t(1)));
  for (auto it = free_blocks.begin(); it != free_blocks.end(); ++it) if (it->second >= count) {
    auto address = it->first; auto available = it->second; free_blocks.erase(it);
    if (available > count) free_blocks[address + count] = available - count;
    allocations[address] = count; return address;
  }
  if (count > limit - heap) return 0;
  size_t address = heap; heap += count; memory.resize(heap); allocations[address] = count; return address;
}
void CoreMachine::deallocate(uint64_t address) {
  if (!address) return;
  auto found = allocations.find(address);
  if (found == allocations.end()) { fail("Invalid allocation passed to free", 0); return; }
  size_t count = found->second; allocations.erase(found);
  auto next = free_blocks.lower_bound(address);
  if (next != free_blocks.end() && address + count == next->first) { count += next->second; free_blocks.erase(next); }
  next = free_blocks.lower_bound(address);
  if (next != free_blocks.begin()) { auto prev = std::prev(next); if (prev->first + prev->second == address) { address = prev->first; count += prev->second; free_blocks.erase(prev); } }
  free_blocks[address] = count;
}
uint64_t CoreMachine::reallocate(uint64_t address, size_t count) {
  if (!address) return allocate(count);
  if (!count) { deallocate(address); return 0; }
  auto found = allocations.find(address);
  if (found == allocations.end()) { fail("Invalid allocation passed to realloc", 0); return 0; }
  auto previous = found->second; if (count <= previous) return address;
  auto result = allocate(count); if (!result) return 0;
  std::memmove(memory.data() + result, memory.data() + address, previous); deallocate(address); return result;
}
CoreValue CoreMachine::read(TowerNode* node, size_t offset) {
  auto& n = core_node(node);
  if (auto found = frames.back().values.find(node); found != frames.back().values.end()) return found->second;
  if (n.kind == CoreKind::Address) return address(n.value, offset);
  if (n.kind != CoreKind::Operand && n.kind != CoreKind::String && n.kind != CoreKind::Field && n.kind != CoreKind::Index) return evaluate(node, offset);
  if (n.kind == CoreKind::String) {
    auto found = strings.find(node); if (found != strings.end()) return {found->second};
    auto at = allocate(n.name.size() + 1); if (!at) { fail("String allocation failed", offset); return {}; }
    std::memcpy(memory.data() + at, n.name.c_str(), n.name.size() + 1); strings[node] = at; return {at};
  }
  if (n.constant) return {n.bits};
  auto p = address(node, offset); return error.empty() ? load(p.bits, n.type, offset) : CoreValue{};
}
CoreValue CoreMachine::address(TowerNode* node, size_t offset) {
  if (auto found = frames.back().addresses.find(node); found != frames.back().addresses.end()) return found->second;
  auto& n = core_node(node);
  if (n.kind == CoreKind::Load) return read(n.value, offset);
  if (n.kind == CoreKind::Field || n.kind == CoreKind::Index) {
    auto pointer = n.indirect ? read(n.left, offset) : address(n.left, offset);
    if (n.kind == CoreKind::Field) pointer.bits += n.byte_offset;
    else {
      auto index = read(n.right, offset); auto t = core_node(n.right).type;
      uint64_t delta = core_signed(t) ? uint64_t(signed_value(index.bits, t)) : index.bits;
      pointer.bits += delta * core_type_size(n.type);
    }
    if (program.pointer_bytes == 4) pointer.bits &= UINT32_MAX;
    return pointer;
  }
  auto& binding = core_node(core_binding(node));
  return {(binding.global ? uint64_t(16) : frames.back().base) + binding.byte_offset};
}
CoreValue CoreMachine::evaluate(TowerNode* node, size_t offset) {
  if (auto found = frames.back().values.find(node); found != frames.back().values.end()) return found->second;
  auto& n = core_node(node);
  if (n.kind == CoreKind::Call) { fail("Missing suspended call result", offset); return {}; }
  if (n.kind == CoreKind::Operand || n.kind == CoreKind::String || n.kind == CoreKind::Field || n.kind == CoreKind::Index || n.kind == CoreKind::Address) return read(node, offset);
  if (n.kind == CoreKind::SizeOf || n.kind == CoreKind::AlignOf) return {n.kind == CoreKind::SizeOf ? core_type_size(n.element) : core_type_alignment(n.element)};
  if (n.kind == CoreKind::Allocate || n.kind == CoreKind::Reallocate) {
    auto p = n.left ? read(n.left, offset).bits : 0; auto count = read(n.right, offset).bits; auto size = core_type_size(n.element);
    auto limit = program.pointer_bytes == 4 ? UINT32_MAX : UINT64_MAX;
    if (count > limit / size || count > SIZE_MAX / size) return {};
    return {n.kind == CoreKind::Allocate ? allocate(size_t(count * size)) : reallocate(p, size_t(count * size))};
  }
  auto a = evaluate(n.kind == CoreKind::Binary ? n.left : n.value, offset); auto result = a;
  if (!error.empty()) return result;
  if (n.kind == CoreKind::Load) return load(a.bits, n.type, offset);
  if (n.kind == CoreKind::Convert) {
    auto from = core_node(n.value).type;
    if (n.type.scalar == CoreScalar::Bool) result.bits = a.bits != 0;
    else {
      bool negative = core_signed(from) && (a.bits & (uint64_t(1) << (core_width(from) - 1)));
      auto magnitude = negative ? (uint64_t(0) - a.bits) & core_mask(from) : a.bits;
      auto limit = core_signed(n.type) ? (uint64_t(1) << (core_width(n.type) - 1)) - (negative ? 0 : 1) : core_mask(n.type);
      if ((negative && !core_signed(n.type)) || magnitude > limit) fail("Numeric conversion out of range; use bits for bit reinterpretation", offset);
      result.bits = (negative ? uint64_t(0) - magnitude : magnitude) & core_mask(n.type);
    }
  } else if (n.kind == CoreKind::Binary) {
    auto b = evaluate(n.right, offset); auto input = core_node(n.left).type;
    uint64_t x = a.bits, y = b.bits;
    if (input.pointers && (n.op == CoreOp::Add || n.op == CoreOp::Sub)) {
      auto t = core_node(n.right).type; if (core_signed(t)) y = uint64_t(signed_value(y, t));
      auto element = input; --element.pointers; y *= core_type_size(element);
    }
    switch (n.op) {
      case CoreOp::Add: result.bits = x + y; break;
      case CoreOp::Sub: result.bits = x - y; break;
      case CoreOp::Mul: result.bits = x * y; break;
      case CoreOp::Div: case CoreOp::Rem:
        if (!y) fail("Division by zero", offset);
        else if (core_signed(input) && x == (uint64_t(1) << (core_width(input) - 1)) && y == core_mask(input)) fail("Signed division overflow", offset);
        else if (core_signed(input)) { auto sx = signed_value(x, input), sy = signed_value(y, input); result.bits = uint64_t(n.op == CoreOp::Div ? sx / sy : sx % sy); }
        else result.bits = n.op == CoreOp::Div ? x / y : x % y;
        break;
      case CoreOp::And: result.bits = x & y; break;
      case CoreOp::Or: result.bits = x | y; break;
      case CoreOp::Xor: result.bits = x ^ y; break;
      case CoreOp::Eq: result.bits = x == y; break;
      case CoreOp::Ne: result.bits = x != y; break;
      case CoreOp::Lt: result.bits = core_signed(input) ? signed_value(x, input) < signed_value(y, input) : x < y; break;
      case CoreOp::Le: result.bits = core_signed(input) ? signed_value(x, input) <= signed_value(y, input) : x <= y; break;
      case CoreOp::Gt: result.bits = core_signed(input) ? signed_value(x, input) > signed_value(y, input) : x > y; break;
      case CoreOp::Ge: result.bits = core_signed(input) ? signed_value(x, input) >= signed_value(y, input) : x >= y; break;
    }
  }
  result.bits &= core_mask(n.type); return result;
}
void CoreMachine::store(TowerNode* target, CoreValue value, size_t offset, const CoreValue* captured) {
  if (!error.empty()) return;
  auto at = captured ? *captured : address(target, offset); if (error.empty()) write(at.bits, value, core_node(target).type, offset);
}
void CoreMachine::enter(TowerNode* node) {
  auto& tasks = frames.back().tasks; auto& n = core_node(node);
  for (size_t i = n.items.size(); i; --i) if (core_node(n.items[i - 1]).kind != CoreKind::Function && core_node(n.items[i - 1]).kind != CoreKind::Type) tasks.push_back({n.items[i - 1]});
}
void CoreMachine::returned(CoreValue value) {
  auto frame = std::move(frames.back()); stack = frame.base; frames.pop_back();
  if (!frames.empty() && frame.call && error.empty()) frames.back().values[frame.call] = value;
}
void CoreMachine::call(TowerNode* call_node, size_t offset) {
  auto& n = core_node(call_node); auto& fn = core_node(n.binding); std::vector<CoreValue> args;
  for (auto* arg : n.items) args.push_back(read(arg, offset));
  if (!error.empty()) return;
  if (fn.external) {
    if (!foreign) { fail("No interpreter implementation registered for external function '" + fn.name + "'", offset); return; }
    auto value = foreign(*this, n.binding, args); if (error.empty()) frames.back().values[call_node] = value; return;
  }
  if (frames.size() >= CORE_MAX_FRAMES || aligned(fn.frame_size) > CORE_STACK_BYTES - stack) { fail("Tower call stack limit exceeded", offset); return; }
  Frame frame; frame.function = n.binding; frame.base = stack; frame.call_offset = offset; frame.call = call_node;
  stack += aligned(fn.frame_size);
  for (size_t i = 0; i < args.size(); ++i) { auto& p = core_node(fn.parameters[i]); write(frame.base + p.byte_offset, args[i], p.type, offset); }
  frames.push_back(std::move(frame)); enter(fn.body);
}
bool CoreMachine::needs_evaluation(TowerNode* node) {
  if (!node) return false;
  if (auto found = sequenced.find(node); found != sequenced.end()) return found->second;
  auto& n = core_node(node);
  bool result = n.kind == CoreKind::Call || n.kind == CoreKind::Allocate || n.kind == CoreKind::Reallocate;
  // Bodies and bindings are not evaluated when their containing statement is
  // entered. Only immediate expression edges participate in this derived index.
  for (auto* child : {n.left, n.right, n.value, n.target}) result |= needs_evaluation(child);
  return sequenced[node] = result;
}
void CoreMachine::step(size_t budget) {
  if (done) return;
  for (size_t count = 0; count < budget && !frames.empty() && error.empty(); ++count) {
    ++steps; auto& frame = frames.back();
    if (frame.tasks.empty()) { returned(); continue; }
    auto task = frame.tasks.back(); frame.tasks.pop_back(); auto& n = core_node(task.node);
    const auto queue = [&](TowerNode* node, Phase phase) {
      if (node) frame.tasks.push_back({node, false, phase, task.phase == Phase::Statement ? n.start : task.offset});
    };
    if (task.phase == Phase::Statement) {
      frame.values.clear(); frame.addresses.clear();
      if (needs_evaluation(task.node)) {
        frame.tasks.push_back({task.node, task.loop_resume, Phase::Resume, n.start});
        if (n.kind == CoreKind::Declare || n.kind == CoreKind::Assign) {
          queue(n.value, Phase::Value);
          queue(n.kind == CoreKind::Declare ? task.node : n.target, Phase::Address);
        } else if (n.kind == CoreKind::Print || n.kind == CoreKind::Return || n.kind == CoreKind::If) queue(n.value, Phase::Value);
        else if (n.kind == CoreKind::Free) queue(n.left, Phase::Value);
        else if (n.kind == CoreKind::Copy || n.kind == CoreKind::Fill) {
          queue(n.value, Phase::Value); queue(n.right, Phase::Value); queue(n.left, Phase::Value);
        } else queue(task.node, Phase::Value);
        continue;
      }
    } else if (task.phase == Phase::Value) {
      if (frame.values.contains(task.node)) continue;
      queue(task.node, Phase::FinishValue);
      if (n.kind == CoreKind::Call) {
        for (auto it = n.items.rbegin(); it != n.items.rend(); ++it) queue(*it, Phase::Value);
      } else if (n.kind == CoreKind::Address) queue(n.value, Phase::Address);
      else if (n.kind == CoreKind::Field || n.kind == CoreKind::Index || (n.kind == CoreKind::Operand && !n.constant)) queue(task.node, Phase::Address);
      else { queue(n.value, Phase::Value); queue(n.right, Phase::Value); queue(n.left, Phase::Value); }
      continue;
    } else if (task.phase == Phase::Address) {
      if (frame.addresses.contains(task.node)) continue;
      queue(task.node, Phase::FinishAddress);
      if (n.kind == CoreKind::Load) queue(n.value, Phase::Value);
      else if (n.kind == CoreKind::Field || n.kind == CoreKind::Index) {
        if (n.kind == CoreKind::Index) queue(n.right, Phase::Value);
        queue(n.left, n.indirect ? Phase::Value : Phase::Address);
      }
      continue;
    } else if (task.phase == Phase::FinishAddress) {
      frame.addresses[task.node] = address(task.node, task.offset); continue;
    } else if (task.phase == Phase::FinishValue) {
      if (n.kind == CoreKind::Call) call(task.node, task.offset);
      else frame.values[task.node] = evaluate(task.node, task.offset);
      continue;
    }
    switch (n.kind) {
      case CoreKind::Block: enter(task.node); break;
      case CoreKind::Declare:
        if (n.value) store(task.node, evaluate(n.value, n.start), n.start);
        break;
      case CoreKind::Assign:
        store(n.target, evaluate(n.value, n.start), n.start); break;
      case CoreKind::Free: deallocate(read(n.left, n.start).bits); break;
      case CoreKind::Copy: case CoreKind::Fill: {
        auto dest = read(n.left, n.start).bits, source = read(n.right, n.start).bits, size = read(n.value, n.start).bits;
        if (size > SIZE_MAX) { fail("Memory operation exceeds interpreter address space", n.start); break; }
        auto* p = bytes(dest, size_t(size), n.start);
        auto* q = n.kind == CoreKind::Copy ? bytes(source, size_t(size), n.start) : nullptr;
        if (error.empty()) { if (q) std::memmove(p, q, size_t(size)); else std::memset(p, uint8_t(source), size_t(size)); } break;
      }
      case CoreKind::Call: break; // Already evaluated by the resumable expression tasks.
      case CoreKind::Allocate: case CoreKind::Reallocate: case CoreKind::SizeOf: case CoreKind::AlignOf: case CoreKind::Convert: case CoreKind::Bits:
        evaluate(task.node, n.start); break;
      case CoreKind::Return: { auto value = n.value ? read(n.value, n.start) : CoreValue{}; returned(value); break; }
      case CoreKind::If: { auto condition = read(n.value, n.start); if (condition.bits) enter(n.body); else if (n.otherwise) enter(n.otherwise); break; }
      case CoreKind::Loop: frame.tasks.push_back({task.node, true}); enter(n.body); break;
      case CoreKind::Break: case CoreKind::Continue:
        while (!frame.tasks.empty()) { auto at = frame.tasks.back(); frame.tasks.pop_back(); if (at.loop_resume) { if (n.kind == CoreKind::Continue) frame.tasks.push_back(at); break; } }
        break;
      case CoreKind::Print: {
        auto value = read(n.value, n.start); if (!error.empty()) break; auto type = core_node(n.value).type;
        auto text = type.pointers ? std::string("0x") : type.scalar == CoreScalar::Bool ? (value.bits ? "true" : "false") : core_number(value.bits, type);
        if (type.pointers) { constexpr char hex[] = "0123456789abcdef"; for (int i = int(program.pointer_bytes) * 2 - 1; i >= 0; --i) text += hex[(value.bits >> (i * 4)) & 15]; }
        text += '\n'; if (output_bytes + text.size() <= 65536) { output += text; output_bytes += text.size(); } else output_truncated = true; break;
      }
      default: fail("Invalid foundation statement", n.start); break;
    }
  }
  done = !error.empty() || frames.empty();
}
