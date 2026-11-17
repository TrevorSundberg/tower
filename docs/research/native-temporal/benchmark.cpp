// Native runtime experiment. See README.md for the deliberately restricted contract.
#include "native_temporal.h"
#include <windows.h>
#include <algorithm>
#include <chrono>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <functional>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

extern "C" void kernel_plain(void *, uint64_t *, uint32_t, uint32_t, uint32_t);
extern "C" void kernel_undo(void *, uint64_t *, uint32_t, uint32_t, uint32_t);
extern "C" void kernel_tracked(void *, uint64_t *, uint32_t, uint32_t, uint32_t);
static constexpr uint32_t none = UINT32_MAX;
static void require(bool b, const char *s) { if (!b) throw std::runtime_error(s); }
using Clock = std::chrono::steady_clock;
static double elapsed(Clock::time_point t) {
    return std::chrono::duration<double, std::milli>(Clock::now() - t).count();
}
struct Read { uint32_t cell, version; };
struct Edge { uint32_t consumer, next; };
struct Version {
    uint64_t value, candidate;
    uint32_t head, cell, epoch, reserved;
};
struct Region {
    uint32_t read_begin, write_begin, entity, neighbor, work, reads, writes, queued;
};
static_assert(sizeof(Read) == 8 && sizeof(Edge) == 8 && sizeof(Version) == 32 && sizeof(Region) == 32);
// Offset-only file layout. Native callbacks and host handles are NEVER serialized.
struct Header {
    uint64_t magic, bytes, state_offset, shadow_offset, versions_offset;
    uint64_t regions_offset, reads_offset, edges_offset, inputs_offset;
    uint32_t entities, ticks, mode, work, cells, nv, nr, ne, nl, epoch;
    uint32_t version_capacity, region_capacity, read_capacity, edge_capacity;
};
static constexpr uint64_t magic = 0x544f574552303031ull;
struct Arena {
    char *base = nullptr;
    size_t bytes = 0;
    HANDLE file = INVALID_HANDLE_VALUE, mapping = nullptr;
    ~Arena() { close(); }
    void close() {
        if (mapping) { UnmapViewOfFile(base); CloseHandle(mapping); }
        else if (base) _aligned_free(base);
        if (file != INVALID_HANDLE_VALUE) CloseHandle(file);
        base = nullptr; mapping = nullptr; file = INVALID_HANDLE_VALUE;
    }
    void ram(size_t size) {
        bytes = size; base = static_cast<char *>(_aligned_malloc(size, 64));
        require(base != nullptr, "arena allocation failed");
    }
    void map(const char *path, size_t size, bool create) {
        bytes = size;
        file = CreateFileA(path, GENERIC_READ | GENERIC_WRITE, 0, nullptr,
                           create ? CREATE_ALWAYS : OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, nullptr);
        require(file != INVALID_HANDLE_VALUE, "open history file failed");
        if (!create) { LARGE_INTEGER actual; require(GetFileSizeEx(file, &actual) &&
                           uint64_t(actual.QuadPart) == size, "history size mismatch"); }
        mapping = CreateFileMappingA(file, nullptr, PAGE_READWRITE, DWORD(size >> 32), DWORD(size), nullptr);
        require(mapping != nullptr, "create mapping failed");
        base = static_cast<char *>(MapViewOfFile(mapping, FILE_MAP_ALL_ACCESS, 0, 0, size));
        require(base != nullptr, "map history failed");
    }
    void flush() { require(mapping && FlushViewOfFile(base, bytes) && FlushFileBuffers(file), "flush failed"); }
};
struct TemporalHistoryHandle {
    Arena arena;
    Header *h = nullptr;
    uint64_t *state = nullptr;
    uint32_t *shadow = nullptr, *inputs = nullptr;
    Version *versions = nullptr;
    Region *regions = nullptr;
    Read *reads = nullptr;
    Edge *edges = nullptr;
    uint32_t active = 0, read_cursor = 0, write_cursor = 0;
    bool repairing = false, trapped = false, editing = false;
    std::vector<std::pair<uint32_t, uint64_t>> edits;
    std::vector<uint32_t> queue, changed;
    std::vector<Point> points;
    std::vector<Write> handles;
    NtStats stats{};
    void bind() {
        h = reinterpret_cast<Header *>(arena.base);
        state = reinterpret_cast<uint64_t *>(arena.base + h->state_offset);
        shadow = reinterpret_cast<uint32_t *>(arena.base + h->shadow_offset);
        versions = reinterpret_cast<Version *>(arena.base + h->versions_offset);
        regions = reinterpret_cast<Region *>(arena.base + h->regions_offset);
        reads = reinterpret_cast<Read *>(arena.base + h->reads_offset);
        edges = reinterpret_cast<Edge *>(arena.base + h->edges_offset);
        inputs = reinterpret_cast<uint32_t *>(arena.base + h->inputs_offset);
    }
};
static thread_local NtHistory *executing = nullptr;
struct TemporalWriteHandle { NtHistory *owner; NtWrite version; };
struct TemporalPointHandle { NtHistory *owner; uint32_t region_count, version_count; };
struct TemporalEditHandle { NtHistory *owner; };

static Header layout(uint32_t n, uint32_t ticks, uint32_t mode, uint32_t work) {
    require(n && ticks && uint64_t(n) * ticks < 100000000, "configuration too large");
    Header h{}; h.magic = magic; h.entities = n; h.ticks = ticks; h.mode = mode; h.work = work;
    h.cells = n * 4; h.region_capacity = n * ticks;
    h.version_capacity = h.cells + 3 * h.region_capacity + 16;
    h.read_capacity = h.edge_capacity = 6 * h.region_capacity;
    uint64_t cursor = sizeof(Header);
    auto section = [&](uint64_t bytes) { cursor = (cursor + 63) & ~uint64_t(63);
        uint64_t out = cursor; cursor += bytes; return out; };
    h.state_offset = section(h.cells * 8ull); h.shadow_offset = section(h.cells * 4ull);
    h.versions_offset = section(h.version_capacity * sizeof(Version));
    h.regions_offset = section(h.region_capacity * sizeof(Region));
    h.reads_offset = section(h.read_capacity * sizeof(Read));
    h.edges_offset = section(h.edge_capacity * sizeof(Edge));
    h.inputs_offset = section(h.region_capacity * 4ull);
    h.bytes = (cursor + 63) & ~uint64_t(63);
    return h;
}
static std::vector<uint64_t> initial(uint32_t n) {
    std::vector<uint64_t> s(n * 4);
    for (uint32_t i = 0; i < n; ++i) { s[4*i] = i * 17 + 3;
        s[4*i+1] = i + 1; s[4*i+2] = 0; s[4*i+3] = i * 31 + 7; }
    return s;
}
static void configure(NtHistory *p, uint32_t n, uint32_t ticks, uint32_t mode,
                      uint32_t work, const char *path = nullptr) {
    Header header = layout(n, ticks, mode, work);
    if (path) p->arena.map(path, size_t(header.bytes), true); else p->arena.ram(size_t(header.bytes));
    std::memcpy(p->arena.base, &header, sizeof header); p->bind();
    auto s = initial(n); std::memcpy(p->state, s.data(), s.size() * 8);
    for (uint32_t c = 0; c < header.cells; ++c) {
        p->shadow[c] = c; p->versions[c] = {s[c], 0, none, c, 0, 0}; }
    p->h->nv = header.cells;
    // Reserve once. Access recording, scheduling, and publication allocate nothing.
    p->queue.reserve(header.region_capacity); p->changed.reserve(header.version_capacity);
    p->edits.reserve(n);
}
static uint32_t cell(NtHistory *p, const uint64_t *addr) {
    uintptr_t offset = reinterpret_cast<uintptr_t>(addr) - reinterpret_cast<uintptr_t>(p->state);
    if ((offset & 7) || offset / 8 >= p->h->cells) { p->trapped = true; return 0; }
    return uint32_t(offset / 8);
}
static uint32_t version(NtHistory *p, uint32_t c, uint64_t value) {
    require(p->h->nv < p->h->version_capacity, "version arena full");
    uint32_t v = p->h->nv++; p->versions[v] = {value, 0, none, c, 0, 0}; return v;
}
static uint64_t value(NtHistory *p, uint32_t v) {
    auto &x = p->versions[v]; return x.epoch == p->h->epoch ? x.candidate : x.value;
}
static void schedule(NtHistory *p, uint32_t producer) {
    for (uint32_t e = p->versions[producer].head; e != none; e = p->edges[e].next) {
        ++p->stats.edges; auto id = p->edges[e].consumer;
        if (p->regions[id].queued == p->h->epoch) continue;
        p->regions[id].queued = p->h->epoch;
        p->queue.push_back(id); std::push_heap(p->queue.begin(), p->queue.end(), std::greater<uint32_t>());
    }
}
static void candidate(NtHistory *p, uint32_t v, uint64_t val) {
    if (value(p, v) == val) return;
    auto &out = p->versions[v];
    if (out.epoch != p->h->epoch) { out.epoch = p->h->epoch; p->changed.push_back(v); }
    out.candidate = val; schedule(p, v);
}
extern "C" uint64_t nt_load(void *ctx, const uint64_t *addr) {
    auto *p = static_cast<NtHistory *>(ctx); uint32_t c = cell(p, addr);
    if(p->trapped) return 0;
    auto &r = p->regions[p->active];
    if (p->repairing) {
        if (p->read_cursor >= r.reads) { p->trapped = true; return 0; }
        auto &read = p->reads[r.read_begin + p->read_cursor++];
        if (read.cell != c) { p->trapped = true; return 0; }
        return value(p, read.version);
    }
    require(p->h->nl < p->h->read_capacity && p->h->ne < p->h->edge_capacity, "read arena full");
    uint32_t v = p->shadow[c], e = p->h->ne++;
    p->reads[p->h->nl++] = {c, v}; ++r.reads;
    p->edges[e] = {p->active, p->versions[v].head}; p->versions[v].head = e;
    return *addr;
}
extern "C" void nt_store(void *ctx, uint64_t *addr, uint64_t val) {
    auto *p = static_cast<NtHistory *>(ctx); uint32_t c = cell(p, addr);
    if(p->trapped) return;
    auto &r = p->regions[p->active];
    if (p->repairing) {
        if (p->write_cursor >= r.writes) { p->trapped = true; return; }
        uint32_t v = r.write_begin + p->write_cursor++;
        if (p->versions[v].cell != c) { p->trapped = true; return; }
        candidate(p, v, val); return;
    }
    uint32_t v = version(p, c, val); ++r.writes; p->shadow[c] = v; *addr = val;
}
extern "C" uint64_t builtin_temporal_load(const void *addr, size_t bytes) {
    require(executing && bytes == 8, "native proof supports aligned u64 loads only");
    return nt_load(executing, static_cast<const uint64_t *>(addr));
}
extern "C" void builtin_temporal_store(void *addr, uint64_t val, size_t bytes) {
    require(executing && bytes == 8, "native proof supports aligned u64 stores only");
    nt_store(executing, static_cast<uint64_t *>(addr), val);
}
extern "C" NtWrite nt_input(NtHistory *p, uint32_t c, uint64_t val) {
    require(c < p->h->cells && !p->repairing, "invalid input");
    uint32_t v = version(p, c, val); p->shadow[c] = v; p->state[c] = val; return v;
}
extern "C" void nt_run(NtHistory *p, NtKernel kernel, uint32_t e, uint32_t neighbor, uint32_t work) {
    require(p->h->nr < p->h->region_capacity && !p->editing, "invalid run");
    p->active = p->h->nr++;
    auto &r = p->regions[p->active]; r = {p->h->nl, p->h->nv, e, neighbor, work, 0, 0, 0};
    executing = p; kernel(p, p->state, e, neighbor, work); executing = nullptr;
    require(!p->trapped && r.reads == 6 && r.writes == 2, "unexpected native access shape");
}
extern "C" void nt_edit(NtHistory *p) {
    require(!p->editing, "edit already open"); p->editing = true; p->edits.clear();
}
extern "C" void nt_replace(NtHistory *p, NtWrite w, const uint64_t *source) {
    require(p->editing && w < p->h->nv, "invalid edit");
    // Internal helper accepts version IDs; public Write handles are only inputs.
    for (auto &edit : p->edits) if (edit.first == w) { edit.second = *source; return; }
    p->edits.emplace_back(w, *source);
}
extern "C" void nt_cancel(NtHistory *p) { require(p->editing, "no edit"); p->editing = false; p->edits.clear(); }
extern "C" int nt_repair(NtHistory *p, NtKernel kernel, NtStats *stats) {
    require(p->editing && p->h->epoch != UINT32_MAX, "invalid edit or epoch exhausted");
    ++p->h->epoch; p->queue.clear(); p->changed.clear(); p->stats = {};
    p->repairing = true; p->trapped = false;
    for (auto edit : p->edits) candidate(p, edit.first, edit.second);
    while (!p->queue.empty() && !p->trapped) {
        std::pop_heap(p->queue.begin(), p->queue.end(), std::greater<uint32_t>());
        p->active = p->queue.back(); p->queue.pop_back();
        auto &r = p->regions[p->active]; p->read_cursor = p->write_cursor = 0;
        executing = p; kernel(p, p->state, r.entity, r.neighbor, r.work); executing = nullptr;
        ++p->stats.regions;
        if (p->read_cursor != r.reads || p->write_cursor != r.writes) p->trapped = true;
    }
    if (!p->trapped) for (uint32_t v : p->changed) {
        auto &out = p->versions[v]; out.value = out.candidate;
        if (p->shadow[out.cell] == v) p->state[out.cell] = out.value;
    }
    p->stats.changed_versions = p->changed.size(); *stats = p->stats;
    p->repairing = p->editing = false; return p->trapped ? 0 : 1;
}

// Public API demonstration uses the AGREED header. These are deliberately a
// subset: explicit histories, native step entries, end-gap insertion, replacement.
// Public handles are retained until their owning history is destroyed.
struct StepArgs { uint32_t entity, neighbor, work; };
static uintptr_t native_step(const void *args) {
    auto a = *static_cast<const StepArgs *>(args);
    kernel_tracked(executing, executing->state, a.entity, a.neighbor, a.work); return 0;
}
extern "C" History temporal_create() { return new NtHistory; }
extern "C" void temporal_destroy(History p) {
    require(p && !p->editing && executing != p, "invalid destroy");
    for(auto point:p->points) delete point;
    for(auto write:p->handles) delete write;
    delete p;
}
extern "C" uintptr_t temporal_run(History p, TemporalEntry entry, const void *args, size_t size) {
    require(p && entry == native_step && size == sizeof(StepArgs), "unsupported entry");
    StepArgs captured; std::memcpy(&captured, args, sizeof captured);
    nt_run(p, kernel_tracked, captured.entity, captured.neighbor, captured.work); return 0;
}
extern "C" Point temporal_point(History p) {
    require(p && !p->editing, "invalid point");
    auto point = new TemporalPointHandle{p, p->h->nr, p->h->nv}; p->points.push_back(point); return point;
}
extern "C" Edit temporal_edit(History p) { nt_edit(p); return new TemporalEditHandle{p}; }
extern "C" void temporal_replace(Edit e, Write w, const void *source) {
    require(e && w && e->owner == w->owner, "wrong owner");
    uint64_t captured; std::memcpy(&captured, source, 8); nt_replace(e->owner, w->version, &captured);
}
// This subset supports end-gap insertion ONLY, used to create an input before its
// consumers run. Past replacement below is fully selective. No past insertion claim.
struct PendingInsert { Edit edit; Point point; uint32_t cell; uint64_t value; Write write; };
static std::vector<PendingInsert> inserts;
extern "C" Write temporal_store_at(Edit e, Point point, void *dest, const void *source, size_t size) {
    auto p = e->owner;
    require(point && point->owner == p && point->region_count == p->h->nr &&
            point->version_count == p->h->nv && size == 8, "native subset requires current end gap and u64");
    uint64_t captured; std::memcpy(&captured, source, 8);
    uint32_t c = cell(p, static_cast<uint64_t *>(dest)); require(!p->trapped, "invalid destination");
    auto w = new TemporalWriteHandle{p, none}; p->handles.push_back(w);
    inserts.push_back({e, point, c, captured, w}); return w;
}
extern "C" TemporalStatus temporal_repair(Edit e) {
    NtStats stats{}; auto p = e->owner;
    bool ok = nt_repair(p, kernel_tracked, &stats) != 0;
    for (auto &i : inserts) if (i.edit == e && ok) i.write->version = nt_input(p, i.cell, i.value);
    inserts.erase(std::remove_if(inserts.begin(), inserts.end(), [e](auto &i){ return i.edit == e; }), inserts.end());
    delete e; return ok ? TEMPORAL_OK : TEMPORAL_TRAP;
}
extern "C" void temporal_cancel(Edit e) {
    nt_cancel(e->owner);
    inserts.erase(std::remove_if(inserts.begin(), inserts.end(), [e](auto &i){ return i.edit == e; }), inserts.end());
    delete e;
}

struct Undo { uint32_t cell, padding; uint64_t before; };
struct UndoLog { uint64_t *base; std::vector<Undo> log; size_t used = 0; };
extern "C" void nt_undo_store(void *ctx, uint64_t *addr, uint64_t val) {
    auto &l = *static_cast<UndoLog *>(ctx);
    require(l.used < l.log.size(), "undo log full");
    l.log[l.used++] = {uint32_t(addr-l.base), 0, *addr}; *addr = val;
}
static uint64_t command(uint32_t tick, uint32_t entity) { return uint64_t(tick)*101 + entity*13 + 19; }
static uint32_t neighbor(uint32_t entity, uint32_t n, uint32_t mode) {
    return mode == 0 ? entity : mode == 1 ? (entity + 1) % n : 0;
}
struct Patch { uint32_t tick, entity; uint64_t value; };
static uint64_t input(uint32_t t, uint32_t e, const std::vector<Patch> &patches) {
    uint64_t v = command(t, e);
    for (auto &p : patches) if (p.tick == t && p.entity == e) v = p.value;
    return v;
}
// Benchmark batches correct entities [0,K) at ONE tick. O(1) lookup keeps the
// baseline free of an accidental O(N*K) patch-search penalty. Oracle stays separate.
static uint64_t benchmark_input(uint32_t t, uint32_t e, const std::vector<Patch> &patches) {
    return !patches.empty() && t == patches[0].tick && e < patches.size() ? patches[e].value : command(t,e);
}
static void forward_plain(std::vector<uint64_t> &s, uint32_t n, uint32_t ticks,
                          uint32_t mode, uint32_t work, uint32_t start,
                          const std::vector<Patch> &patches, std::vector<uint64_t> *snapshots = nullptr) {
    for (uint32_t t = start; t < ticks; ++t) {
        if (snapshots) std::memcpy(snapshots->data() + size_t(t)*s.size(), s.data(), s.size()*8);
        for (uint32_t e = 0; e < n; ++e) {
            s[4*e+2] = benchmark_input(t,e,patches); kernel_plain(nullptr,s.data(),e,neighbor(e,n,mode),work);
        }
    }
}
static void forward_undo(std::vector<uint64_t> &s, UndoLog &log, uint32_t n, uint32_t ticks,
                         uint32_t mode, uint32_t work, uint32_t start, const std::vector<Patch> &patches) {
    for (uint32_t t = start; t < ticks; ++t) for (uint32_t e = 0; e < n; ++e) {
        nt_undo_store(&log, &s[4*e+2], benchmark_input(t,e,patches));
        kernel_undo(&log,s.data(),e,neighbor(e,n,mode),work);
    }
}
static void forward_tracked(NtHistory *p) {
    auto &h = *p->h;
    for (uint32_t t = 0; t < h.ticks; ++t) for (uint32_t e = 0; e < h.entities; ++e) {
        p->inputs[t*h.entities+e] = nt_input(p,4*e+2,command(t,e));
        StepArgs args{e,neighbor(e,h.entities,h.mode),h.work};
        temporal_run(p,native_step,&args,sizeof args);
    }
}
// Independent numerical oracle: no generated kernel, tracking or scheduler calls.
static std::vector<uint64_t> oracle(uint32_t n, uint32_t ticks, uint32_t mode, uint32_t work,
                                   const std::vector<Patch> &patches, std::vector<uint64_t> *versions = nullptr) {
    auto s = initial(n); if (versions) *versions = s;
    for (uint32_t t = 0; t < ticks; ++t) for (uint32_t e = 0; e < n; ++e) {
        uint64_t cmd = input(t,e,patches); s[4*e+2] = cmd;
        uint64_t x = s[4*e], v = s[4*e+1], c = s[4*e+3];
        uint64_t a = ((x+cmd)+(s[4*neighbor(e,n,mode)]+c))^c;
        for (uint32_t k = 0; k < work; ++k) a = (a*6364136223846793005ull)^(a>>23);
        v += a & 65535; s[4*e+1] = v; s[4*e] = x+v;
        if (versions) { versions->push_back(cmd); versions->push_back(v); versions->push_back(x+v); }
    }
    return s;
}
static void verify(NtHistory *p, const std::vector<Patch> &patches) {
    std::vector<uint64_t> versions;
    auto expected = oracle(p->h->entities,p->h->ticks,p->h->mode,p->h->work,patches,&versions);
    require(std::equal(expected.begin(),expected.end(),p->state), "state differs from oracle");
    require(versions.size() == p->h->nv, "version count differs");
    for (size_t v = 0; v < versions.size(); ++v) require(versions[v] == p->versions[v].value, "historical version differs");
}
static void wrong_shape(void *p, uint64_t *s, uint32_t, uint32_t, uint32_t) {
    nt_store(p, s+3, 999); // corrected code would change its write address: reject atomically.
}
static uint64_t hash(const uint64_t *s, size_t count) {
    uint64_t h = 1469598103934665603ull;
    for (size_t i = 0; i < count; ++i) h = (h ^ s[i])*1099511628211ull;
    return h;
}
static void tests() {
    uint32_t comparisons = 0;
    for (uint32_t mode = 0; mode < 3; ++mode) {
        History p = temporal_create(); configure(p,16,12,mode,7); forward_tracked(p); verify(p,{});
        std::vector<Patch> patches;
        uint32_t random = 42;
        for (uint32_t trial = 0; trial < 100; ++trial) {
            random = random*1664525u+1013904223u; uint32_t t = random%12;
            random = random*1664525u+1013904223u; uint32_t e = random%16;
            uint64_t val = random;
            patches.push_back({t,e,val});
            TemporalWriteHandle handle{p,p->inputs[t*16+e]};
            Edit edit = temporal_edit(p); temporal_replace(edit,&handle,&val);
            val = 0; // capture-by-value must survive caller mutation.
            require(temporal_repair(edit) == TEMPORAL_OK,"repair failed"); verify(p,patches); ++comparisons;
        }
        uint64_t before = hash(p->state,p->h->cells), changed = 123;
        NtWrite target = p->inputs[0];
        nt_edit(p); nt_replace(p,target,&changed); nt_cancel(p); verify(p,patches);
        uint64_t same = p->versions[target].value; NtStats stats;
        nt_edit(p); nt_replace(p,target,&same); require(nt_repair(p,kernel_tracked,&stats) && stats.regions == 0,"no-op scheduled work");
        nt_edit(p); nt_replace(p,target,&changed); require(!nt_repair(p,wrong_shape,&stats),"shape trap missing");
        require(before == hash(p->state,p->h->cells),"failed repair published"); verify(p,patches);
        nt_edit(p); nt_replace(p,target,&same); require(nt_repair(p,kernel_tracked,&stats),"repair after trap failed"); verify(p,patches);
        // Simultaneous edits and repeated replacements in one batch.
        nt_edit(p);
        for (uint32_t e = 0; e < 16; ++e) { uint64_t v = 123+e; nt_replace(p,p->inputs[16+e],&v);
            v += 100; nt_replace(p,p->inputs[16+e],&v); patches.push_back({1,e,v}); }
        require(nt_repair(p,kernel_tracked,&stats),"batch failed"); verify(p,patches); ++comparisons;
        temporal_destroy(p);
    }
    // Real agreed C API: insert an input, run LLVM, amend that input in the past.
    History p = temporal_create(); configure(p,1,1,0,0);
    Point start = temporal_point(p); Edit edit = temporal_edit(p); uint64_t x = 29;
    Write write = temporal_store_at(edit,start,p->state+2,&x,8); x = 99;
    require(temporal_repair(edit) == TEMPORAL_OK,"insert failed");
    StepArgs args{0,0,0}; temporal_run(p,native_step,&args,sizeof args);
    require(p->state[0] == oracle(1,1,0,0,{{0,0,29}})[0],"insert capture failed");
    edit = temporal_edit(p); x = 51; temporal_replace(edit,write,&x); x = 0;
    require(temporal_repair(edit) == TEMPORAL_OK,"public past edit failed");
    require(p->state[0] == oracle(1,1,0,0,{{0,0,51}})[0],"public past result failed");
    temporal_destroy(p);
    // Equal outputs cut propagation even though the amended input did change.
    p=temporal_create(); configure(p,4,8,0,0); forward_tracked(p);
    uint64_t equivalent=command(2,0)+65536; NtStats stats;
    nt_edit(p); nt_replace(p,p->inputs[8],&equivalent);
    require(nt_repair(p,kernel_tracked,&stats) && stats.regions==1,"equality cutoff failed");
    verify(p,{{2,0,equivalent}}); ++comparisons;
    uint64_t checksum=hash(p->state,p->h->cells), overwritten=123;
    nt_edit(p); nt_replace(p,2,&overwritten); // initial input is overwritten before its first load.
    require(nt_repair(p,kernel_tracked,&stats) && stats.regions==0 && hash(p->state,p->h->cells)==checksum,
            "overwritten version incorrectly invalidated future");
    temporal_destroy(p);
    std::printf("{\"type\":\"validation\",\"full_history_comparisons\":%u,\"public_api_example\":\"pass\",\"status\":\"pass\"}\n",comparisons);
}

static double median(std::vector<double> v) { std::sort(v.begin(),v.end()); return v[v.size()/2]; }
static void samples(const char *name,const std::vector<double> &v) {
    std::printf(",\"%s\":[",name);
    for(size_t i=0;i<v.size();++i) std::printf("%s%.6f",i ? "," : "",v[i]);
    std::printf("]");
}
static void benchmark(uint32_t n, uint32_t ticks, uint32_t mode, uint32_t work, uint32_t edits, uint32_t trials) {
    std::vector<double> plain_times, snapshot_record_times, undo_times, track_times;
    std::vector<double> repair_times, replay_times, rewind_times;
    NtStats last{}; uint64_t bytes = 0, checksum = 0;
    for (uint32_t trial = 0; trial < trials+1; ++trial) {
        History p = temporal_create(); configure(p,n,ticks,mode,work); bytes = p->arena.bytes;
        auto plain = initial(n), undo = initial(n), snap = initial(n);
        UndoLog log{undo.data(), std::vector<Undo>(size_t(n)*ticks*3)};
        std::vector<uint64_t> snapshots(size_t(n)*4*ticks);
        double a=0,b=0,c=0,d=0;
        // Rotate forward measurement order; allocation is excluded, first touches
        // of arena records remain included. trial zero warms code and is discarded.
        for (uint32_t j=0;j<4;++j) {
            uint32_t which=(j+trial)%4; auto start=Clock::now();
            if(which==0) { forward_plain(plain,n,ticks,mode,work,0,{}); a=elapsed(start); }
            if(which==1) { forward_undo(undo,log,n,ticks,mode,work,0,{}); b=elapsed(start); }
            if(which==2) { forward_tracked(p); c=elapsed(start); }
            if(which==3) { forward_plain(snap,n,ticks,mode,work,0,{},&snapshots); d=elapsed(start); }
        }
        require(plain == undo && plain == snap && std::equal(plain.begin(),plain.end(),p->state),"forward mismatch");
        std::vector<Patch> patches;
        uint32_t at = ticks/4;
        for (uint32_t e=0;e<edits;++e) patches.push_back({at,e,command(at,e)^0x12345});
        auto start = Clock::now();
        Edit batch=temporal_edit(p);
        for(auto patch:patches) { TemporalWriteHandle handle{p,p->inputs[patch.tick*n+patch.entity]};
            temporal_replace(batch,&handle,&patch.value); }
        require(temporal_repair(batch)==TEMPORAL_OK,"repair trapped");
        last=p->stats; double repair=elapsed(start);
        start=Clock::now();
        std::memcpy(snap.data(),snapshots.data()+size_t(at)*snap.size(),snap.size()*8);
        forward_plain(snap,n,ticks,mode,work,at,patches,&snapshots); double replay=elapsed(start);
        start=Clock::now();
        size_t boundary=size_t(at)*n*3;
        while(log.used>boundary) { auto &u=log.log[--log.used]; undo[u.cell]=u.before; }
        forward_undo(undo,log,n,ticks,mode,work,at,patches); double rewind=elapsed(start);
        auto expected=oracle(n,ticks,mode,work,patches);
        require(expected==snap && expected==undo && std::equal(expected.begin(),expected.end(),p->state),"repair mismatch");
        verify(p,patches); checksum=hash(p->state,p->h->cells);
        if(trial) { plain_times.push_back(a); undo_times.push_back(b); track_times.push_back(c);
            snapshot_record_times.push_back(d); repair_times.push_back(repair); replay_times.push_back(replay); rewind_times.push_back(rewind); }
        temporal_destroy(p);
    }
    std::printf("{\"type\":\"benchmark\",\"entities\":%u,\"ticks\":%u,\"mode\":%u,\"work\":%u,\"edits\":%u,\"trials\":%u,"
      "\"plain_ms\":%.6f,\"snapshot_record_ms\":%.6f,\"undo_record_ms\":%.6f,\"tracked_record_ms\":%.6f,"
      "\"repair_ms\":%.6f,\"snapshot_replay_ms\":%.6f,\"rewind_redo_ms\":%.6f,"
      "\"regions_rerun\":%llu,\"edges_visited\":%llu,\"changed_versions\":%llu,\"arena_bytes\":%llu,"
      "\"scratch_reserved_bytes\":%llu,\"snapshot_bytes\":%llu,\"undo_bytes\":%llu,\"checksum\":\"%016llx\"",
      n,ticks,mode,work,edits,trials,median(plain_times),median(snapshot_record_times),median(undo_times),median(track_times),
      median(repair_times),median(replay_times),median(rewind_times),last.regions,last.edges,last.changed_versions,bytes,
      uint64_t(n)*ticks*4+(uint64_t(n)*4+uint64_t(n)*ticks*3+16)*4+uint64_t(n)*16,
      uint64_t(n)*ticks*32,uint64_t(n)*ticks*48,checksum);
    samples("plain_samples_ms",plain_times); samples("snapshot_record_samples_ms",snapshot_record_times);
    samples("undo_samples_ms",undo_times); samples("tracked_samples_ms",track_times);
    samples("repair_samples_ms",repair_times); samples("snapshot_replay_samples_ms",replay_times);
    samples("rewind_redo_samples_ms",rewind_times); std::printf("}\n");
}
static void disk_test(const char *path) {
    History p=temporal_create(); configure(p,1024,64,0,32,path);
    auto start=Clock::now(); forward_tracked(p); double record=elapsed(start);
    start=Clock::now(); p->arena.flush(); double flush=elapsed(start);
    Header saved=*p->h; p->arena.close();
    start=Clock::now(); p->arena.map(path,size_t(saved.bytes),false); p->bind(); double remap=elapsed(start);
    require(p->h->magic==magic && p->h->nv==saved.nv,"reopened header mismatch");
    std::vector<Patch> patches{{16,0,98765}}; NtStats stats;
    start=Clock::now(); nt_edit(p); nt_replace(p,p->inputs[16*1024],&patches[0].value);
    require(nt_repair(p,kernel_tracked,&stats),"remapped repair failed"); double repair=elapsed(start);
    verify(p,patches); // Verification intentionally OUTSIDE the timed repair.
    p->arena.flush();
    std::printf("{\"type\":\"disk\",\"file_bytes\":%llu,\"record_ms\":%.6f,\"flush_ms\":%.6f,"
        "\"remap_ms\":%.6f,\"repair_ms\":%.6f,\"regions_rerun\":%llu,\"cache\":\"OS cache warm; not cold disk\",\"status\":\"pass\"}\n",
        saved.bytes,record,flush,remap,repair,stats.regions);
    temporal_destroy(p);
}
static void reopen_test(const char *path) {
    FILE *f=nullptr; require(fopen_s(&f,path,"rb")==0,"cannot read saved header");
    Header saved{}; bool read=std::fread(&saved,sizeof saved,1,f)==1; std::fclose(f);
    require(read && saved.magic==magic,"invalid saved header");
    Header expected=layout(saved.entities,saved.ticks,saved.mode,saved.work);
    require(saved.bytes==expected.bytes && saved.state_offset==expected.state_offset &&
            saved.shadow_offset==expected.shadow_offset && saved.versions_offset==expected.versions_offset &&
            saved.regions_offset==expected.regions_offset && saved.reads_offset==expected.reads_offset &&
            saved.edges_offset==expected.edges_offset && saved.inputs_offset==expected.inputs_offset &&
            saved.entities==1024 && saved.ticks==64 && saved.mode==0 && saved.work==32,
            "unsupported history file");
    History p=temporal_create();
    p->queue.reserve(saved.region_capacity); p->changed.reserve(saved.version_capacity); p->edits.reserve(saved.entities);
    auto start=Clock::now(); p->arena.map(path,size_t(saved.bytes),false); p->bind(); double mapping=elapsed(start);
    // Repair before a full verification scan can warm the mapped trace.
    uint64_t corrected=87654; NtStats stats;
    start=Clock::now(); nt_edit(p); nt_replace(p,p->inputs[16*1024],&corrected);
    require(nt_repair(p,kernel_tracked,&stats),"reopened repair failed"); double repair=elapsed(start);
    verify(p,{{16,0,corrected}});
    std::printf("{\"type\":\"reopen\",\"new_process\":true,\"map_ms\":%.6f,\"repair_ms\":%.6f,"
      "\"regions_rerun\":%llu,\"status\":\"pass\",\"cache\":\"OS cache uncontrolled\"}\n",mapping,repair,stats.regions);
    temporal_destroy(p);
}
int main(int argc, char **argv) {
    try {
        if(argc==3 && std::strcmp(argv[1],"--disk")==0) { disk_test(argv[2]); return 0; }
        if(argc==3 && std::strcmp(argv[1],"--reopen")==0) { reopen_test(argv[2]); return 0; }
        if(argc==2 && std::strcmp(argv[1],"--test")==0) { tests(); return 0; }
        uint32_t n=1024,ticks=64,trials=9;
        if(argc==4) { n=uint32_t(std::stoul(argv[1])); ticks=uint32_t(std::stoul(argv[2])); trials=uint32_t(std::stoul(argv[3])); }
        require(trials && ticks>=4,"invalid arguments"); tests();
        for(uint32_t work:{0u,32u,256u}) for(uint32_t mode:{0u,1u,2u}) benchmark(n,ticks,mode,work,1,trials);
        benchmark(n,ticks,0,32,n,trials);
        return 0;
    } catch(const std::exception &e) { std::fprintf(stderr,"FAIL: %s\n",e.what()); return 1; }
}
