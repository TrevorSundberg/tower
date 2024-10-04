#pragma once
#include "tower.hpp"

struct Rule;
struct Reference;
struct String;
struct Range;
struct Parser;

enum class RulePhase : uint32_t {
  Tokenizer = 0,
  Parser = 1,
};

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

// Whether this rule is for the tokenizer or the the parser
void parser_rule_set_phase(Rule* component, RulePhase phase);
RulePhase parser_rule_get_phase(Rule* component);

// Creates a child node and attaches it to the parent, adds the
// Rule component to the child, and sets up the component
// Returns the child node, not the component itself (it's most common to create and move on)
// This also releases the reference to the child node since it's attached to the parent
TowerNode* parser_rule_create_subtree(TowerNode* parent, const char* name, bool generated);


// Get the compiletime type of the Reference component
TowerNode* parser_reference_get_type();

// A Reference represents a recursive reference to a rule
// Construct a reference component and attach it to the node
Reference* parser_reference_create(TowerNode* owner);

// Refers to a rule by name
// Note that the string memory is copied in and owned by the component
void parser_reference_set_name(Reference* component, const char* name);
const char* parser_reference_get_name(Reference* component);

// Creates a child node and attaches it to the parent, adds the
// Parser component to the child, and sets up the component
// Returns the child node, not the component itself (it's most common to create and move on)
// This also releases the reference to the child node since it's attached to the parent
TowerNode* parser_reference_create_subtree(TowerNode* parent, const char* name);


// Get the compiletime type of the String component
TowerNode* parser_string_get_type();

// A String represents a sequence of characters (or a single character) to be parsed
// Construct a string component and attach it to the node
String* parser_string_create(TowerNode* owner);

// A string is a string of characters that appear in sequence
// Note that the string memory is copied in and owned by the component
void parser_string_set_string(String* component, const char* string);
const char* parser_string_get_string(String* component);

// Creates a child node and attaches it to the parent, adds the
// String component to the child, and sets up the component
// Returns the child node, not the component itself (it's most common to create and move on)
// This also releases the reference to the child node since it's attached to the parent
TowerNode* parser_string_create_subtree(TowerNode* parent, const char* name);


// Get the compiletime type of the Range component
TowerNode* parser_range_get_type();

// A Range represents a contiguous numerical range of characters and is a more
// optimal representation as opposed to creating many rules with single characters each
// Construct a character-range component and attach it to the node
Range* parser_range_create(TowerNode* owner);

// The start of the character range (inclusive)
void parser_range_set_char_start(Range* component, uint32_t char_start);
uint32_t parser_range_get_char_start(Range* component);

// The end of the character range (inclusive)
void parser_range_set_char_end(Range* component, uint32_t char_end);
uint32_t parser_range_get_char_end(Range* component);

// Creates a child node and attaches it to the parent, adds the
// Range component to the child, and sets up the component
// Returns the child node, not the component itself (it's most common to create and move on)
// This also releases the reference to the child node since it's attached to the parent
TowerNode* parser_range_create_subtree(TowerNode* parent, uint32_t char_start, uint32_t char_end);


// Create a parser for the given BNF parse rules specified by a component tree
// Note that the parser does not hold on to the tree, and changes no reference counts
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
Parser* parser_create(TowerNode* root);

// Destructs the parser and frees it's memory
void parser_destroy(Parser* parser);


