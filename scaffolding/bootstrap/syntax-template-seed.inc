// Original template construction/remapping for seed/stage1 only.
void hole_production(Version& version, const std::string& category, uint32_t id, bool append = false) {
  auto* rule = production(version, category, true);
  if (append) reference(rule, category);
  auto node = owned(tower_node_create());
  tower_node_attach(node.get(), rule);
  parser_string_set_id(parser_string_create(node.get()), 0, id);
}

bool compile_template(Version& version, const Definitions& defs, const Sequence& seq,
    Replacement& replacement, std::string& error, bool& grammar_error) {
  grammar_error = false;
  replacement.error_offset = replacement.start;
  replacement.uses.clear();
  auto grammar = std::make_shared<Version>();
  grammar->definitions = defs;
  grammar->tokens = version.tokens;
  grammar->bedrock = version.bedrock;
  grammar->used_names = version.used_names;
  grammar->literals = version.literals; grammar->names = version.names;
  if (!seed(*grammar, defs, replacement.category.c_str())) {
    error = "Unable to allocate replacement grammar"; return false;
  }
  TemplateInput input;
  input.base = replacement.start;
  if (!set_source(input.session, semantic(semantic(seq).replacement).text, "replacement")) {
    error = "Unable to allocate replacement source text"; return false;
  }
  input.session.tokens = version.tokens;
  input.session.definitions = defs;
  input.session.bedrock = version.bedrock;
  input.session.version = grammar;
  for (const auto& [name, entity] : replacement.captures) {
    const auto& term = semantic(entity);
    uint32_t id = FirstHole + (uint32_t)input.holes.size();
    input.holes[name] = id; grammar->names[id] = "$" + name;
    if (!term.repetition) {
      hole_production(*grammar, resolve_token(version.tokens, term.text) == PARSER_ID_EOF
        ? term.text : grammar->template_tokens.at(term.text), id);
    } else {
      for (const auto& [helper, target_entity] : grammar->repetitions) {
        const auto& target = semantic(target_entity);
        bool compatible = target.repetition == '*' || target.repetition == term.repetition;
        if (!target.literal && target.text == term.text && compatible) {
          if (target.repetition != '*') hole_production(*grammar, helper, id);
          if (target.repetition != '?') hole_production(*grammar, helper, id, true);
        }
      }
    }
  }
  char* diagnostic = nullptr;
  grammar->table = parser_table_create(grammar->rules.get(), grammar.get(), resolve, token_name, &diagnostic,
    ParserTableMode::WholeInput, describe_rule);
  if (!grammar->table) {
    grammar_error = true;
    error = diagnostic ? diagnostic : "Cannot build replacement parser";
    if (diagnostic) tower_memory_free(diagnostic);
    return false;
  }
  if (!build_lexicon(*grammar)) { error = "Unable to allocate replacement lexical indexes"; return false; }
  std::unique_ptr<Stream, decltype(&parser_stream_destroy)> stream(
    parser_stream_create(sizeof(TemplateInput*), nullptr, template_lex), parser_stream_destroy);
  *(TemplateInput**)parser_stream_get_userdata(stream.get()) = &input;
  std::unique_ptr<Recognizer, decltype(&parser_recognizer_destroy)> recognizer(
    parser_recognizer_create(grammar->table, stream.get()), parser_recognizer_destroy);
  input.session.recognizer = recognizer.get();
  Node root = owned(nullptr);
  bool running = true;
  while (running) root = owned(parser_recognizer_step(recognizer.get(), &running));
  if (!root) {
    replacement.error_offset = replacement.start + input.session.error_offset;
    // Holes are typed subtrees rather than ordinary lexer tokens; report
    // checked expectations here without guessing an insertion around a hole.
    error = syntax_diagnostic(input.session, recognizer.get(), false); return false;
  }
  auto* body = child(root.get(), 0);
  if (!body) { error = "Replacement must produce one syntax tree"; return false; }
  tower_node_add_ref(body); tower_node_detach(body); replacement.tree = owned(body);
  // Template tables have extra productions. Remap user productions back to the
  // active grammar so subsequent expansion uses the correct alternative.
  std::vector<TowerNode*> pending{body};
  while (!pending.empty()) {
    auto* node = pending.back(); pending.pop_back();
    auto* m = match(node);
    if (parser_match_get_id(m) >= FirstHole && parser_match_get_id(m) < FirstHole + input.holes.size()) {
      ++replacement.uses[std::string(parser_match_get_label(m)).substr(1)];
    } else if (parser_match_get_rule_index(m) != TOWER_INVALID_INDEX) {
      auto key = grammar->productions.find(parser_match_get_rule_index(m));
      std::string label = parser_match_get_label(m);
      if (auto source = grammar->capture_sources.find(label); source != grammar->capture_sources.end())
        label = version.capture_names.at(source->second);
      auto helper = version.named_indices.find(label);
      parser_match_set_rule_index(m, key != grammar->productions.end() ? version.indices.at(key->second)
        : helper != version.named_indices.end() ? helper->second : TOWER_INVALID_INDEX);
      parser_match_set_label(m, label.c_str());
      uint32_t id = parser_table_non_terminal_resolve_reference(version.table, label.c_str());
      parser_match_set_id(m, id);
    }
    for (size_t i = 0; i < tower_node_get_child_count(node); ++i) pending.push_back(child(node, i));
  }
  return true;
}
