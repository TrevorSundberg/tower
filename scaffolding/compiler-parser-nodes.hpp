#pragma once
// Opaque ABI to Tower-owned parser components; no duplicated native layout.
#include "parser.hpp"
extern "C" {
size_t node_payload_size(uint32_t kind);
void node_payload_init(uint32_t kind, void* data);
void node_payload_dispose(uint32_t kind, void* data);
size_t node_string_length(String* value);
const uint32_t* node_string_data(String* value);
bool node_string_resize(String* value, size_t length);
bool node_string_set(String* value, size_t index, uint32_t id);
bool node_string_append(String* value, const char* source, size_t length);
const char* node_rule_name(Rule* value);
bool node_rule_set_name(Rule* value, const char* data);
bool node_rule_generated(Rule* value);
void node_rule_set_generated(Rule* value, bool data);
const char* node_reference_name(Reference* value);
bool node_reference_set_name(Reference* value, const char* data);
const char* node_reference_capture(Reference* value);
bool node_reference_set_capture(Reference* value, const char* data);
uint32_t node_range_start(Range* value);
void node_range_set_start(Range* value, uint32_t data);
uint32_t node_range_end(Range* value);
void node_range_set_end(Range* value, uint32_t data);
uint32_t node_match_id(Match* value);
void node_match_set_id(Match* value, uint32_t data);
size_t node_match_start(Match* value);
void node_match_set_start(Match* value, size_t data);
size_t node_match_length(Match* value);
void node_match_set_length(Match* value, size_t data);
size_t node_match_rule(Match* value);
void node_match_set_rule(Match* value, size_t data);
const char* node_match_label(Match* value);
bool node_match_set_label(Match* value, const char* data);
}
