/* C-like source illustration, not a native temporal runtime implementation.
 * The executable lowering is temporal-core-example.mjs.
 */
#include "temporal-core.h"
#include <assert.h>

/* Temporal-module globals: the compiler registers each separately in root. */
static uint32_t a = 3;
static uint32_t b = 5;
static uint32_t c = 9;
static uint32_t d = 1;
static uint32_t result;
static Point middle;

/* Instrumented module code: no user calls to builtin_temporal_load/store. */
static uintptr_t compute(const void *arguments)
{
    (void)arguments;
    result = (a + b) * c;
    return (uintptr_t)&result;
}

static uintptr_t compute_middle(const void *arguments)
{
    (void)arguments;
    uint32_t sum = a + b;
    middle = temporal_point(NULL);
    result = sum * (c + d);
    return (uintptr_t)&result;
}

/* Host/controller code. Compiler-generated module initialization has already
 * registered a,b,c,d,result,middle before this function is called.
 * These host locals are source buffers, not temporal-module global storage.
 */
void temporal_example_controller(void)
{
    Point start = temporal_point(NULL);
    temporal_run(NULL, compute, NULL, 0);
    assert(result == 72);

    uint32_t six = 6;
    Edit edit = temporal_edit(NULL);
    Write correction = temporal_store_at(edit, start, &c, &six, sizeof six);
    assert(temporal_repair(edit) == TEMPORAL_OK);
    assert(result == 48);

    edit = temporal_edit(NULL);
    temporal_remove(edit, correction);
    assert(temporal_repair(edit) == TEMPORAL_OK);
    assert(result == 72);

    temporal_run(NULL, compute_middle, NULL, 0);
    assert(result == 80);
    uint32_t two = 2;
    edit = temporal_edit(NULL);
    temporal_store_at(edit, middle, &d, &two, sizeof two);
    assert(temporal_repair(edit) == TEMPORAL_OK);
    assert(result == 88);
}
