// Frozen native reference declaration for differential tests. Migration debt.
#pragma once
#include "../core.hpp"
struct NativeCoreMachine : CoreMachineState {
  CoreProgram program;
  std::vector<uint8_t> memory;
  std::map<uint64_t, size_t> allocations, free_blocks;
  std::map<TowerNode*, uint64_t> strings;
  using Foreign = std::function<CoreValue(NativeCoreMachine&, TowerNode*, const std::vector<CoreValue>&)>;
  Foreign foreign;
  enum class Phase { Statement, Resume, Value, Address, FinishValue, FinishAddress };
  struct Task { TowerNode* node; bool loop_resume = false; Phase phase = Phase::Statement; size_t offset = 0; };
  struct Frame {
    TowerNode* function = nullptr;
    size_t base = 0, call_offset = 0;
    TowerNode* call = nullptr;
    std::vector<Task> tasks;
    // Per-statement evaluation results only; never authoritative program data.
    std::map<TowerNode*, CoreValue> values, addresses;
  };
  std::vector<Frame> frames;
  std::map<TowerNode*, bool> sequenced;
  std::string error, output;
  explicit NativeCoreMachine(CoreProgram source);
  void step(size_t budget);
  void fail(const std::string&, size_t);
  uint8_t* bytes(uint64_t address, size_t count, size_t offset = 0);
  CoreValue load(uint64_t address, CoreType, size_t offset = 0);
  void write(uint64_t address, CoreValue, CoreType, size_t offset = 0);
  uint64_t allocate(size_t bytes);
  uint64_t reallocate(uint64_t address, size_t bytes);
  void deallocate(uint64_t address);
private:
  CoreValue read(TowerNode*, size_t);
  CoreValue address(TowerNode*, size_t);
  CoreValue evaluate(TowerNode*, size_t);
  void store(TowerNode*, CoreValue, size_t, const CoreValue* = nullptr);
  void enter(TowerNode*);
  void returned(CoreValue = {});
  void call(TowerNode*, size_t);
  bool needs_evaluation(TowerNode*);
};
