// LLVM's WASI support omits signal-based crash recovery. Each compiler lives in
// a disposable worker instead; unrecoverable errors must stop that instance.
#include <llvm/Support/CrashRecoveryContext.h>
#include <llvm/Support/FileOutputBuffer.h>
#include <llvm/Support/FileSystem.h>
#include <llvm/Support/raw_ostream.h>
#include <cstdlib>
#include <vector>
namespace llvm {
CrashRecoveryContext* CrashRecoveryContext::GetCurrent() { return nullptr; }
bool CrashRecoveryContext::throwIfCrash(int) { return false; }
[[noreturn]] void CrashRecoveryContext::HandleExit(int code) { std::_Exit(code); }

// LLD's default output buffer needs mmap, unavailable in WASI. Supply the
// FileOutputBuffer factory for this target using ordinary linear-memory storage.
// Linking this definition keeps the mmap-based archive implementation unused.
namespace {
class TowerOutputBuffer final : public FileOutputBuffer {
  std::vector<uint8_t> bytes;
public:
  TowerOutputBuffer(StringRef path, size_t size) : FileOutputBuffer(path), bytes(size) {}
  uint8_t* getBufferStart() const override { return const_cast<uint8_t*>(bytes.data()); }
  uint8_t* getBufferEnd() const override { return getBufferStart() + bytes.size(); }
  size_t getBufferSize() const override { return bytes.size(); }
  Error commit() override {
    std::error_code error;
    raw_fd_ostream file(FinalPath, error, sys::fs::OF_None);
    if (error) return errorCodeToError(error);
    file.write(reinterpret_cast<const char*>(bytes.data()), bytes.size());
    file.close();
    if (file.has_error()) { error = file.error(); file.clear_error(); return errorCodeToError(error); }
    return Error::success();
  }
};
}
Expected<std::unique_ptr<FileOutputBuffer>> FileOutputBuffer::create(StringRef path, size_t size, unsigned) {
  return std::make_unique<TowerOutputBuffer>(path, size);
}
}
