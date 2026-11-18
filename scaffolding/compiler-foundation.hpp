#pragma once
#include <cstddef>
struct CoreNode;
extern "C" {
size_t foundation_node_size();
size_t foundation_node_offset(size_t);
void foundation_node_init(CoreNode*);
void foundation_node_dispose(CoreNode*);
}
