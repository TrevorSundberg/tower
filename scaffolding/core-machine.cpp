#include "core.hpp"
#include <limits>
#include <utility>

namespace {
int64_t signed_value(uint32_t bits) { return bits <= 0x7fffffff ? int64_t(bits) : int64_t(bits) - 0x100000000LL; }
}
CoreMachine::CoreMachine(CoreProgram source) : program(std::move(source)) {
  error = program.error; error_offset = program.error_offset; done = !error.empty();
  if (!done) { Frame frame; frame.function = program.root; frames.push_back(std::move(frame)); cells.resize(core_node(program.root).slots.size()); enter(program.root); }
}
void CoreMachine::fail(const std::string& text, size_t offset) { if (error.empty()) { error = text; error_offset = offset; } }
CoreCell* CoreMachine::dereference(CoreValue p, size_t offset) {
  if (p.slot >= cells.size() || !cells[p.slot].active || cells[p.slot].generation != p.generation) { fail("Pointer refers to an expired local", offset); return nullptr; }
  return &cells[p.slot];
}
uint64_t CoreMachine::generation(size_t offset) {
  if (lifetime == std::numeric_limits<uint64_t>::max()) { fail("Local lifetime counter exhausted", offset); return 0; }
  return ++lifetime;
}
CoreValue CoreMachine::read(TowerNode* node, size_t offset) {
  auto& n = core_node(node); if (n.constant) return {n.bits};
  if (n.kind == CoreKind::Field || n.kind == CoreKind::Load) {
    auto p = address(node, offset); if (!error.empty()) return {};
    if (auto* cell = dereference(p, offset)) {
      if (!cell->initialized) fail(n.kind == CoreKind::Field ? "Read of uninitialized field '" + core_place_name(node) + "'" : "Pointer load of uninitialized local", offset);
      return cell->value;
    }
    return {};
  }
  auto& binding = core_node(core_binding(node)); auto& cell = cells[frames.back().base + binding.index];
  if (!cell.active || !cell.initialized) fail("Read of uninitialized local '" + binding.name + "'", offset);
  return cell.value;
}
CoreValue CoreMachine::address(TowerNode* node, size_t offset) {
  auto& n = core_node(node);
  if (n.kind == CoreKind::Load) return read(n.value, offset);
  if (n.kind == CoreKind::Field) {
    auto pointer = n.indirect ? read(n.left, offset) : address(n.left, offset);
    if (!error.empty() || !dereference(pointer, offset)) return {};
    pointer.slot += n.index; pointer.name_id = n.name_id; return pointer;
  }
  auto& binding = core_node(core_binding(node)); auto slot = frames.back().base + binding.index;
  return {0, slot, cells[slot].generation, binding.name_id};
}
CoreValue CoreMachine::evaluate(TowerNode* node, size_t offset) {
  auto& n = core_node(node);
  if (n.kind == CoreKind::Operand || n.kind == CoreKind::Field) return read(node, offset);
  if (n.kind == CoreKind::Address) return address(n.value, offset);
  auto a = evaluate(n.kind == CoreKind::Binary ? n.left : n.value, offset); auto result = a;
  if (!error.empty()) return result;
  if (n.kind == CoreKind::Load) {
    if (auto* cell = dereference(a, offset)) { if (!cell->initialized) fail("Pointer load of uninitialized local", offset); result = cell->value; }
  } else if (n.kind == CoreKind::Convert) {
    auto from = core_node(n.value).type;
    if (n.type.scalar == CoreScalar::Bool) result.bits = a.bits != 0;
    else if (n.type.scalar != from.scalar && from.scalar != CoreScalar::Bool && a.bits > 0x7fffffff) fail("Numeric conversion out of range; use bits for bit reinterpretation", offset);
  } else if (n.kind == CoreKind::Binary) {
    auto b = evaluate(n.right, offset); auto input = core_node(n.left).type;
    int64_t x = input.scalar == CoreScalar::I32 ? signed_value(a.bits) : int64_t(a.bits);
    int64_t y = input.scalar == CoreScalar::I32 ? signed_value(b.bits) : int64_t(b.bits);
    switch (n.op) {
      case CoreOp::Add: result.bits = a.bits + b.bits; break;
      case CoreOp::Sub: result.bits = a.bits - b.bits; break;
      case CoreOp::Mul: result.bits = uint32_t(uint64_t(a.bits) * b.bits); break;
      case CoreOp::Div: case CoreOp::Rem:
        if (!y) fail("Division by zero", offset);
        else if (x == -2147483648LL && y == -1) fail("Signed division overflow", offset);
        else result.bits = uint32_t(n.op == CoreOp::Div ? x / y : x % y); break;
      case CoreOp::And: result.bits = a.bits & b.bits; break;
      case CoreOp::Or: result.bits = a.bits | b.bits; break;
      case CoreOp::Xor: result.bits = a.bits ^ b.bits; break;
      case CoreOp::Eq: case CoreOp::Ne: {
        bool equal = input.pointers ? a.slot == b.slot && a.generation == b.generation : a.bits == b.bits;
        result.bits = n.op == CoreOp::Eq ? equal : !equal; break;
      }
      case CoreOp::Lt: result.bits = x < y; break;
      case CoreOp::Le: result.bits = x <= y; break;
      case CoreOp::Gt: result.bits = x > y; break;
      case CoreOp::Ge: result.bits = x >= y; break;
    }
  }
  return result;
}
void CoreMachine::store(TowerNode* target, CoreValue value, size_t offset, const CoreValue* captured) {
  auto& n = core_node(target);
  if (!error.empty()) return;
  bool indirect = n.kind == CoreKind::Field || n.kind == CoreKind::Load;
  CoreCell* cell = indirect ? dereference(captured ? *captured : address(target, offset), offset) : &cells[frames.back().base + core_node(core_binding(target)).index];
  if (cell && error.empty()) { cell->value = value; cell->initialized = true; }
}
void CoreMachine::enter(TowerNode* node) {
  auto& tasks = frames.back().tasks; auto& n = core_node(node); tasks.push_back({node, true});
  for (size_t i = n.items.size(); i; --i) if (core_node(n.items[i - 1]).kind != CoreKind::Function && core_node(n.items[i - 1]).kind != CoreKind::Type) tasks.push_back({n.items[i - 1]});
}
void CoreMachine::leave(TowerNode* node) {
  for (auto* local : core_node(node).locals) for (size_t i = 0; i < core_node(local).cell_count; ++i)
    cells[frames.back().base + core_node(local).index + i].active = false;
}
void CoreMachine::returned(CoreValue value) {
  auto frame = std::move(frames.back()); cells.resize(frame.base); frames.pop_back();
  if (!frames.empty() && frame.destination && error.empty()) store(frame.destination, value, frame.call_offset, &frame.pointer);
}
void CoreMachine::call(TowerNode* call_node, TowerNode* destination, size_t offset) {
  auto& n = core_node(call_node); auto& fn = core_node(n.binding); std::vector<CoreValue> args;
  for (auto* arg : n.items) args.push_back(read(arg, offset));
  CoreValue pointer = destination && (core_node(destination).kind == CoreKind::Field || core_node(destination).kind == CoreKind::Load) ? address(destination, offset) : CoreValue{};
  if (frames.size() >= CORE_MAX_FRAMES || cells.size() + fn.slots.size() > CORE_MAX_CELLS) fail("Tower call stack limit exceeded", offset);
  if (!error.empty()) return;
  Frame frame; frame.function = n.binding; frame.base = cells.size(); frame.call_offset = offset; frame.destination = destination; frame.pointer = pointer;
  cells.resize(frame.base + fn.slots.size());
  for (size_t i = 0; i < args.size(); ++i) {
    auto& cell = cells[frame.base + i]; cell.active = cell.initialized = true; cell.value = args[i];
    if (core_node(fn.parameters[i]).address_taken) cell.generation = generation(offset);
  }
  frames.push_back(std::move(frame)); enter(fn.body);
}
void CoreMachine::step(size_t budget) {
  if (done) return;
  for (size_t count = 0; count < budget && !frames.empty() && error.empty(); ++count) {
    ++steps; auto& frame = frames.back();
    if (frame.tasks.empty()) { returned(); continue; }
    auto task = frame.tasks.back(); frame.tasks.pop_back(); auto& n = core_node(task.node);
    if (task.exit) { leave(task.node); continue; }
    switch (n.kind) {
      case CoreKind::Block: enter(task.node); break;
      case CoreKind::Declare: {
        auto lifetime = n.address_taken ? generation(n.start) : 0;
        for (size_t i = 0; i < n.cell_count; ++i) {
          auto& cell = cells[frame.base + n.index + i]; cell = {}; cell.active = true; cell.generation = lifetime;
        }
        if (n.value) {
          if (core_node(n.value).kind == CoreKind::Call) call(n.value, task.node, n.start);
          else store(task.node, evaluate(n.value, n.start), n.start);
        }
        break;
      }
      case CoreKind::Assign:
        if (core_node(n.value).kind == CoreKind::Call) call(n.value, n.target, n.start);
        else store(n.target, evaluate(n.value, n.start), n.start); break;
      case CoreKind::Call: call(task.node, nullptr, n.start); break;
      case CoreKind::Return: { auto value = n.value ? read(n.value, n.start) : CoreValue{}; returned(value); break; }
      case CoreKind::If: { auto condition = read(n.value, n.start); if (condition.bits) enter(n.body); else if (n.otherwise) enter(n.otherwise); break; }
      case CoreKind::Loop: frame.tasks.push_back({task.node, false, true}); enter(n.body); break;
      case CoreKind::Break: case CoreKind::Continue:
        while (!frame.tasks.empty()) {
          auto at = frame.tasks.back(); frame.tasks.pop_back();
          if (at.exit) leave(at.node);
          else if (at.loop_resume) { if (n.kind == CoreKind::Continue) frame.tasks.push_back(at); break; }
        }
        break;
      case CoreKind::Print: {
        auto value = read(n.value, n.start); if (!error.empty()) break;
        auto type = core_node(n.value).type;
        auto text = type.pointers ? "&" + program.names[value.name_id] : type.scalar == CoreScalar::Bool ? (value.bits ? "true" : "false") :
          std::to_string(type.scalar == CoreScalar::I32 ? signed_value(value.bits) : int64_t(value.bits));
        text += '\n'; if (output_bytes + text.size() <= 65536) { output += text; output_bytes += text.size(); } else output_truncated = true;
        break;
      }
      default: fail("Invalid foundation statement", n.start);
    }
  }
  done = !error.empty() || frames.empty();
}
