#ifndef TOWER_TEMPORAL_CORE_H
#define TOWER_TEMPORAL_CORE_H

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/* COMPILER INTRINSICS -- emitted by the compiler, not user tracking calls.
 * These declare the memory/lifetime part of the prototype's instruction set.
 * Ordinary arithmetic, SSA operands, branches, calls and returns are recorded
 * by the instrumented execution engine as well; see temporal-core-api.md.
 * This header is an interface specification, not a native implementation.
 */

/* At module initialization, register one static object's actual storage and
 * copy its initial bytes. Its owner is the default root history. Registrations
 * must not overlap, and finish before any user API call. byte_count is > 0;
 * initial must provide that many readable bytes (it is not a null/zero flag).
 */
void builtin_temporal_global(
    void *base, const void *initial, size_t byte_count);

/* Begin a zero-initialized allocation in the currently executing history.
 * byte_count is > 0; alignment is a supported positive power of two.
 * The runtime records its address, extent, alignment, owner and lifetime.
 * The compiler uses this for heap allocation and addressable local storage.
 */
void *builtin_temporal_alloc(size_t byte_count, size_t alignment);

/* End this allocation's logical lifetime in its owning history.
 * Require the exact non-null base of a live allocation, not an interior pointer.
 * Retain the historical allocation information needed for replay.
 */
void builtin_temporal_free(void *allocation);

/* Execute an ordinary scalar load and record the exact byte producers read.
 * byte_count is 1, 2, 4 or 8 in this prototype instruction set.
 * The returned value also participates in ordinary operand dependencies.
 */
uint64_t builtin_temporal_load(const void *address, size_t byte_count);

/* Execute an ordinary scalar store, with its value/address dependencies.
 * byte_count is 1, 2, 4 or 8; store the low byte_count bytes of value.
 * This is not a user intervention and does not return an amendable Write.
 */
void builtin_temporal_store(
    void *address, uint64_t value, size_t byte_count);

/* USER API -- all handles are opaque values, not output parameters. */
typedef struct TemporalHistoryHandle *History;
typedef struct TemporalPointHandle *Point;
typedef struct TemporalEditHandle *Edit;
typedef struct TemporalWriteHandle *Write;

typedef enum TemporalStatus {
    TEMPORAL_OK,
    TEMPORAL_ORPHANED_POINT,
    TEMPORAL_TRAP
} TemporalStatus;

/* An instrumented entry receives an immutable, captured argument block.
 * It returns one machine word, which can carry a pointer to owned result data.
 */
typedef uintptr_t (*TemporalEntry)(const void *arguments);

/* Create an empty history controlled by the caller's current history, or by
 * the host when called outside tracked execution. Allocate no user storage.
 */
History temporal_create(void);

/* Destroy this history and descendants; end their allocations and invalidate
 * their public handles. Only the controller may do this to a paused target.
 * NULL is the default root history and cannot be destroyed.
 * An ancestor repair that undoes this destruction may restore the same object.
 */
void temporal_destroy(History history);

/* Append and execute an entry in a paused history controlled by the caller.
 * Capture argument_bytes now; zero bytes permits arguments == NULL.
 * Ordinary calls below entry need no special calls or annotations.
 * A failed entry leaves the old published subtree intact and raises a trap.
 */
uintptr_t temporal_run(
    History history, TemporalEntry entry,
    const void *arguments, size_t argument_bytes);

/* Capture an exact gap: here in the executing history, or the current end of
 * a paused history. An empty history has a start/end gap. The gap does not move
 * when later execution is appended. Keep the Point while its occurrence lives.
 * NULL always means the default root, not the currently executing child.
 */
Point temporal_point(History history);

/* Begin an atomic correction batch for a paused, controlled history.
 * One batch per target; overlapping ancestor/descendant batches are forbidden.
 */
Edit temporal_edit(History history);

/* Insert one write at Point; this also covers writing at the current end.
 * Capture all source bytes NOW, before any repair; byte_count must be > 0.
 * Source/destination overlap is allowed. Destination must belong to this
 * history and be writable/live AT THE POINT, not necessarily at the present.
 * Validate destination ownership/bounds/lifetime during repair at that gap.
 * Return its provisional identity; insertion order at the same gap is retained.
 */
Write temporal_store_at(
    Edit edit, Point point, void *destination,
    const void *source, size_t byte_count);

/* Replace an inserted write's captured bytes, preserving its identity, gap,
 * destination, extent and order. Capture exactly its original byte count now.
 */
void temporal_replace(Edit edit, Write write, const void *source);

/* Remove an inserted write. This does not erase an ordinary program store.
 */
void temporal_remove(Edit edit, Write write);

/* Consume the batch and repair atomically. Non-OK preserves the old published
 * subtree. ORPHANED_POINT means an insertion lost its exact historical gap;
 * TRAP means corrected execution failed. Nested OK is provisional until the
 * enclosing parent operation also succeeds. No separate budget-limit status.
 */
TemporalStatus temporal_repair(Edit edit);

/* Consume the batch without applying it; invalidate its provisional writes.
 * A tracked ancestor may later change this outcome by repairing its own past.
 */
void temporal_cancel(Edit edit);

#ifdef __cplusplus
}
#endif
#endif
