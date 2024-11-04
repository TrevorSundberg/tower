#pragma once
#include "tower.hpp"

struct Rule;
struct Reference;
struct String;
struct Range;
struct Match;
struct Stream;
struct Table;
struct Recognizer;

// Run a suite of tests for the parser and tower node configurations
void parser_tests();


// Get the compiletime type of the Rule component
TowerNode* parser_rule_get_type();

// A Rule starts with a name that defines it: A = ...;
// The children under a Rule must be Strings/References and other operators
// Construct a rule component and attach it to the node
Rule* parser_rule_create(TowerNode* owner);

// The name of a rule which references look up by name
// Note that the string memory is copied in and owned by the component
void parser_rule_set_name(Rule* component, const char* name);
const char* parser_rule_get_name(Rule* component);

// If the rule is generated which means it will not produce parse nodes
void parser_rule_set_generated(Rule* component, bool generated);
bool parser_rule_get_generated(Rule* component);

// Creates a child node and attaches it to the parent,
// adds the Rule component to the child, and sets up the component
// Returns the child node, not the component itself (it's most common to create and move on)
// This also releases the reference to the child node since it's attached to the parent
TowerNode* parser_rule_create_subtree(
  TowerNode* parent,
  const char* name,
  bool generated);


// Get the compiletime type of the Reference component
TowerNode* parser_reference_get_type();

// A Reference represents a recursive reference to a rule
// Construct a reference component and attach it to the node
Reference* parser_reference_create(TowerNode* owner);

// Refers to a rule by name
// Note that the string memory is copied in and owned by the component
void parser_reference_set_name(Reference* component, const char* name);
const char* parser_reference_get_name(Reference* component);

// Creates a child node and attaches it to the parent,
// adds the Reference component to the child, and sets up the component
// Returns the child node, not the component itself (it's most common to create and move on)
// This also releases the reference to the child node since it's attached to the parent
TowerNode* parser_reference_create_subtree(TowerNode* parent, const char* name);


// Get the compiletime type of the String component
TowerNode* parser_string_get_type();

// A String represents a sequence of characters (or a single character) to be parsed
// Construct a string component and attach it to the node
String* parser_string_create(TowerNode* owner);

// Sets an id at a specific index of the string
// If the string length is not long enough it will be
// resized and any gaps will be filled with PARSER_ID_EOF
// Canonically this id is used as a character codepoint in tokenizing
void parser_string_set_id(String* component, size_t index, uint32_t id);
uint32_t parser_string_get_id(String* component, size_t index);

// The length of the string of ids
// Setting the length will truncate end elements if it's smaller,
// or if it is larger it will be filled with PARSER_ID_EOF
void parser_string_set_length(String* component, size_t length);
size_t parser_string_get_length(String* component);

// Appends the string of ids from a null-terminated utf8 string (the character codepoint values)
// Each utf8 character will be decoded and stored within a 32 bit integer as an id
void parser_string_append_utf8_null_terminated(String* component, const char* utf8);

// Appends the string of ids from a utf8 string (the character codepoint values)
// Each utf8 character will be decoded and stored within a 32 bit integer as an id
void parser_string_append_utf8(String* component, const char* utf8_begin, const char* utf8_end);

// Creates a child node and attaches it to the parent,
// adds the String component to the child, and sets up the component (utf8 null terminated)
// Returns the child node, not the component itself (it's most common to create and move on)
// This also releases the reference to the child node since it's attached to the parent
TowerNode* parser_string_create_subtree_utf8_null_terminated(TowerNode* parent, const char* utf8);

// Creates a child node and attaches it to the parent,
// adds the String component to the child, and sets up the component
// Returns the child node, not the component itself (it's most common to create and move on)
// This also releases the reference to the child node since it's attached to the parent
TowerNode* parser_string_create_subtree_utf8(TowerNode* parent, const char* utf8_begin, const char* utf8_end);


// Get the compiletime type of the Range component
TowerNode* parser_range_get_type();

// A Range represents a contiguous numerical range canonically of characters and is a more
// optimal representation as opposed to creating many rules with single characters each
// Construct a character-range component and attach it to the node
Range* parser_range_create(TowerNode* owner);

// The start of the character range (inclusive)
void parser_range_set_start(Range* component, uint32_t start_id);
uint32_t parser_range_get_start(Range* component);

// The end of the character range (inclusive)
void parser_range_set_end(Range* component, uint32_t end_id);
uint32_t parser_range_get_end(Range* component);

// Creates a child node and attaches it to the parent,
// adds the Range component to the child, and sets up the component
// Returns the child node, not the component itself (it's most common to create and move on)
// This also releases the reference to the child node since it's attached to the parent
TowerNode* parser_range_create_subtree(TowerNode* parent, uint32_t start_id, uint32_t end_id);


// Get the compiletime type of the Match component
TowerNode* parser_match_get_type();

// A Match component represents a successful parse of a Rule and holds the index value of the rule
// Match components will appear on the root of all nodes produced by a Recognizer (akin to a parse tree)
// Match nodes also contain the start/end indices of the range they parsed
// Construct a parse component and attach it to the node
Match* parser_match_create(TowerNode* owner);

// Used to indicate a generic id or value of what was successfully parsed
// Canonically this is the index of the rule that was parsed
void parser_match_set_id(Match* component, uint32_t id);
uint32_t parser_match_get_id(Match* component);

// The starting index into the stream where the match was successfully parsed
// Canonically this is the byte index of the starting character that created this match
// Note that in the case of layered recognizers (such as a tokenzier and parser)
// the start is often bubbled up from the tokenizer and will refer to character bytes (not nodes)
// It is also common practice that if the Match has children Matches, the
// parents start  and length with encompass it's children, and so on recursively
void parser_match_set_start(Match* component, size_t start_index);
size_t parser_match_get_start(Match* component);

// The length of the match relative to the stream where the match was successfully parsed
// Canonically this is the byte length of the characters that created this match
// It is also common practice that if the Match has children Matches, the
// parents start and length with encompass it's children, and so on recursively
void parser_match_set_length(Match* component, size_t length);
size_t parser_match_get_length(Match* component);

// Creates a child node and attaches it to the parent,
// adds the Match component to the child, and sets up the component
// Returns the child node, not the component itself (it's most common to create and move on)
// This also releases the reference to the child node since it's attached to the parent
TowerNode* parser_match_create_subtree(TowerNode* parent, uint32_t id, size_t start_index, size_t length);


// Virtual destructor for a stream
typedef void (*ParserStreamDestructor)(Stream* stream, uint8_t* userdata);

// Virtual read for a stream
// See the comments on parser_stream_read
typedef TowerNode* (*ParserStreamRead)(
  Stream* stream,
  uint8_t* userdata,
  uint32_t* id,
  size_t* start_index,
  size_t* length
);

// Create a stream that the parser will consume
Stream* parser_stream_create(size_t userdata_bytes, ParserStreamDestructor destructor, ParserStreamRead read);

// Destroy a parser stream
void parser_stream_destroy(Stream* stream);

// Get a pointer to the arbitrary data section of the stream
// The size of the data section matches userdata_bytes passed in parser_stream_create
uint8_t* parser_stream_get_userdata(Stream* stream);

// From a pointer to a component's data section, get the original Stream
Stream* parser_stream_from_userdata(uint8_t* data);

// Returns an optional tower node, and an id from reading the next character or token
// The id of PARSER_ID_EOF means the stream is completed
// This also outputs the start and length of the value read
// Canonically this is the byte index and byte length of the characters range this read covers
// The start and length between consecutive valid reads must never overlap
TowerNode* parser_stream_read(
  Stream* stream,
  uint32_t* id,
  size_t* start_index,
  size_t* length
);

// Create a specialized null-terminated utf8 reading stream (also works for ASCII)
// Canonically this is used for tokenization in tower
// This stream does not return tower nodes, and the ids returned are utf8 decoded codepoints
// Note that the string memory is copied in and owned by the stream
Stream* parser_stream_utf8_null_terminated_create(const char* utf8);

// Create a specialized utf8 reading stream (also works for ASCII)
// Canonically this is used for tokenization in tower
// This stream does not return tower nodes, and the ids returned are utf8 decoded codepoints
// Note that the string memory is copied in and owned by the stream
Stream* parser_stream_utf8_create(const char* utf8_begin, const char* utf8_end);

// Create a specialized node reading stream that reads from the output of another Recognizer
// Canonically this is used for parsing, where the Recognizer provided is the utf8 tokenizer
// Every tower node consumed is expected to have the Match component on the root with the token value
// The stream will only lazily invoke the recognizer when more nodes are needed for parsing
Stream* parser_stream_recognizer_create(Recognizer* recognizer);


// Virtual reference resolution for the table
// Returns the id of the resolved reference (canonically used when a parser refers to a token by rule index)
// A returned value of PARSER_ID_EOF means that we did not resolve the name
typedef uint32_t (*ParserTableResolveReference)(uint8_t* userdata, const char* name);

// Looks up rule id's from a table by name (see ParserTableResolveReference)
// The userdata parameter passed here MUST be a Table*
// This is most commonly used by a parser that wants to resolve the names of token rules
uint32_t parser_table_non_terminal_resolve_reference(uint8_t* userdata, const char* name);

// Virtual stringify for ids for the table
// This is primarily used for debugging and is optional
// The string returned should be utf8 null-terminated and allocated with tower_memory_allocate (freed by caller)
// If there is no associated name with the id, return nullptr
typedef char* (*ParserTableIdToString)(uint8_t* userdata, uint32_t id);

// Stringify utf8 codepoints to look like 'x' (see ParserTableIdToString)
// The userdata parameter passed here is not used and can be any value (including nullptr)
char* parser_table_utf8_id_to_string(uint8_t* userdata, uint32_t id);

// Looks a non-terminal from a table by id/index (see ParserTableIdToString)
// The userdata parameter passed here MUST be a Table*
// This is most commonly used by a parser that wants to resolve the names of token rules
char* parser_table_non_terminal_id_to_string(uint8_t* userdata, uint32_t id);

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
Table* parser_table_create(
  TowerNode* root,
  uint8_t* userdata,
  ParserTableResolveReference resolve,
  ParserTableIdToString to_string
);

// Destructs the parser table and frees it's memory
void parser_table_destroy(Table* table);


// The table and the stream must be kept alive for the duration of the Recognizer
Recognizer* parser_recognizer_create(Table* table, Stream* stream);

// Destructs the parser and frees it's memory
void parser_recognizer_destroy(Recognizer* recognizer);

// Take a single iterative step on the recognizer, which is defined by some 
// change occuring such as an attachment to the parse tree or a callback.
// When the recognizer is complete, the running bool will be set to false.
// If the root node was completely parsed, it will return the node encompassing the root
// Otherwise it will return null, however 'running' may be true indicating there is more
// The root node returned will always have a Match component, indicating which Rule was accepted
// When the parser successfully completes a Rule, the rule may have an associated callback that will
// be called with the given parse nodes, and may return it's own parse tree with it's own components
// The recognizer maintains a parse tree and builds it as the grammar rules are recognized
TowerNode* parser_recognizer_step(Recognizer* recognizer, bool* running);


