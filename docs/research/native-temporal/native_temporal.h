#ifndef NATIVE_TEMPORAL_H
#define NATIVE_TEMPORAL_H
#include <stdint.h>
#include "../temporal-core.h"
#ifdef __cplusplus
extern "C" {
#endif
/* INTERNAL runtime and measurement hooks, not a second proposed user API.
 * Public demonstration calls the agreed temporal-core.h declarations above.
 * The linked implementation is a restricted subset of that contract:
 * one isolated owner, aligned u64 cells, fixed memory-access shape per region.
 */
typedef struct TemporalHistoryHandle NtHistory;
typedef uint32_t NtWrite;
typedef void (*NtKernel)(void *, uint64_t *, uint32_t, uint32_t, uint32_t);
typedef struct NtStats { uint64_t regions, changed_versions, edges; } NtStats;
uint64_t nt_load(void *history, const uint64_t *address);
void nt_store(void *history, uint64_t *address, uint64_t value);
void nt_undo_store(void *log, uint64_t *address, uint64_t value);
/* Harness-only append of captured inputs, without allocating public handles. */
NtWrite nt_input(NtHistory *, uint32_t cell, uint64_t value);
void nt_run(NtHistory *, NtKernel, uint32_t entity, uint32_t neighbor, uint32_t work);
void nt_edit(NtHistory *);
void nt_replace(NtHistory *, NtWrite, const uint64_t *captured_source);
/* 1 = committed; 0 = unsupported changed access shape, old publication preserved. */
int nt_repair(NtHistory *, NtKernel, NtStats *);
void nt_cancel(NtHistory *);
#ifdef __cplusplus
}
#endif
#endif
