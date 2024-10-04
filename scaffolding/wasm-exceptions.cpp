#include <assert.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <threads.h>

#include <exception>
#include <memory>
#include <typeinfo>

namespace std {

class type_info;

}

namespace __cxxabiv1 {
extern "C" {

extern __attribute__((__visibility__("default"))) void *
__cxa_allocate_exception(size_t thrown_size) throw();
extern __attribute__((__visibility__("default"))) void __cxa_free_exception(
    void *thrown_exception) throw();

extern __attribute__((__visibility__("default"))) __attribute__((noreturn)) void
__cxa_throw(void *thrown_exception, std::type_info *tinfo,

            void *(*dest)(void *));

extern __attribute__((__visibility__("default"))) void *__cxa_get_exception_ptr(
    void *exceptionObject) throw();
extern __attribute__((__visibility__("default"))) void *__cxa_begin_catch(
    void *exceptionObject) throw();
extern __attribute__((__visibility__("default"))) void __cxa_end_catch();

extern __attribute__((__visibility__("default"))) std::type_info *
__cxa_current_exception_type();

extern __attribute__((__visibility__("default"))) __attribute__((noreturn)) void
__cxa_rethrow();

extern __attribute__((__visibility__("default"))) __attribute__((noreturn)) void
__cxa_bad_cast(void);
extern __attribute__((__visibility__("default"))) __attribute__((noreturn)) void
__cxa_bad_typeid(void);
extern __attribute__((__visibility__("default"))) __attribute__((noreturn)) void
__cxa_throw_bad_array_new_length(void);

extern __attribute__((__visibility__("default"))) __attribute__((noreturn)) void
__cxa_pure_virtual(void);

extern __attribute__((__visibility__("default"))) __attribute__((noreturn)) void
__cxa_deleted_virtual(void);

extern __attribute__((__visibility__("default"))) __attribute__((cold)) int
__cxa_guard_acquire(uint64_t *);
extern __attribute__((__visibility__("default"))) __attribute__((cold)) void
__cxa_guard_release(uint64_t *);
extern __attribute__((__visibility__("default"))) __attribute__((cold)) void
__cxa_guard_abort(uint64_t *);

extern __attribute__((__visibility__("default"))) void *__cxa_vec_new(
    size_t element_count, size_t element_size, size_t padding_size,
    void (*constructor)(void *), void (*destructor)(void *));

extern __attribute__((__visibility__("default"))) void *__cxa_vec_new2(
    size_t element_count, size_t element_size, size_t padding_size,
    void (*constructor)(void *), void (*destructor)(void *),
    void *(*alloc)(size_t), void (*dealloc)(void *));

extern __attribute__((__visibility__("default"))) void *__cxa_vec_new3(
    size_t element_count, size_t element_size, size_t padding_size,
    void (*constructor)(void *), void (*destructor)(void *),
    void *(*alloc)(size_t), void (*dealloc)(void *, size_t));

extern __attribute__((__visibility__("default"))) void __cxa_vec_ctor(
    void *array_address, size_t element_count, size_t element_size,
    void (*constructor)(void *), void (*destructor)(void *));

extern __attribute__((__visibility__("default"))) void __cxa_vec_dtor(
    void *array_address, size_t element_count, size_t element_size,
    void (*destructor)(void *));

extern __attribute__((__visibility__("default"))) void __cxa_vec_cleanup(
    void *array_address, size_t element_count, size_t element_size,
    void (*destructor)(void *));

extern __attribute__((__visibility__("default"))) void __cxa_vec_delete(
    void *array_address, size_t element_size, size_t padding_size,
    void (*destructor)(void *));

extern __attribute__((__visibility__("default"))) void __cxa_vec_delete2(
    void *array_address, size_t element_size, size_t padding_size,
    void (*destructor)(void *), void (*dealloc)(void *));

extern __attribute__((__visibility__("default"))) void __cxa_vec_delete3(
    void *__array_address, size_t element_size, size_t padding_size,
    void (*destructor)(void *), void (*dealloc)(void *, size_t));

extern __attribute__((__visibility__("default"))) void __cxa_vec_cctor(
    void *dest_array, void *src_array, size_t element_count,
    size_t element_size, void (*constructor)(void *, void *),
    void (*destructor)(void *));

extern __attribute__((__visibility__("default"))) char *__cxa_demangle(
    const char *mangled_name, char *output_buffer, size_t *length, int *status);

extern __attribute__((__visibility__("default"))) void *
__cxa_current_primary_exception() throw();
extern __attribute__((__visibility__("default"))) void
__cxa_rethrow_primary_exception(void *primary_exception);
extern __attribute__((__visibility__("default"))) void
__cxa_increment_exception_refcount(void *primary_exception) throw();
extern __attribute__((__visibility__("default"))) void
__cxa_decrement_exception_refcount(void *primary_exception) throw();

extern __attribute__((__visibility__("default"))) bool
__cxa_uncaught_exception() throw();
extern __attribute__((__visibility__("default"))) unsigned int
__cxa_uncaught_exceptions() throw();

extern __attribute__((__visibility__("default"))) int __cxa_thread_atexit(
    void (*)(void *), void *, void *) throw();
}
}  // namespace __cxxabiv1

namespace abi = __cxxabiv1;

typedef enum {
  _URC_NO_REASON = 0,
  _URC_OK = 0,
  _URC_FOREIGN_EXCEPTION_CAUGHT = 1,
  _URC_FATAL_PHASE2_ERROR = 2,
  _URC_FATAL_PHASE1_ERROR = 3,
  _URC_NORMAL_STOP = 4,
  _URC_END_OF_STACK = 5,
  _URC_HANDLER_FOUND = 6,
  _URC_INSTALL_CONTEXT = 7,
  _URC_CONTINUE_UNWIND = 8,

} _Unwind_Reason_Code;

typedef enum {
  _UA_SEARCH_PHASE = 1,
  _UA_CLEANUP_PHASE = 2,
  _UA_HANDLER_FRAME = 4,
  _UA_FORCE_UNWIND = 8,
  _UA_END_OF_STACK = 16
} _Unwind_Action;

typedef struct _Unwind_Context _Unwind_Context;

struct _Unwind_Context;
struct _Unwind_Exception;
typedef struct _Unwind_Exception _Unwind_Exception;
typedef uint64_t _Unwind_Exception_Class;

struct _Unwind_Exception {
  _Unwind_Exception_Class exception_class;
  void (*exception_cleanup)(_Unwind_Reason_Code reason, _Unwind_Exception *exc);

} __attribute__((__aligned__));

typedef _Unwind_Reason_Code (*_Unwind_Personality_Fn)(
    int version, _Unwind_Action actions, uint64_t exceptionClass,
    _Unwind_Exception *exceptionObject, struct _Unwind_Context *context);

extern "C" {

extern _Unwind_Reason_Code _Unwind_RaiseException(
    _Unwind_Exception *exception_object);
extern void _Unwind_Resume(_Unwind_Exception *exception_object);

extern void _Unwind_DeleteException(_Unwind_Exception *exception_object);

extern uintptr_t _Unwind_GetGR(struct _Unwind_Context *context, int index);
extern void _Unwind_SetGR(struct _Unwind_Context *context, int index,
                          uintptr_t new_value);
extern uintptr_t _Unwind_GetIP(struct _Unwind_Context *context);
extern void _Unwind_SetIP(struct _Unwind_Context *, uintptr_t new_value);
}

typedef _Unwind_Reason_Code (*_Unwind_Stop_Fn)(
    int version, _Unwind_Action actions, _Unwind_Exception_Class exceptionClass,
    _Unwind_Exception *exceptionObject, struct _Unwind_Context *context,
    void *stop_parameter);

extern "C" {

extern uintptr_t _Unwind_GetRegionStart(struct _Unwind_Context *context);
extern uintptr_t _Unwind_GetLanguageSpecificData(
    struct _Unwind_Context *context);

extern _Unwind_Reason_Code _Unwind_ForcedUnwind(
    _Unwind_Exception *exception_object, _Unwind_Stop_Fn stop,
    void *stop_parameter);

extern _Unwind_Reason_Code _Unwind_Resume_or_Rethrow(
    _Unwind_Exception *exception_object);

typedef _Unwind_Reason_Code (*_Unwind_Trace_Fn)(struct _Unwind_Context *,
                                                void *);
extern _Unwind_Reason_Code _Unwind_Backtrace(_Unwind_Trace_Fn, void *);

extern uintptr_t _Unwind_GetCFA(struct _Unwind_Context *);

extern uintptr_t _Unwind_GetIPInfo(struct _Unwind_Context *context,
                                   int *ipBefore);

extern void __register_frame(const void *fde);
extern void __deregister_frame(const void *fde);

struct dwarf_eh_bases {
  uintptr_t tbase;
  uintptr_t dbase;
  uintptr_t func;
};
extern const void *_Unwind_Find_FDE(const void *pc, struct dwarf_eh_bases *);

extern void *_Unwind_FindEnclosingFunction(void *pc);

extern uintptr_t _Unwind_GetDataRelBase(struct _Unwind_Context *context);
extern uintptr_t _Unwind_GetTextRelBase(struct _Unwind_Context *context);

extern void __register_frame_info_bases(const void *fde, void *ob, void *tb,
                                        void *db);
extern void __register_frame_info(const void *fde, void *ob);
extern void __register_frame_info_table_bases(const void *fde, void *ob,
                                              void *tb, void *db);
extern void __register_frame_info_table(const void *fde, void *ob);
extern void __register_frame_table(const void *fde);
extern void *__deregister_frame_info(const void *fde);
extern void *__deregister_frame_info_bases(const void *fde);
}

namespace __cxxabiv1 {

static const uint64_t kOurExceptionClass = 0x434C4E47432B2B00;
static const uint64_t kOurDependentExceptionClass = 0x434C4E47432B2B01;
static const uint64_t get_vendor_and_language = 0xFFFFFFFFFFFFFF00;

__attribute__((__visibility__("hidden"))) uint64_t __getExceptionClass(
    const _Unwind_Exception *);
__attribute__((__visibility__("hidden"))) void __setExceptionClass(
    _Unwind_Exception *, uint64_t);
__attribute__((__visibility__("hidden"))) bool __isOurExceptionClass(
    const _Unwind_Exception *);

struct __attribute__((__visibility__("hidden"))) __cxa_exception {
  void *reserve;

  size_t referenceCount;

  std::type_info *exceptionType;

  void *(*exceptionDestructor)(void *);

  std::terminate_handler terminateHandler;

  __cxa_exception *nextException;

  int handlerCount;

  int handlerSwitchValue;
  const unsigned char *actionRecord;
  const unsigned char *languageSpecificData;
  void *catchTemp;
  void *adjustedPtr;

  _Unwind_Exception unwindHeader;
};

struct __attribute__((__visibility__("hidden"))) __cxa_dependent_exception {
  void *reserve;
  void *primaryException;

  std::type_info *exceptionType;
  void (*exceptionDestructor)(void *);
  std::terminate_handler terminateHandler;

  __cxa_exception *nextException;

  int handlerCount;

  int handlerSwitchValue;
  const unsigned char *actionRecord;
  const unsigned char *languageSpecificData;
  void *catchTemp;
  void *adjustedPtr;

  _Unwind_Exception unwindHeader;
};

static_assert(sizeof(_Unwind_Exception) +
                      offsetof(__cxa_exception, unwindHeader) ==
                  sizeof(__cxa_exception),
              "unwindHeader has wrong negative offsets");
static_assert(sizeof(_Unwind_Exception) +
                      offsetof(__cxa_dependent_exception, unwindHeader) ==
                  sizeof(__cxa_dependent_exception),
              "unwindHeader has wrong negative offsets");

struct __attribute__((__visibility__("hidden"))) __cxa_eh_globals {
  __cxa_exception *caughtExceptions;
  unsigned int uncaughtExceptions;
};

extern "C" __attribute__((__visibility__("default"))) __cxa_eh_globals *
__cxa_get_globals();
extern "C" __attribute__((__visibility__("default"))) __cxa_eh_globals *
__cxa_get_globals_fast();

extern "C" __attribute__((__visibility__("default"))) void *
__cxa_allocate_dependent_exception();
extern "C" __attribute__((__visibility__("default"))) void
__cxa_free_dependent_exception(void *dependent_exception);

}  // namespace __cxxabiv1

namespace std {

__attribute__((__visibility__("hidden"))) __attribute__((noreturn)) void
__terminate(terminate_handler func) noexcept;

}  // namespace std

extern "C" {

__attribute__((__visibility__("default"))) extern void (
    *__cxa_terminate_handler)();
__attribute__((__visibility__("default"))) extern void (
    *__cxa_unexpected_handler)();
__attribute__((__visibility__("default"))) extern void (*__cxa_new_handler)();
}

namespace __cxxabiv1 {

__attribute__((__visibility__("hidden"))) void *__aligned_malloc_with_fallback(
    size_t size);

__attribute__((__visibility__("hidden"))) void *__calloc_with_fallback(
    size_t count, size_t size);

__attribute__((__visibility__("hidden"))) void __aligned_free_with_fallback(
    void *ptr);
__attribute__((__visibility__("hidden"))) void __free_with_fallback(void *ptr);

}  // namespace __cxxabiv1

namespace std {
inline namespace __2 {}
}  // namespace std

namespace std {
inline namespace __2 {

namespace {

enum __libcpp_atomic_order {
  _AO_Relaxed = 0,
  _AO_Consume = 1,
  _AO_Acquire = 2,
  _AO_Release = 3,
  _AO_Acq_Rel = 4,
  _AO_Seq = 5
};

template <class _ValueType, class _FromType>
inline __attribute__((__visibility__("hidden")))
__attribute__((__exclude_from_explicit_instantiation__))
__attribute__((__abi_tag__("v160006"))) void
__libcpp_atomic_store(_ValueType *__dest, _FromType __val,
                      int __order = _AO_Seq) {
  __atomic_store_n(__dest, __val, __order);
}

template <class _ValueType, class _FromType>
inline __attribute__((__visibility__("hidden")))
__attribute__((__exclude_from_explicit_instantiation__))
__attribute__((__abi_tag__("v160006"))) void
__libcpp_relaxed_store(_ValueType *__dest, _FromType __val) {
  __atomic_store_n(__dest, __val, _AO_Relaxed);
}

template <class _ValueType>
inline __attribute__((__visibility__("hidden")))
__attribute__((__exclude_from_explicit_instantiation__))
__attribute__((__abi_tag__("v160006"))) _ValueType
__libcpp_atomic_load(_ValueType const *__val, int __order = _AO_Seq) {
  return __atomic_load_n(__val, __order);
}

template <class _ValueType, class _AddType>
inline __attribute__((__visibility__("hidden")))
__attribute__((__exclude_from_explicit_instantiation__))
__attribute__((__abi_tag__("v160006"))) _ValueType
__libcpp_atomic_add(_ValueType *__val, _AddType __a, int __order = _AO_Seq) {
  return __atomic_add_fetch(__val, __a, __order);
}

template <class _ValueType>
inline __attribute__((__visibility__("hidden")))
__attribute__((__exclude_from_explicit_instantiation__))
__attribute__((__abi_tag__("v160006"))) _ValueType
__libcpp_atomic_exchange(_ValueType *__target, _ValueType __value,
                         int __order = _AO_Seq) {
  return __atomic_exchange_n(__target, __value, __order);
}

template <class _ValueType>
inline __attribute__((__visibility__("hidden")))
__attribute__((__exclude_from_explicit_instantiation__))
__attribute__((__abi_tag__("v160006"))) bool
__libcpp_atomic_compare_exchange(_ValueType *__val, _ValueType *__expected,
                                 _ValueType __after,
                                 int __success_order = _AO_Seq,
                                 int __fail_order = _AO_Seq) {
  return __atomic_compare_exchange_n(__val, __expected, __after, true,
                                     __success_order, __fail_order);
}

}  // namespace

}  // namespace __2
}  // namespace std

namespace __cxxabiv1 {

static inline __cxa_exception *cxa_exception_from_thrown_object(
    void *thrown_object) {
  return static_cast<__cxa_exception *>(thrown_object) - 1;
}

static inline void *thrown_object_from_cxa_exception(
    __cxa_exception *exception_header) {
  return static_cast<void *>(exception_header + 1);
}

static inline __cxa_exception *cxa_exception_from_exception_unwind_exception(
    _Unwind_Exception *unwind_exception) {
  return cxa_exception_from_thrown_object(unwind_exception + 1);
}

static inline size_t aligned_allocation_size(size_t s, size_t a) {
  return (s + a - 1) & ~(a - 1);
}

static inline size_t cxa_exception_size_from_exception_thrown_size(
    size_t size) {
  return aligned_allocation_size(size + sizeof(__cxa_exception),
                                 alignof(__cxa_exception));
}

void __setExceptionClass(_Unwind_Exception *unwind_exception,
                         uint64_t newValue) {
  ::memcpy(&unwind_exception->exception_class, &newValue, sizeof(newValue));
}

static void setOurExceptionClass(_Unwind_Exception *unwind_exception) {
  __setExceptionClass(unwind_exception, kOurExceptionClass);
}

static void setDependentExceptionClass(_Unwind_Exception *unwind_exception) {
  __setExceptionClass(unwind_exception, kOurDependentExceptionClass);
}

uint64_t __getExceptionClass(const _Unwind_Exception *unwind_exception) {
  uint64_t exClass;
  ::memcpy(&exClass, &unwind_exception->exception_class, sizeof(exClass));
  return exClass;
}

bool __isOurExceptionClass(const _Unwind_Exception *unwind_exception) {
  return (__getExceptionClass(unwind_exception) & get_vendor_and_language) ==
         (kOurExceptionClass & get_vendor_and_language);
}

static bool isDependentException(_Unwind_Exception *unwind_exception) {
  return (__getExceptionClass(unwind_exception) & 0xFF) == 0x01;
}

static inline int incrementHandlerCount(__cxa_exception *exception) {
  return ++exception->handlerCount;
}

static inline int decrementHandlerCount(__cxa_exception *exception) {
  return --exception->handlerCount;
}

static void exception_cleanup_func(_Unwind_Reason_Code reason,
                                   _Unwind_Exception *unwind_exception) {
  __cxa_exception *exception_header =
      cxa_exception_from_exception_unwind_exception(unwind_exception);
  if (_URC_FOREIGN_EXCEPTION_CAUGHT != reason)
    std::__terminate(exception_header->terminateHandler);

  __cxa_decrement_exception_refcount(unwind_exception + 1);
}

static __attribute__((noreturn)) void failed_throw(
    __cxa_exception *exception_header) {
  (void)__cxa_begin_catch(&exception_header->unwindHeader);
  std::__terminate(exception_header->terminateHandler);
}

static size_t get_cxa_exception_offset() {
  struct S {
  } __attribute__((aligned));

  constexpr size_t alignment = alignof(S);
  constexpr size_t excp_size = sizeof(__cxa_exception);
  constexpr size_t aligned_size =
      (excp_size + alignment - 1) / alignment * alignment;
  constexpr size_t offset = aligned_size - excp_size;
  static_assert((offset == 0 || alignof(_Unwind_Exception) < alignment),
                "offset is non-zero only if _Unwind_Exception isn't aligned");
  return offset;
}

extern "C" {

void *__cxa_allocate_exception(size_t thrown_size) throw() {
  size_t actual_size =
      cxa_exception_size_from_exception_thrown_size(thrown_size);

  size_t header_offset = get_cxa_exception_offset();
  char *raw_buffer =
      (char *)__aligned_malloc_with_fallback(header_offset + actual_size);
  if (NULL == raw_buffer) std::terminate();
  __cxa_exception *exception_header =
      static_cast<__cxa_exception *>((void *)(raw_buffer + header_offset));
  ::memset(exception_header, 0, actual_size);
  return thrown_object_from_cxa_exception(exception_header);
}

void __cxa_free_exception(void *thrown_object) throw() {
  size_t header_offset = get_cxa_exception_offset();
  char *raw_buffer =
      ((char *)cxa_exception_from_thrown_object(thrown_object)) - header_offset;
  __aligned_free_with_fallback((void *)raw_buffer);
}

void *__cxa_allocate_dependent_exception() {
  size_t actual_size = sizeof(__cxa_dependent_exception);
  void *ptr = __aligned_malloc_with_fallback(actual_size);
  if (NULL == ptr) std::terminate();
  ::memset(ptr, 0, actual_size);
  return ptr;
}

void __cxa_free_dependent_exception(void *dependent_exception) {
  __aligned_free_with_fallback(dependent_exception);
}

void


__cxa_throw(void *thrown_object, std::type_info *tinfo, void *( *dest)(void *)) {
  __cxa_eh_globals *globals = __cxa_get_globals();
  __cxa_exception *exception_header =
      cxa_exception_from_thrown_object(thrown_object);

  exception_header->terminateHandler = std::get_terminate();
  exception_header->exceptionType = tinfo;
  exception_header->exceptionDestructor = dest;
  setOurExceptionClass(&exception_header->unwindHeader);
  exception_header->referenceCount = 1;
  globals->uncaughtExceptions += 1;

  exception_header->unwindHeader.exception_cleanup = exception_cleanup_func;

  failed_throw(exception_header);
}

void *__cxa_get_exception_ptr(void *unwind_exception) throw() {
  return cxa_exception_from_exception_unwind_exception(
             static_cast<_Unwind_Exception *>(unwind_exception))
      ->adjustedPtr;
}

void *__cxa_begin_catch(void *unwind_arg) throw() {
  _Unwind_Exception *unwind_exception =
      static_cast<_Unwind_Exception *>(unwind_arg);
  bool native_exception = __isOurExceptionClass(unwind_exception);
  __cxa_eh_globals *globals = __cxa_get_globals();

  __cxa_exception *exception_header =
      cxa_exception_from_exception_unwind_exception(
          static_cast<_Unwind_Exception *>(unwind_exception));

  if (native_exception) {
    exception_header->handlerCount = exception_header->handlerCount < 0
                                         ? -exception_header->handlerCount + 1
                                         : exception_header->handlerCount + 1;

    if (exception_header != globals->caughtExceptions) {
      exception_header->nextException = globals->caughtExceptions;
      globals->caughtExceptions = exception_header;
    }
    globals->uncaughtExceptions -= 1;

    return exception_header->adjustedPtr;
  }

  if (globals->caughtExceptions != 0) std::terminate();

  globals->caughtExceptions = exception_header;
  return unwind_exception + 1;
}

void __cxa_end_catch() {
  static_assert(sizeof(__cxa_exception) == sizeof(__cxa_dependent_exception),
                "sizeof(__cxa_exception) must be equal to "
                "sizeof(__cxa_dependent_exception)");
  static_assert(
      __builtin_offsetof(__cxa_exception, referenceCount) ==
          __builtin_offsetof(__cxa_dependent_exception, primaryException),
      "the layout of __cxa_exception must match the layout of "
      "__cxa_dependent_exception");
  static_assert(__builtin_offsetof(__cxa_exception, handlerCount) ==
                    __builtin_offsetof(__cxa_dependent_exception, handlerCount),
                "the layout of __cxa_exception must match the layout of "
                "__cxa_dependent_exception");
  __cxa_eh_globals *globals = __cxa_get_globals_fast();
  __cxa_exception *exception_header = globals->caughtExceptions;

  if (NULL != exception_header) {
    bool native_exception =
        __isOurExceptionClass(&exception_header->unwindHeader);
    if (native_exception) {
      if (exception_header->handlerCount < 0) {
        if (0 == incrementHandlerCount(exception_header)) {
          globals->caughtExceptions = exception_header->nextException;
        }

      } else {
        if (0 == decrementHandlerCount(exception_header)) {
          globals->caughtExceptions = exception_header->nextException;

          if (isDependentException(&exception_header->unwindHeader)) {
            __cxa_dependent_exception *dep_exception_header =
                reinterpret_cast<__cxa_dependent_exception *>(exception_header);
            exception_header = cxa_exception_from_thrown_object(
                dep_exception_header->primaryException);
            __cxa_free_dependent_exception(dep_exception_header);
          }

          __cxa_decrement_exception_refcount(
              thrown_object_from_cxa_exception(exception_header));
        }
      }
    } else {
      _Unwind_DeleteException(&globals->caughtExceptions->unwindHeader);
      globals->caughtExceptions = 0;
    }
  }
}

std::type_info *__cxa_current_exception_type() {
  __cxa_eh_globals *globals = __cxa_get_globals_fast();
  if (NULL == globals) return NULL;
  __cxa_exception *exception_header = globals->caughtExceptions;
  if (NULL == exception_header) return NULL;
  if (!__isOurExceptionClass(&exception_header->unwindHeader)) return NULL;
  return exception_header->exceptionType;
}

void __cxa_rethrow() {
  __cxa_eh_globals *globals = __cxa_get_globals();
  __cxa_exception *exception_header = globals->caughtExceptions;
  if (NULL == exception_header) std::terminate();
  bool native_exception =
      __isOurExceptionClass(&exception_header->unwindHeader);
  if (native_exception) {
    exception_header->handlerCount = -exception_header->handlerCount;
    globals->uncaughtExceptions += 1;

  } else {
    globals->caughtExceptions = 0;
  }

  _Unwind_RaiseException(&exception_header->unwindHeader);

  __cxa_begin_catch(&exception_header->unwindHeader);
  if (native_exception) std::__terminate(exception_header->terminateHandler);

  std::terminate();
}

void __cxa_increment_exception_refcount(void *thrown_object) throw() {
  if (thrown_object != NULL) {
    __cxa_exception *exception_header =
        cxa_exception_from_thrown_object(thrown_object);
    std::__libcpp_atomic_add(&exception_header->referenceCount, size_t(1));
  }
}

__attribute__((__no_sanitize__("cfi"))) void __cxa_decrement_exception_refcount(
    void *thrown_object) throw() {
  if (thrown_object != NULL) {
    __cxa_exception *exception_header =
        cxa_exception_from_thrown_object(thrown_object);
    if (std::__libcpp_atomic_add(&exception_header->referenceCount,
                                 size_t(-1)) == 0) {
      if (NULL != exception_header->exceptionDestructor)
        exception_header->exceptionDestructor(thrown_object);
      __cxa_free_exception(thrown_object);
    }
  }
}

void *__cxa_current_primary_exception() throw() {
  __cxa_eh_globals *globals = __cxa_get_globals_fast();
  if (NULL == globals) return NULL;
  __cxa_exception *exception_header = globals->caughtExceptions;
  if (NULL == exception_header) return NULL;
  if (!__isOurExceptionClass(&exception_header->unwindHeader)) return NULL;
  if (isDependentException(&exception_header->unwindHeader)) {
    __cxa_dependent_exception *dep_exception_header =
        reinterpret_cast<__cxa_dependent_exception *>(exception_header);
    exception_header = cxa_exception_from_thrown_object(
        dep_exception_header->primaryException);
  }
  void *thrown_object = thrown_object_from_cxa_exception(exception_header);
  __cxa_increment_exception_refcount(thrown_object);
  return thrown_object;
}

static void dependent_exception_cleanup(_Unwind_Reason_Code reason,
                                        _Unwind_Exception *unwind_exception) {
  __cxa_dependent_exception *dep_exception_header =
      reinterpret_cast<__cxa_dependent_exception *>(unwind_exception + 1) - 1;
  if (_URC_FOREIGN_EXCEPTION_CAUGHT != reason)
    std::__terminate(dep_exception_header->terminateHandler);
  __cxa_decrement_exception_refcount(dep_exception_header->primaryException);
  __cxa_free_dependent_exception(dep_exception_header);
}

void __cxa_rethrow_primary_exception(void *thrown_object) {
  if (thrown_object != NULL) {
    __cxa_exception *exception_header =
        cxa_exception_from_thrown_object(thrown_object);
    __cxa_dependent_exception *dep_exception_header =
        static_cast<__cxa_dependent_exception *>(
            __cxa_allocate_dependent_exception());
    dep_exception_header->primaryException = thrown_object;
    __cxa_increment_exception_refcount(thrown_object);
    dep_exception_header->exceptionType = exception_header->exceptionType;
    dep_exception_header->terminateHandler = std::get_terminate();
    setDependentExceptionClass(&dep_exception_header->unwindHeader);
    __cxa_get_globals()->uncaughtExceptions += 1;
    dep_exception_header->unwindHeader.exception_cleanup =
        dependent_exception_cleanup;

    _Unwind_RaiseException(&dep_exception_header->unwindHeader);

    __cxa_begin_catch(&dep_exception_header->unwindHeader);
  }
}

bool __cxa_uncaught_exception() throw() {
  return __cxa_uncaught_exceptions() != 0;
}

unsigned int __cxa_uncaught_exceptions() throw() {
  __cxa_eh_globals *globals = __cxa_get_globals_fast();
  if (globals == 0) return 0;
  return globals->uncaughtExceptions;
}
}

}  // namespace __cxxabiv1

namespace __cxxabiv1 {

class __attribute__((__type_visibility__("default"))) __shim_type_info
    : public std::type_info {
 public:
  __attribute__((__visibility__("hidden"))) virtual ~__shim_type_info();

  __attribute__((__visibility__("hidden"))) virtual void noop1() const;
  __attribute__((__visibility__("hidden"))) virtual void noop2() const;
  __attribute__((__visibility__("hidden"))) virtual bool can_catch(
      const __shim_type_info *thrown_type, void *&adjustedPtr) const = 0;
};

class __attribute__((__type_visibility__("default"))) __fundamental_type_info
    : public __shim_type_info {
 public:
  __attribute__((__visibility__("hidden"))) virtual ~__fundamental_type_info();
  __attribute__((__visibility__("hidden"))) virtual bool can_catch(
      const __shim_type_info *, void *&) const;
};

class __attribute__((__type_visibility__("default"))) __array_type_info
    : public __shim_type_info {
 public:
  __attribute__((__visibility__("hidden"))) virtual ~__array_type_info();
  __attribute__((__visibility__("hidden"))) virtual bool can_catch(
      const __shim_type_info *, void *&) const;
};

class __attribute__((__type_visibility__("default"))) __function_type_info
    : public __shim_type_info {
 public:
  __attribute__((__visibility__("hidden"))) virtual ~__function_type_info();
  __attribute__((__visibility__("hidden"))) virtual bool can_catch(
      const __shim_type_info *, void *&) const;
};

class __attribute__((__type_visibility__("default"))) __enum_type_info
    : public __shim_type_info {
 public:
  __attribute__((__visibility__("hidden"))) virtual ~__enum_type_info();
  __attribute__((__visibility__("hidden"))) virtual bool can_catch(
      const __shim_type_info *, void *&) const;
};

enum { unknown = 0, public_path, not_public_path, yes, no };

class __attribute__((__type_visibility__("default"))) __class_type_info;

struct __attribute__((__visibility__("hidden"))) __dynamic_cast_info {
  const __class_type_info *dst_type;
  const void *static_ptr;
  const __class_type_info *static_type;
  ptrdiff_t src2dst_offset;

  const void *dst_ptr_leading_to_static_ptr;

  const void *dst_ptr_not_leading_to_static_ptr;

  int path_dst_ptr_to_static_ptr;

  int path_dynamic_ptr_to_static_ptr;

  int path_dynamic_ptr_to_dst_ptr;

  int number_to_static_ptr;

  int number_to_dst_ptr;

  int is_dst_type_derived_from_static_type;

  int number_of_dst_type;

  bool found_our_static_ptr;

  bool found_any_static_type;

  bool search_done;
};

class __attribute__((__type_visibility__("default"))) __class_type_info
    : public __shim_type_info {
 public:
  __attribute__((__visibility__("hidden"))) virtual ~__class_type_info();

  __attribute__((__visibility__("hidden"))) void process_static_type_above_dst(
      __dynamic_cast_info *, const void *, const void *, int) const;
  __attribute__((__visibility__("hidden"))) void process_static_type_below_dst(
      __dynamic_cast_info *, const void *, int) const;
  __attribute__((__visibility__("hidden"))) void process_found_base_class(
      __dynamic_cast_info *, void *, int) const;
  __attribute__((__visibility__("hidden"))) virtual void search_above_dst(
      __dynamic_cast_info *, const void *, const void *, int, bool) const;
  __attribute__((__visibility__("hidden"))) virtual void search_below_dst(
      __dynamic_cast_info *, const void *, int, bool) const;
  __attribute__((__visibility__("hidden"))) virtual bool can_catch(
      const __shim_type_info *, void *&) const;
  __attribute__((__visibility__("hidden"))) virtual void
  has_unambiguous_public_base(__dynamic_cast_info *, void *, int) const;
};

class __attribute__((__type_visibility__("default"))) __si_class_type_info
    : public __class_type_info {
 public:
  const __class_type_info *__base_type;

  __attribute__((__visibility__("hidden"))) virtual ~__si_class_type_info();

  __attribute__((__visibility__("hidden"))) virtual void search_above_dst(
      __dynamic_cast_info *, const void *, const void *, int, bool) const;
  __attribute__((__visibility__("hidden"))) virtual void search_below_dst(
      __dynamic_cast_info *, const void *, int, bool) const;
  __attribute__((__visibility__("hidden"))) virtual void
  has_unambiguous_public_base(__dynamic_cast_info *, void *, int) const;
};

struct __attribute__((__visibility__("hidden"))) __base_class_type_info {
 public:
  const __class_type_info *__base_type;
  long __offset_flags;

  enum __offset_flags_masks {
    __virtual_mask = 0x1,
    __public_mask = 0x2,
    __offset_shift = 8
  };

  void search_above_dst(__dynamic_cast_info *, const void *, const void *, int,
                        bool) const;
  void search_below_dst(__dynamic_cast_info *, const void *, int, bool) const;
  void has_unambiguous_public_base(__dynamic_cast_info *, void *, int) const;
};

class __attribute__((__type_visibility__("default"))) __vmi_class_type_info
    : public __class_type_info {
 public:
  unsigned int __flags;
  unsigned int __base_count;
  __base_class_type_info __base_info[1];

  enum __flags_masks {
    __non_diamond_repeat_mask = 0x1,

    __diamond_shaped_mask = 0x2

  };

  __attribute__((__visibility__("hidden"))) virtual ~__vmi_class_type_info();

  __attribute__((__visibility__("hidden"))) virtual void search_above_dst(
      __dynamic_cast_info *, const void *, const void *, int, bool) const;
  __attribute__((__visibility__("hidden"))) virtual void search_below_dst(
      __dynamic_cast_info *, const void *, int, bool) const;
  __attribute__((__visibility__("hidden"))) virtual void
  has_unambiguous_public_base(__dynamic_cast_info *, void *, int) const;
};

class __attribute__((__type_visibility__("default"))) __pbase_type_info
    : public __shim_type_info {
 public:
  unsigned int __flags;
  const __shim_type_info *__pointee;

  enum __masks {
    __const_mask = 0x1,
    __volatile_mask = 0x2,
    __restrict_mask = 0x4,
    __incomplete_mask = 0x8,
    __incomplete_class_mask = 0x10,
    __transaction_safe_mask = 0x20,

    __noexcept_mask = 0x40,

    __no_remove_flags_mask = __const_mask | __volatile_mask | __restrict_mask,

    __no_add_flags_mask = __transaction_safe_mask | __noexcept_mask
  };

  __attribute__((__visibility__("hidden"))) virtual ~__pbase_type_info();
  __attribute__((__visibility__("hidden"))) virtual bool can_catch(
      const __shim_type_info *, void *&) const;
};

class __attribute__((__type_visibility__("default"))) __pointer_type_info
    : public __pbase_type_info {
 public:
  __attribute__((__visibility__("hidden"))) virtual ~__pointer_type_info();
  __attribute__((__visibility__("hidden"))) virtual bool can_catch(
      const __shim_type_info *, void *&) const;
  __attribute__((__visibility__("hidden"))) bool can_catch_nested(
      const __shim_type_info *) const;
};

class __attribute__((__type_visibility__("default")))
__pointer_to_member_type_info : public __pbase_type_info {
 public:
  const __class_type_info *__context;

  __attribute__((
      __visibility__("hidden"))) virtual ~__pointer_to_member_type_info();
  __attribute__((__visibility__("hidden"))) virtual bool can_catch(
      const __shim_type_info *, void *&) const;
  __attribute__((__visibility__("hidden"))) bool can_catch_nested(
      const __shim_type_info *) const;
};

}  // namespace __cxxabiv1

namespace __cxxabiv1 {

namespace {

template <class AsType>
uintptr_t readPointerHelper(const uint8_t *&p) {
  AsType value;
  memcpy(&value, p, sizeof(AsType));
  p += sizeof(AsType);
  return static_cast<uintptr_t>(value);
}

}  // namespace

extern "C" {

enum {
  DW_EH_PE_absptr = 0x00,
  DW_EH_PE_uleb128 = 0x01,
  DW_EH_PE_udata2 = 0x02,
  DW_EH_PE_udata4 = 0x03,
  DW_EH_PE_udata8 = 0x04,
  DW_EH_PE_sleb128 = 0x09,
  DW_EH_PE_sdata2 = 0x0A,
  DW_EH_PE_sdata4 = 0x0B,
  DW_EH_PE_sdata8 = 0x0C,
  DW_EH_PE_pcrel = 0x10,
  DW_EH_PE_textrel = 0x20,
  DW_EH_PE_datarel = 0x30,
  DW_EH_PE_funcrel = 0x40,
  DW_EH_PE_aligned = 0x50,
  DW_EH_PE_indirect = 0x80,
  DW_EH_PE_omit = 0xFF
};

static uintptr_t readULEB128(const uint8_t **data) {
  uintptr_t result = 0;
  uintptr_t shift = 0;
  unsigned char byte;
  const uint8_t *p = *data;
  do {
    byte = *p++;
    result |= static_cast<uintptr_t>(byte & 0x7F) << shift;
    shift += 7;
  } while (byte & 0x80);
  *data = p;
  return result;
}

static intptr_t readSLEB128(const uint8_t **data) {
  uintptr_t result = 0;
  uintptr_t shift = 0;
  unsigned char byte;
  const uint8_t *p = *data;
  do {
    byte = *p++;
    result |= static_cast<uintptr_t>(byte & 0x7F) << shift;
    shift += 7;
  } while (byte & 0x80);
  *data = p;
  if ((byte & 0x40) && (shift < (sizeof(result) << 3)))
    result |= static_cast<uintptr_t>(~0) << shift;
  return static_cast<intptr_t>(result);
}

static uintptr_t readEncodedPointer(const uint8_t **data, uint8_t encoding,
                                    uintptr_t base = 0) {
  uintptr_t result = 0;
  if (encoding == DW_EH_PE_omit) return result;
  const uint8_t *p = *data;

  switch (encoding & 0x0F) {
    case DW_EH_PE_absptr:
      result = readPointerHelper<uintptr_t>(p);
      break;
    case DW_EH_PE_uleb128:
      result = readULEB128(&p);
      break;
    case DW_EH_PE_sleb128:
      result = static_cast<uintptr_t>(readSLEB128(&p));
      break;
    case DW_EH_PE_udata2:
      result = readPointerHelper<uint16_t>(p);
      break;
    case DW_EH_PE_udata4:
      result = readPointerHelper<uint32_t>(p);
      break;
    case DW_EH_PE_udata8:
      result = readPointerHelper<uint64_t>(p);
      break;
    case DW_EH_PE_sdata2:
      result = readPointerHelper<int16_t>(p);
      break;
    case DW_EH_PE_sdata4:
      result = readPointerHelper<int32_t>(p);
      break;
    case DW_EH_PE_sdata8:
      result = readPointerHelper<int64_t>(p);
      break;
    default:

      abort();
      break;
  }

  switch (encoding & 0x70) {
    case DW_EH_PE_absptr:

      break;
    case DW_EH_PE_pcrel:
      if (result) result += (uintptr_t)(*data);
      break;
    case DW_EH_PE_datarel:
      assert((base != 0) && "DW_EH_PE_datarel is invalid with a base of 0");
      if (result) result += base;
      break;
    case DW_EH_PE_textrel:
    case DW_EH_PE_funcrel:
    case DW_EH_PE_aligned:
    default:

      abort();
      break;
  }

  if (result && (encoding & DW_EH_PE_indirect)) result = *((uintptr_t *)result);
  *data = p;
  return result;
}

static void call_terminate(bool native_exception,
                           _Unwind_Exception *unwind_exception) {
  __cxa_begin_catch(unwind_exception);
  if (native_exception) {
    __cxa_exception *exception_header =
        (__cxa_exception *)(unwind_exception + 1) - 1;
    std::__terminate(exception_header->terminateHandler);
  }
  std::terminate();
}

static const __shim_type_info *get_shim_type_info(
    uint64_t ttypeIndex, const uint8_t *classInfo, uint8_t ttypeEncoding,
    bool native_exception, _Unwind_Exception *unwind_exception,
    uintptr_t base = 0) {
  if (classInfo == 0) {
    call_terminate(native_exception, unwind_exception);
  }
  switch (ttypeEncoding & 0x0F) {
    case DW_EH_PE_absptr:
      ttypeIndex *= sizeof(void *);
      break;
    case DW_EH_PE_udata2:
    case DW_EH_PE_sdata2:
      ttypeIndex *= 2;
      break;
    case DW_EH_PE_udata4:
    case DW_EH_PE_sdata4:
      ttypeIndex *= 4;
      break;
    case DW_EH_PE_udata8:
    case DW_EH_PE_sdata8:
      ttypeIndex *= 8;
      break;
    default:

      call_terminate(native_exception, unwind_exception);
  }
  classInfo -= ttypeIndex;
  return (const __shim_type_info *)readEncodedPointer(&classInfo, ttypeEncoding,
                                                      base);
}

static bool exception_spec_can_catch(
    int64_t specIndex, const uint8_t *classInfo, uint8_t ttypeEncoding,
    const __shim_type_info *excpType, void *adjustedPtr,
    _Unwind_Exception *unwind_exception, uintptr_t base = 0) {
  if (classInfo == 0) {
    call_terminate(false, unwind_exception);
  }

  specIndex = -specIndex;
  --specIndex;
  const uint8_t *temp = classInfo + specIndex;

  while (true) {
    uint64_t ttypeIndex = readULEB128(&temp);
    if (ttypeIndex == 0) break;
    const __shim_type_info *catchType = get_shim_type_info(
        ttypeIndex, classInfo, ttypeEncoding, true, unwind_exception, base);
    void *tempPtr = adjustedPtr;
    if (catchType->can_catch(excpType, tempPtr)) return false;
  }
  return true;
}

static void *get_thrown_object_ptr(_Unwind_Exception *unwind_exception) {
  void *adjustedPtr = unwind_exception + 1;
  if (__getExceptionClass(unwind_exception) == kOurDependentExceptionClass)
    adjustedPtr =
        ((__cxa_dependent_exception *)adjustedPtr - 1)->primaryException;
  return adjustedPtr;
}

namespace {

struct scan_results {
  int64_t ttypeIndex;
  const uint8_t *actionRecord;
  const uint8_t *languageSpecificData;
  uintptr_t landingPad;
  void *adjustedPtr;
  _Unwind_Reason_Code reason;
};

}  // namespace

static void set_registers(_Unwind_Exception *unwind_exception,
                          _Unwind_Context *context,
                          const scan_results &results) {
  _Unwind_SetGR(context, 0, reinterpret_cast<uintptr_t>(unwind_exception));
  _Unwind_SetGR(context, 1, static_cast<uintptr_t>(results.ttypeIndex));
  _Unwind_SetIP(context, results.landingPad);
}

static void scan_eh_tab(scan_results &results, _Unwind_Action actions,
                        bool native_exception,
                        _Unwind_Exception *unwind_exception,
                        _Unwind_Context *context) {
  results.ttypeIndex = 0;
  results.actionRecord = 0;
  results.languageSpecificData = 0;
  results.landingPad = 0;
  results.adjustedPtr = 0;
  results.reason = _URC_FATAL_PHASE1_ERROR;

  if (actions & _UA_SEARCH_PHASE) {
    if (actions & (_UA_CLEANUP_PHASE | _UA_HANDLER_FRAME | _UA_FORCE_UNWIND)) {
      results.reason = _URC_FATAL_PHASE1_ERROR;
      return;
    }
  } else if (actions & _UA_CLEANUP_PHASE) {
    if ((actions & _UA_HANDLER_FRAME) && (actions & _UA_FORCE_UNWIND)) {
      results.reason = _URC_FATAL_PHASE2_ERROR;
      return;
    }
  } else {
    results.reason = _URC_FATAL_PHASE1_ERROR;
    return;
  }

  const uint8_t *lsda =
      (const uint8_t *)_Unwind_GetLanguageSpecificData(context);
  if (lsda == 0) {
    results.reason = _URC_CONTINUE_UNWIND;
    return;
  }
  results.languageSpecificData = lsda;

  uintptr_t base = 0;

  uintptr_t ip = _Unwind_GetIP(context) - 1;

  uintptr_t funcStart = _Unwind_GetRegionStart(context);

  if (ip == uintptr_t(-1)) {
    results.reason = _URC_CONTINUE_UNWIND;
    return;
  } else if (ip == 0)
    call_terminate(native_exception, unwind_exception);

  const uint8_t *classInfo = NULL;

  uint8_t lpStartEncoding = *lsda++;
  const uint8_t *lpStart =
      (const uint8_t *)readEncodedPointer(&lsda, lpStartEncoding, base);
  if (lpStart == 0) lpStart = (const uint8_t *)funcStart;
  uint8_t ttypeEncoding = *lsda++;
  if (ttypeEncoding != DW_EH_PE_omit) {
    uintptr_t classInfoOffset = readULEB128(&lsda);
    classInfo = lsda + classInfoOffset;
  }

  uint8_t callSiteEncoding = *lsda++;

  (void)callSiteEncoding;

  uint32_t callSiteTableLength = static_cast<uint32_t>(readULEB128(&lsda));
  const uint8_t *callSiteTableStart = lsda;
  const uint8_t *callSiteTableEnd = callSiteTableStart + callSiteTableLength;
  const uint8_t *actionTableStart = callSiteTableEnd;
  const uint8_t *callSitePtr = callSiteTableStart;
  while (callSitePtr < callSiteTableEnd) {
    uintptr_t landingPad = readULEB128(&callSitePtr);
    uintptr_t actionEntry = readULEB128(&callSitePtr);
    if (--ip == 0)

    {
      ++landingPad;

      results.landingPad = landingPad;
      if (actionEntry == 0) {
        results.reason = actions & _UA_SEARCH_PHASE ? _URC_CONTINUE_UNWIND
                                                    : _URC_HANDLER_FOUND;
        return;
      }

      const uint8_t *action = actionTableStart + (actionEntry - 1);
      bool hasCleanup = false;

      while (true) {
        const uint8_t *actionRecord = action;
        int64_t ttypeIndex = readSLEB128(&action);
        if (ttypeIndex > 0) {
          const __shim_type_info *catchType = get_shim_type_info(
              static_cast<uint64_t>(ttypeIndex), classInfo, ttypeEncoding,
              native_exception, unwind_exception, base);
          if (catchType == 0) {
            assert(actions &
                   (_UA_SEARCH_PHASE | _UA_HANDLER_FRAME | _UA_FORCE_UNWIND));
            results.ttypeIndex = ttypeIndex;
            results.actionRecord = actionRecord;
            results.adjustedPtr = get_thrown_object_ptr(unwind_exception);
            results.reason = _URC_HANDLER_FOUND;
            return;
          }

          else if (native_exception) {
            __cxa_exception *exception_header =
                (__cxa_exception *)(unwind_exception + 1) - 1;
            void *adjustedPtr = get_thrown_object_ptr(unwind_exception);
            const __shim_type_info *excpType =
                static_cast<const __shim_type_info *>(
                    exception_header->exceptionType);
            if (adjustedPtr == 0 || excpType == 0) {
              call_terminate(native_exception, unwind_exception);
            }
            if (catchType->can_catch(excpType, adjustedPtr)) {
              assert(actions & (_UA_SEARCH_PHASE | _UA_FORCE_UNWIND));
              results.ttypeIndex = ttypeIndex;
              results.actionRecord = actionRecord;
              results.adjustedPtr = adjustedPtr;
              results.reason = _URC_HANDLER_FOUND;
              return;
            }
          }

        } else if (ttypeIndex < 0) {
          if (actions & _UA_FORCE_UNWIND) {
          } else if (native_exception) {
            __cxa_exception *exception_header =
                (__cxa_exception *)(unwind_exception + 1) - 1;
            void *adjustedPtr = get_thrown_object_ptr(unwind_exception);
            const __shim_type_info *excpType =
                static_cast<const __shim_type_info *>(
                    exception_header->exceptionType);
            if (adjustedPtr == 0 || excpType == 0) {
              call_terminate(native_exception, unwind_exception);
            }
            if (exception_spec_can_catch(ttypeIndex, classInfo, ttypeEncoding,
                                         excpType, adjustedPtr,
                                         unwind_exception, base)) {
              assert(actions & _UA_SEARCH_PHASE);
              results.ttypeIndex = ttypeIndex;
              results.actionRecord = actionRecord;
              results.adjustedPtr = adjustedPtr;
              results.reason = _URC_HANDLER_FOUND;
              return;
            }
          } else {
            results.ttypeIndex = ttypeIndex;
            results.actionRecord = actionRecord;
            results.adjustedPtr = get_thrown_object_ptr(unwind_exception);
            results.reason = _URC_HANDLER_FOUND;
            return;
          }

        } else {
          hasCleanup = true;
        }
        const uint8_t *temp = action;
        int64_t actionOffset = readSLEB128(&temp);
        if (actionOffset == 0) {
          results.reason = hasCleanup && actions & _UA_CLEANUP_PHASE
                               ? _URC_HANDLER_FOUND
                               : _URC_CONTINUE_UNWIND;
          return;
        }

        action += actionOffset;
      }
    }
  }

  call_terminate(native_exception, unwind_exception);
}

_Unwind_Reason_Code __gxx_personality_wasm0

    (int version, _Unwind_Action actions, uint64_t exceptionClass,
     _Unwind_Exception *unwind_exception, _Unwind_Context *context) {
  if (version != 1 || unwind_exception == 0 || context == 0)
    return _URC_FATAL_PHASE1_ERROR;

  bool native_exception = (exceptionClass & get_vendor_and_language) ==
                          (kOurExceptionClass & get_vendor_and_language);
  scan_results results;

  if (actions == (_UA_CLEANUP_PHASE | _UA_HANDLER_FRAME) && native_exception) {
    __cxa_exception *exception_header =
        (__cxa_exception *)(unwind_exception + 1) - 1;
    results.ttypeIndex = exception_header->handlerSwitchValue;
    results.actionRecord = exception_header->actionRecord;
    results.languageSpecificData = exception_header->languageSpecificData;
    results.landingPad =
        reinterpret_cast<uintptr_t>(exception_header->catchTemp);
    results.adjustedPtr = exception_header->adjustedPtr;

    set_registers(unwind_exception, context, results);

    if (results.ttypeIndex < 0) {
      exception_header->catchTemp = 0;
    }
    return _URC_INSTALL_CONTEXT;
  }

  scan_eh_tab(results, actions, native_exception, unwind_exception, context);
  if (results.reason == _URC_CONTINUE_UNWIND ||
      results.reason == _URC_FATAL_PHASE1_ERROR)
    return results.reason;

  if (actions & _UA_SEARCH_PHASE) {
    assert(results.reason == _URC_HANDLER_FOUND);
    if (native_exception) {
      __cxa_exception *exc = (__cxa_exception *)(unwind_exception + 1) - 1;
      exc->handlerSwitchValue = static_cast<int>(results.ttypeIndex);
      exc->actionRecord = results.actionRecord;
      exc->languageSpecificData = results.languageSpecificData;
      exc->catchTemp = reinterpret_cast<void *>(results.landingPad);
      exc->adjustedPtr = results.adjustedPtr;

      set_registers(unwind_exception, context, results);
    }
    return _URC_HANDLER_FOUND;
  }

  assert(actions & _UA_CLEANUP_PHASE);
  assert(results.reason == _URC_HANDLER_FOUND);
  set_registers(unwind_exception, context, results);

  if (results.ttypeIndex < 0) {
    __cxa_exception *exception_header =
        (__cxa_exception *)(unwind_exception + 1) - 1;

    exception_header->catchTemp = 0;
  }
  return _URC_INSTALL_CONTEXT;
}

__attribute__((noreturn)) __attribute__((__visibility__("default"))) void
__cxa_call_unexpected(void *arg) {
  _Unwind_Exception *unwind_exception = static_cast<_Unwind_Exception *>(arg);
  if (unwind_exception == 0) call_terminate(false, unwind_exception);
  __cxa_begin_catch(unwind_exception);
  bool native_old_exception = __isOurExceptionClass(unwind_exception);
  std::terminate_handler t_handler;
  __cxa_exception *old_exception_header = 0;
  int64_t ttypeIndex;
  const uint8_t *lsda;
  uintptr_t base = 0;

  if (native_old_exception) {
    old_exception_header = (__cxa_exception *)(unwind_exception + 1) - 1;
    t_handler = old_exception_header->terminateHandler;

    ttypeIndex = old_exception_header->handlerSwitchValue;
    lsda = old_exception_header->languageSpecificData;
    base = (uintptr_t)old_exception_header->catchTemp;

  } else {
    t_handler = std::get_terminate();
  }
  if (native_old_exception) {
    uint8_t lpStartEncoding = *lsda++;
    const uint8_t *lpStart =
        (const uint8_t *)readEncodedPointer(&lsda, lpStartEncoding, base);
    (void)lpStart;
    uint8_t ttypeEncoding = *lsda++;
    if (ttypeEncoding == DW_EH_PE_omit) std::__terminate(t_handler);
    uintptr_t classInfoOffset = readULEB128(&lsda);
    const uint8_t *classInfo = lsda + classInfoOffset;

    __cxa_eh_globals *globals = __cxa_get_globals_fast();
    __cxa_exception *new_exception_header = globals->caughtExceptions;
    if (new_exception_header == 0) std::__terminate(t_handler);
    bool native_new_exception =
        __isOurExceptionClass(&new_exception_header->unwindHeader);
    void *adjustedPtr;
    if (native_new_exception &&
        (new_exception_header != old_exception_header)) {
      const __shim_type_info *excpType = static_cast<const __shim_type_info *>(
          new_exception_header->exceptionType);
      adjustedPtr = __getExceptionClass(&new_exception_header->unwindHeader) ==
                            kOurDependentExceptionClass
                        ? ((__cxa_dependent_exception *)new_exception_header)
                              ->primaryException
                        : new_exception_header + 1;
      if (!exception_spec_can_catch(ttypeIndex, classInfo, ttypeEncoding,
                                    excpType, adjustedPtr, unwind_exception,
                                    base)) {
        new_exception_header->handlerCount =
            -new_exception_header->handlerCount;
        globals->uncaughtExceptions += 1;

        __cxa_end_catch();

        __cxa_end_catch();

        __cxa_begin_catch(&new_exception_header->unwindHeader);

        throw;
      }
    }

    const __shim_type_info *excpType =
        static_cast<const __shim_type_info *>(&typeid(std::bad_exception));
    std::bad_exception be;
    adjustedPtr = &be;
    if (!exception_spec_can_catch(ttypeIndex, classInfo, ttypeEncoding,
                                  excpType, adjustedPtr, unwind_exception,
                                  base)) {
      __cxa_end_catch();

      throw be;
    }
  }
  std::__terminate(t_handler);
}
}

}  // namespace __cxxabiv1

extern "C" {

_Unwind_Reason_Code __gxx_personality_wasm0(int version, _Unwind_Action actions,
                                            uint64_t exceptionClass,
                                            _Unwind_Exception *unwind_exception,
                                            _Unwind_Context *context);

struct _Unwind_LandingPadContext {
  uintptr_t lpad_index;
  uintptr_t lsda;

  uintptr_t selector;
};

thread_local struct _Unwind_LandingPadContext __wasm_lpad_context;

_Unwind_Reason_Code _Unwind_CallPersonality(void *exception_ptr) {
  struct _Unwind_Exception *exception_object =
      (struct _Unwind_Exception *)exception_ptr;

  __wasm_lpad_context.selector = 0;

  _Unwind_Reason_Code ret = __gxx_personality_wasm0(
      1, _UA_SEARCH_PHASE, exception_object->exception_class, exception_object,
      (struct _Unwind_Context *)&__wasm_lpad_context);
  return ret;
}

__attribute__((visibility("default"))) _Unwind_Reason_Code
_Unwind_RaiseException(_Unwind_Exception *exception_object) {
#if __has_builtin(__builtin_wasm_throw)
  __builtin_wasm_throw(0, exception_object);
#else
  return _URC_NO_REASON;
#endif
}

__attribute__((visibility("default"))) void _Unwind_DeleteException(
    _Unwind_Exception *exception_object) {
  if (exception_object->exception_cleanup != NULL)
    (*exception_object->exception_cleanup)(_URC_FOREIGN_EXCEPTION_CAUGHT,
                                           exception_object);
}

__attribute__((visibility("default"))) void _Unwind_SetGR(
    struct _Unwind_Context *context, int index, uintptr_t value) {
  if (index != 1) return;
  ((struct _Unwind_LandingPadContext *)context)->selector = value;
}

__attribute__((visibility("default"))) uintptr_t _Unwind_GetIP(
    struct _Unwind_Context *context) {
  uintptr_t result =
      ((struct _Unwind_LandingPadContext *)context)->lpad_index + 2;

  return result;
}

__attribute__((visibility("default"))) void _Unwind_SetIP(
    struct _Unwind_Context *context, uintptr_t value) {}

__attribute__((visibility("default"))) uintptr_t
_Unwind_GetLanguageSpecificData(struct _Unwind_Context *context) {
  uintptr_t result = ((struct _Unwind_LandingPadContext *)context)->lsda;

  return result;
}

__attribute__((visibility("default"))) uintptr_t _Unwind_GetRegionStart(
    struct _Unwind_Context *context) {
  return 0;
}
}
