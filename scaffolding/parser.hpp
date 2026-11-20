#pragma once
#include "tower.hpp"
#include <string>
#include <vector>

struct Rule;
struct Reference;
struct String;
struct Range;
struct Match;
struct Stream;
struct Table;
struct Recognizer;

extern "C" size_t parser_decode_utf8_codepoint(const char*, const char*, uint32_t*);
extern "C" size_t parser_encode_utf8_codepoint(uint32_t, char*, size_t);

inline constexpr uint32_t PARSER_ID_EOF = (uint32_t)-2;
struct LRCompletion;
extern "C" void parser_recognizer_capture_completion(struct Recognizer*);
extern "C" LRCompletion* parser_recognizer_take_completion(struct Recognizer*);
LRCompletion* parser_table_completion(struct Table*);

// Enable verbose table-building and recognizer traces (off by default).
void parser_set_debug_trace(bool enabled);

// Run a suite of tests for the parser and tower node configurations
void parser_tests();


// Get the compiletime type of the Rule component
extern "C" TowerNode* parser_rule_get_type();

// A Rule starts with a name that defines it: A = ...;
// The children under a Rule must be Strings/References and other operators
// Construct a rule component and attach it to the node
extern "C" Rule* parser_rule_create(TowerNode* owner);

// The name of a rule which references look up by name
// Note that the string memory is copied in and owned by the component
extern "C" void parser_rule_set_name(Rule* component, const char* name);
extern "C" const char* parser_rule_get_name(Rule* component);

// Generated helper rules flatten their children into the containing rule.
// The start rule always keeps a root node, even if marked generated.
extern "C" void parser_rule_set_generated(Rule* component, bool generated);
extern "C" bool parser_rule_get_generated(Rule* component);

// Creates a child node and attaches it to the parent,
// adds the Rule component to the child, and sets up the component
// Returns the child node, not the component itself (it's most common to create and move on)
// This also releases the reference to the child node since it's attached to the parent
extern "C" TowerNode* parser_rule_create_subtree(
  TowerNode* parent,
  const char* name,
  bool generated);


// Get the compiletime type of the Reference component
extern "C" TowerNode* parser_reference_get_type();

// A Reference represents a recursive reference to a rule
// Construct a reference component and attach it to the node
extern "C" Reference* parser_reference_create(TowerNode* owner);

// Refers to a rule by name
// Note that the string memory is copied in and owned by the component
extern "C" void parser_reference_set_name(Reference* component, const char* name);
extern "C" const char* parser_reference_get_name(Reference* component);

// Name the reduced child in its parent's generic member map (empty means unnamed).
extern "C" void parser_reference_set_capture(Reference* component, const char* name);
extern "C" const char* parser_reference_get_capture(Reference* component);

// Creates a child node and attaches it to the parent,
// adds the Reference component to the child, and sets up the component
// Returns the child node, not the component itself (it's most common to create and move on)
// This also releases the reference to the child node since it's attached to the parent
extern "C" TowerNode* parser_reference_create_subtree(TowerNode* parent, const char* name);


// Get the compiletime type of the String component
extern "C" TowerNode* parser_string_get_type();

// A String represents a sequence of characters (or a single character) to be parsed
// Construct a string component and attach it to the node
extern "C" String* parser_string_create(TowerNode* owner);

// Sets an id at a specific index of the string
// If the string length is not long enough it will be
// resized and any gaps will be filled with PARSER_ID_EOF
// Canonically this id is used as a character codepoint in tokenizing
extern "C" void parser_string_set_id(String* component, size_t index, uint32_t id);
extern "C" uint32_t parser_string_get_id(String* component, size_t index);

// The length of the string of ids
// Setting the length will truncate end elements if it's smaller,
// or if it is larger it will be filled with PARSER_ID_EOF
extern "C" void parser_string_set_length(String* component, size_t length);
extern "C" size_t parser_string_get_length(String* component);
// Borrowed storage, invalidated by mutation.
extern "C" const uint32_t* parser_string_get_data(String* component);

// Appends the string of ids from a null-terminated utf8 string (the character codepoint values)
// Each utf8 character will be decoded and stored within a 32 bit integer as an id
extern "C" void parser_string_append_utf8_null_terminated(String* component, const char* utf8);

// Appends the string of ids from a utf8 string (the character codepoint values)
// Each utf8 character will be decoded and stored within a 32 bit integer as an id
extern "C" void parser_string_append_utf8(String* component, const char* utf8_begin, const char* utf8_end);

// Creates a child node and attaches it to the parent,
// adds the String component to the child, and sets up the component (utf8 null terminated)
// Returns the child node, not the component itself (it's most common to create and move on)
// This also releases the reference to the child node since it's attached to the parent
extern "C" TowerNode* parser_string_create_subtree_utf8_null_terminated(TowerNode* parent, const char* utf8);

// Creates a child node and attaches it to the parent,
// adds the String component to the child, and sets up the component
// Returns the child node, not the component itself (it's most common to create and move on)
// This also releases the reference to the child node since it's attached to the parent
extern "C" TowerNode* parser_string_create_subtree_utf8(TowerNode* parent, const char* utf8_begin, const char* utf8_end);


// Get the compiletime type of the Range component
extern "C" TowerNode* parser_range_get_type();

// A Range represents a contiguous numerical range canonically of characters and is a more
// optimal representation as opposed to creating many rules with single characters each
// Construct a character-range component and attach it to the node
extern "C" Range* parser_range_create(TowerNode* owner);

// The start of the character range (inclusive)
extern "C" void parser_range_set_start(Range* component, uint32_t start_id);
extern "C" uint32_t parser_range_get_start(Range* component);

// The end of the character range (inclusive)
extern "C" void parser_range_set_end(Range* component, uint32_t end_id);
extern "C" uint32_t parser_range_get_end(Range* component);

// Creates a child node and attaches it to the parent,
// adds the Range component to the child, and sets up the component
// Returns the child node, not the component itself (it's most common to create and move on)
// This also releases the reference to the child node since it's attached to the parent
extern "C" TowerNode* parser_range_create_subtree(TowerNode* parent, uint32_t start_id, uint32_t end_id);


// Get the compiletime type of the Match component
extern "C" TowerNode* parser_match_get_type();

// A Match describes a consumed terminal or a reduced non-terminal.
// Match components will appear on the root of all nodes produced by a Recognizer (akin to a parse tree)
// Match nodes also contain the start/end indices of the range they parsed
// Construct a parse component and attach it to the node
extern "C" Match* parser_match_create(TowerNode* owner);

// Used to indicate a generic id or value of what was successfully parsed
// For reductions this is the table's non-terminal id, compatible with reference
// resolution. Use get_rule_index to distinguish productions with the same name.
extern "C" void parser_match_set_id(Match* component, uint32_t id);
extern "C" uint32_t parser_match_get_id(Match* component);

// The starting index into the stream where the match was successfully parsed
// Canonically this is the byte index of the starting character that created this match
// Note that in the case of layered recognizers (such as a tokenzier and parser)
// the start is often bubbled up from the tokenizer and will refer to character bytes (not nodes)
// It is also common practice that if the Match has children Matches, the
// parents start  and length with encompass it's children, and so on recursively
extern "C" void parser_match_set_start(Match* component, size_t start_index);
extern "C" size_t parser_match_get_start(Match* component);

// The length of the match relative to the stream where the match was successfully parsed
// Canonically this is the byte length of the characters that created this match
// It is also common practice that if the Match has children Matches, the
// parents start and length with encompass it's children, and so on recursively
extern "C" void parser_match_set_length(Match* component, size_t length);
extern "C" size_t parser_match_get_length(Match* component);

// A reduction's id is its non-terminal id; its production index distinguishes
// alternatives of that non-terminal. Terminals have TOWER_INVALID_INDEX here.
extern "C" size_t parser_match_get_rule_index(Match* component);
// Used when copying/remapping a parsed template into another grammar table.
extern "C" void parser_match_set_rule_index(Match* component, size_t index);

// A copied debug label, independent of the lifetime of the parser table.
extern "C" const char* parser_match_get_label(Match* component);
extern "C" void parser_match_set_label(Match* component, const char* label);

// Format/print the tree with labels, production indices and byte spans.
// Free the returned string with tower_memory_free. Neither function takes ownership.
extern "C" char* parser_tree_debug_string(TowerNode* root);
void parser_tree_debug_print(TowerNode* root);

// Creates a child node and attaches it to the parent,
// adds the Match component to the child, and sets up the component
// Returns the child node, not the component itself (it's most common to create and move on)
// This also releases the reference to the child node since it's attached to the parent
extern "C" TowerNode* parser_match_create_subtree(TowerNode* parent, uint32_t id, size_t start_index, size_t length);


// Virtual destructor for a stream
typedef void (*ParserStreamDestructor)(Stream* stream, void* userdata);

// Virtual read for a stream
// See the comments on parser_stream_read
typedef TowerNode* (*ParserStreamRead)(
  Stream* stream,
  void* userdata,
  uint32_t* id,
  size_t* start_index,
  size_t* length
);

// Create a stream that the parser will consume
extern "C" Stream* parser_stream_create(size_t userdata_bytes, ParserStreamDestructor destructor, ParserStreamRead read);

// Destroy a parser stream
extern "C" void parser_stream_destroy(Stream* stream);

// Get a pointer to the arbitrary data section of the stream
// The size of the data section matches userdata_bytes passed in parser_stream_create
extern "C" void* parser_stream_get_userdata(Stream* stream);

// From a pointer to a component's data section, get the original Stream
extern "C" Stream* parser_stream_from_userdata(void* data);

// Returns an optional tower node, and an id from reading the next character or token
// The id of PARSER_ID_EOF means the stream is completed
// This also outputs the start and length of the value read
// Canonically this is the byte index and byte length of the characters range this read covers
// The start and length between consecutive valid reads must never overlap
// A non-null returned node transfers one owned reference to the caller and must
// be unattached. Its payload/children are preserved by the consuming recognizer.
extern "C" TowerNode* parser_stream_read(
  Stream* stream,
  uint32_t* id,
  size_t* start_index,
  size_t* length
);

// Create a specialized null-terminated utf8 reading stream (also works for ASCII)
// Canonically this is used for tokenization in tower
// This stream does not return tower nodes, and the ids returned are utf8 decoded codepoints
// Note that the string memory is copied in and owned by the stream
extern "C" Stream* parser_stream_utf8_null_terminated_create(const char* utf8);

// Create a specialized utf8 reading stream (also works for ASCII)
// Canonically this is used for tokenization in tower
// This stream does not return tower nodes, and the ids returned are utf8 decoded codepoints
// Note that the string memory is copied in and owned by the stream
extern "C" Stream* parser_stream_utf8_create(const char* utf8_begin, const char* utf8_end);

// Create a specialized node reading stream that reads from the output of another Recognizer
// Lazily exposes the recognizer's one completed root as a token, then EOF.
// This is not a repeated/maximal-munch tokenizer. The recognizer must remain alive
// until this stream is destroyed. Recognition failure propagates to a consuming recognizer.
extern "C" Stream* parser_stream_recognizer_create(Recognizer* recognizer);

// Empty unless this stream has reported an error (currently used by recognizer streams).
extern "C" const char* parser_stream_get_error(Stream* stream);
extern "C" void parser_stream_set_error(Stream* stream, const char* error);


// Virtual reference resolution for the table
// Returns the id of the resolved reference (canonically used when a parser refers to a token by rule index)
// A returned value of PARSER_ID_EOF means that we did not resolve the name
typedef uint32_t (*ParserTableResolveReference)(void* userdata, const char* name);

// Looks up rule id's from a table by name (see ParserTableResolveReference)
// The userdata parameter passed here MUST be a Table*
// This is most commonly used by a parser that wants to resolve the names of token rules
extern "C" uint32_t parser_table_non_terminal_resolve_reference(void* userdata, const char* name);

// Virtual stringify for ids for the table
// This is primarily used for debugging and is optional
// The string returned should be utf8 null-terminated and allocated with tower_memory_allocate (freed by caller)
// If there is no associated name with the id, return nullptr
typedef char* (*ParserTableIdToString)(void* userdata, uint32_t id);

// Stringify utf8 codepoints to look like 'x' (see ParserTableIdToString)
// The userdata parameter passed here is not used and can be any value (including nullptr)
extern "C" char* parser_table_utf8_id_to_string(void* userdata, uint32_t id);

// Looks a non-terminal from a table by id/index (see ParserTableIdToString)
// The userdata parameter passed here MUST be a Table*
// This is most commonly used by a parser that wants to resolve the names of token rules
extern "C" char* parser_table_non_terminal_id_to_string(void* userdata, uint32_t id);

// Create a parser for the given BNF parse rules specified by a component tree
// Note that the parser does not hold on to the tree, and changes no reference counts
// The resolve callback is optional (null), and is used to resolve named references when they don't
// refer to another rule (canonically when a parser refers to token's by rule index)
// The table only uses the resolve callback while building the table and will not be called again
// However the userdata and to_string will be stored with the table for error reporting and debug
// The tree should take the following format:
/*
type ParseRules = {
  // No components expected on the root
  [
    // The immediate children of the root should have a Rule
    {
      Rule,
      [
        // All the possible children of a rule have these components
        ({Reference} | {String} | {Range} | ParseRules)...
      ]
    }...
  ]
}
*/
enum class ParserTableMode { WholeInput, Constructs };
using ParserDescribeRule = std::string (*)(void* userdata, size_t production);

Table* parser_table_create(
  TowerNode* root,
  void* userdata,
  ParserTableResolveReference resolve,
  ParserTableIdToString to_string,
  char** error = nullptr,
  ParserTableMode mode = ParserTableMode::WholeInput,
  ParserDescribeRule describe_rule = nullptr,
  bool specialize = true
);

// Derived execution choice only. parser_table_create(..., specialize=false)
// forces the ordinary LR reference path; currently only fixed terminal roots specialize.
extern "C" bool parser_table_uses_dfa(const Table* table);

// Creation returns null for unresolved rules or conflicting actions. If error is
// supplied it receives an allocated diagnostic (free with tower_memory_free).

// Destructs the parser table and frees it's memory
extern "C" void parser_table_destroy(Table* table);


// The table and the stream must be kept alive for the duration of the Recognizer
Recognizer* parser_recognizer_create(Table* table, Stream* stream);

// Read one nonempty construct, using real lookahead to prefer a continuation.
// Requires a Constructs table, whose start-rule FOLLOW includes the next
// construct's FIRST set so ambiguous boundaries are rejected during construction.
// An unconsumed lookahead is returned to the stream (including ownership/errors).
// If tokenization changes, discard that stream and resume at the root's end byte.
Recognizer* parser_recognizer_create_prefix(Table* table, Stream* stream);

// Work counters for checking scaling independently of wall-clock noise.
struct ParserWork {
  size_t reads = 0, actions = 0, shifts = 0, reductions = 0, popped = 0, forest_visits = 0;
};
ParserWork parser_recognizer_get_work(const Recognizer* recognizer);
// Current LR ACTION lookup; no speculative reductions or backtracking.
extern "C" bool parser_recognizer_accepts(Recognizer* recognizer, uint32_t id);

// Destructs the parser and frees it's memory
extern "C" void parser_recognizer_destroy(Recognizer* recognizer);

// Perform one shift/reduction. running is an output, false on acceptance or error.
// On acceptance, transfers one owned reference to the root; caller must release it.
// Intermediate steps return null. Stepping after completion returns null/running=false.
// Destroying an unfinished recognizer releases all partial nodes and lookahead.
// The accepted root survives recognizer/table/stream destruction. Reduction callbacks
// and repeated tokenization are not implemented by this interface yet.
extern "C" TowerNode* parser_recognizer_step(Recognizer* recognizer, bool* running);

// Empty on success/in-progress; otherwise a diagnostic owned by the recognizer.
extern "C" const char* parser_recognizer_get_error(Recognizer* recognizer);

// Error-only lookahead correction. Probes copy numeric state frames, never trees or
// streams, and have fixed work limits. Unknown/budget-exhausted probes are omitted.
struct ParserRulePosition { size_t production, term; };
struct ParserExpectation {
  uint32_t id;
  std::string label;
  bool insertion = false;
  bool completes = false;
  std::vector<ParserRulePosition> contexts;
};
struct ParserDiagnostic {
  size_t offset = 0, insertion_offset = 0;
  bool complete = true;
  bool at_start = false;
  std::vector<ParserExpectation> expected;
};
struct LRRuntime;
// Borrowed immutable table and a valid current state, shared with Tower's lexer.
struct ParserLookahead { LRRuntime* runtime = nullptr; size_t state = TOWER_INVALID_INDEX; };
ParserLookahead parser_recognizer_lookahead(Recognizer* recognizer);
extern "C" void parser_recognizer_account_lookahead(Recognizer* recognizer, size_t checks);
using ParserDiagnosticRead = bool (*)(void*, size_t&, const ParserLookahead&, uint32_t&);
ParserDiagnostic parser_recognizer_diagnostic(Recognizer* recognizer,
  ParserDiagnosticRead read = nullptr, void* source = nullptr);


