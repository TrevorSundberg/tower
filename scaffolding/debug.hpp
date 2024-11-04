#pragma once

struct Debug;
struct DebugString;
struct DebugGraph;
struct DebugGraphNode;
struct DebugGraphEdge;

typedef uintptr_t debug_id_t;

enum class Shape : uint8_t {
  box,
  square,
  hexagon,
  octagon,
  ellipse,
  circle,
  diamond,
  triangle,
  plaintext,
};

enum class Style : uint8_t {
  solid,
  dashed,
  dotted,
  invis,
  bold,
};

struct Color {
  r: uint8_t;
  g: uint8_t;
  b: uint8_t;
  a: uint8_t;
};

// Run a suite of tests over debug primitives
void debug_tests();

// Virtual buffer flush for the debug data
// Never assume that any of the data written is complete
typedef void (*DebugFlush)(const uint8_t* data, size_t length);

// Buffer size, flush function to flush to a file or stream...
Debug* debug_create(DebugFlush flush, size_t buffer_size = 4096);
void debug_destroy(Debug* debug);


// The string is allocated with the scope
DebugString* debug_string(Debug* context, const char* utf8);

void debug_begin_scope(Debug* context, DebugString* name = nullptr);
void debug_end_scope(Debug* context);

void debug_print_string(Debug* context, DebugString* string);
void debug_print(Debug* context, const char* utf8);

DebugGraph* debug_graph(Debug* context, debug_id_t graph_id = nullptr);

bool debug_graph_get_instant(Debug* context, DebugGraph* graph);
void debug_graph_set_instant(Debug* context, DebugGraph* graph, bool instant);

DebugGraphNode* debug_graph_node(
  Debug* context,
  DebugGraph* graph,
  DebugNode* node,
  DebugString* label,
  Shape shape = Shape::box,
  Style style = Style::solid,
  Color color = Color{.r = 0, .g = 0, .b = 0, .a = 255});

void debug_graph_edge(
  Debug* context,
  DebugGraph* graph,
  DebugNode* from_node,
  DebugNode* to_node,
  DebugString* label,
  Style style = Style::solid,
  Color color = Color{.r = 0, .g = 0, .b = 0, .a = 255});

