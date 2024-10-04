#include "parser.hpp"
#include <unordered_map>
#include <string>
#include <cassert>

// The tests come first so that we don't see the definition of any structs
void parser_tests() {
  const uint32_t tower_node_initial_count = tower_node_get_allocated_count();
  const uint32_t tower_component_initial_count = tower_component_get_allocated_count();

  {
    assert(parser_rule_get_type() != nullptr);
    assert(parser_reference_get_type() != nullptr);
    assert(parser_string_get_type() != nullptr);
    assert(parser_range_get_type() != nullptr);
  }

  // A = 'a' A [a-z];
  {
    TowerNode* root = tower_node_create();

    TowerNode* rule_node = parser_rule_create_subtree(root, "A", false);
    Rule* rule = (Rule*)tower_node_get_component_data(rule_node, parser_rule_get_type());
    assert(rule != nullptr);
    assert(strcmp(parser_rule_get_name(rule), "A") == 0);
    assert(parser_rule_get_generated(rule) == false);

    parser_string_create_subtree(rule_node, "a");
    parser_reference_create_subtree(rule_node, "A");
    parser_range_create_subtree(rule_node, 'a', 'z');
    
    parser_create(root);

    tower_node_release_ref(root);
  }

  assert(tower_node_get_allocated_count() == tower_node_initial_count);
  assert(tower_component_get_allocated_count() == tower_component_initial_count); 
}

struct Rule {
  static TowerNode* compiletime_type;
  
  std::string name;
  RulePhase phase = RulePhase::Tokenizer;
  bool generated = false;
};
TowerNode* Rule::compiletime_type = tower_node_create();

struct Reference {
  static TowerNode* compiletime_type;
  std::string name;
};
TowerNode* Reference::compiletime_type = tower_node_create();

struct String {
  static TowerNode* compiletime_type;
  std::string string;
};
TowerNode* String::compiletime_type = tower_node_create();

struct Range {
  static TowerNode* compiletime_type;
  // Inclusive start and end of characters
  uint32_t char_start = '\0';
  uint32_t char_end = '\0';
};
TowerNode* Range::compiletime_type = tower_node_create();

template <typename T>
T* create_component(TowerNode* owner) {
  TowerComponent* component =
    tower_component_create(owner, T::compiletime_type, sizeof(T), [](TowerComponent* component, uint8_t* data) {
      ((T*)data)->~T();
    });

  return (T*)tower_component_get_data(component);
}

TowerNode* create_attached_child_without_ref(TowerNode* parent) {
  TowerNode* child = tower_node_create();
  tower_node_attach(child, parent);
  tower_node_release_ref(child);
  return child;
}

TowerNode* parser_rule_get_type() {
  return Rule::compiletime_type;
}

Rule* parser_rule_create(TowerNode* owner) {
  return create_component<Rule>(owner);
}

void parser_rule_set_name(Rule* component, const char* name) {
  assert(name);
  assert(component);
  component->name = name;
}

const char* parser_rule_get_name(Rule* component) {
  assert(component);
  return component->name.c_str();
}

void parser_rule_set_generated(Rule* component, bool generated) {
  assert(component);
  component->generated = generated;
}

bool parser_rule_get_generated(Rule* component) {
  assert(component);
  return component->generated;
}

void parser_rule_set_phase(Rule* component, RulePhase phase) {
  assert(component);
  component->phase = phase;
}

RulePhase parser_rule_get_phase(Rule* component) {
  assert(component);
  return component->phase;
}

TowerNode* parser_rule_create_subtree(TowerNode* parent, const char* name, bool generated) {
  TowerNode* child = create_attached_child_without_ref(parent);
  Rule* component = parser_rule_create(child);
  parser_rule_set_name(component, name);
  parser_rule_set_generated(component, generated);
  return child;
}

TowerNode* parser_reference_get_type() {
  return Reference::compiletime_type;
}

Reference* parser_reference_create(TowerNode* owner) {
  return create_component<Reference>(owner);
}

void parser_reference_set_name(Reference* component, const char* name) {
  assert(name);
  component->name = name;
}

const char* parser_reference_get_name(Reference* component) {
  return component->name.c_str();
}

TowerNode* parser_reference_create_subtree(TowerNode* parent, const char* name) {
  TowerNode* child = create_attached_child_without_ref(parent);
  Reference* component = parser_reference_create(child);
  parser_reference_set_name(component, name);
  return child;
}

TowerNode* parser_string_get_type() {
  return String::compiletime_type;
}

String* parser_string_create(TowerNode* owner) {
  return create_component<String>(owner);
}

void parser_string_set_string(String* component, const char* string) {
  assert(component);
  component->string = string;
}

const char* parser_string_get_string(String* component) {
  assert(component);
  return component->string.c_str();
}

TowerNode* parser_string_create_subtree(TowerNode* parent, const char* string) {
  TowerNode* child = create_attached_child_without_ref(parent);
  String* component = parser_string_create(child);
  parser_string_set_string(component, string);
  return child;
}

TowerNode* parser_range_get_type() {
  return Range::compiletime_type;
}

Range* parser_range_create(TowerNode* owner) {
  return create_component<Range>(owner);
}

void parser_range_set_char_start(Range* component, uint32_t char_start) {
  assert(component);
  component->char_start = char_start;
}

uint32_t parser_range_get_char_start(Range* component) {
  assert(component);
  return component->char_start;
}

void parser_range_set_char_end(Range* component, uint32_t char_end) {
  assert(component);
  component->char_end = char_end;
}

uint32_t parser_range_get_char_end(Range* component) {
  assert(component);
  return component->char_end;
}

TowerNode* parser_range_create_subtree(TowerNode* parent, uint32_t char_start, uint32_t char_end) {
  TowerNode* child = create_attached_child_without_ref(parent);
  Range* component = parser_range_create(child);
  parser_range_set_char_start(component, char_start);
  parser_range_set_char_end(component, char_end);
  return child;
}

struct LRItem {
  uint32_t rule_index = TOWER_INVALID_INDEX;
  uint32_t item_index = TOWER_INVALID_INDEX;
};

Parser* parser_create(TowerNode* root) {
  std::unordered_map<std::string, Rule*> rules;

  // Walk all the rules we have
  for (uint32_t p = 0;; ++p) {
    TowerNode* rule_node = tower_node_get_child(root, p);
    if (!rule_node) {
      break;
    }
    
    Rule* rule = (Rule*)tower_node_get_component_data(rule_node, parser_rule_get_type());
    assert(rule);

    // Map the rule so we can look it up by name if we need to
    rules.emplace(rule->name, rule);

    printf("RULE: %s\n", parser_rule_get_name(rule));

    for (uint32_t g = 0;; ++g) {
      TowerNode* grammar_symbol = tower_node_get_child(rule_node, g);
      if (!grammar_symbol) {
        break;
      }

      Reference* reference = (Reference*)tower_node_get_component_data(grammar_symbol, parser_reference_get_type());
      if (reference) {
        printf("REFERENCE: %s\n", reference->name.c_str());
      }
      String* string = (String*)tower_node_get_component_data(grammar_symbol, parser_string_get_type());
      if (string) {
        printf("STRING: %s\n", string->string.c_str());
      }
      Range* range = (Range*)tower_node_get_component_data(grammar_symbol, parser_range_get_type());
      if (range) {
        printf("RANGE: (%d, %d)\n", range->char_start, range->char_end);
      }

      // Note that it may have none of the components if it's a scope
      // need to recursively go into scoped components
    }

    // need to construct LR(0) items
  }
  return nullptr;
}

void parser_destroy(Parser* parser) {
  //....
}

