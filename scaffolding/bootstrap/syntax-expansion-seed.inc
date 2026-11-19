// Retained original expander for seed/stage1 only; production lives in syntax-expansion.tower.
Node copy_match(TowerNode* source) {
  auto result = owned(tower_node_create());
  auto* from = match(source); auto* to = parser_match_create(result.get());
  parser_match_set_id(to, parser_match_get_id(from));
  parser_match_set_rule_index(to, parser_match_get_rule_index(from));
  parser_match_set_start(to, parser_match_get_start(from));
  parser_match_set_length(to, parser_match_get_length(from));
  parser_match_set_label(to, parser_match_get_label(from));
  if (auto* previous = syntax_get_origin(source)) *origin(result.get()) = *previous;
  return result;
}

struct Expander {
  SyntaxSession& session;
  std::unordered_set<size_t> normal;
  static constexpr size_t max_steps = 4096, max_nodes = 65536, max_trace = 256;

  bool count_node(bool copied) {
    auto& stats = session.expansion_stats;
    if (stats.generated_nodes + stats.copied_nodes >= max_nodes) {
      session.error = "Replacement output limit exceeded (65536 nodes)"; return false;
    }
    if (copied) ++stats.copied_nodes; else ++stats.generated_nodes;
    return true;
  }
  Node copy_tree(TowerNode* source) {
    auto& stats = session.expansion_stats;
    size_t copied = 0;
    auto result = owned(compiler_clone_tree(source, max_nodes - stats.generated_nodes - stats.copied_nodes, &copied));
    stats.copied_nodes += copied;
    if (!result) { session.error = "Replacement output limit exceeded (65536 nodes) or could not allocate its work stack"; return result; }
    // The copied tree is already expanded. This host-only derived set can be
    // retired when the rest of the expander migrates; ownership/copying is Tower.
    std::vector<TowerNode*> pending{result.get()};
    while (!pending.empty()) {
      auto* at = pending.back(); pending.pop_back(); normal.insert(tower_node_get_id(at));
      for (size_t i = 0; i < tower_node_get_child_count(at); ++i) pending.push_back(child(at, i));
    }
    return result;
  }
  Node instantiate(const Replacement& replacement, TowerNode* invocation, TowerNode* captured_from) {
    auto* span = match(invocation);
    auto trace = std::make_shared<SyntaxExpansion>();
    trace->rule = replacement.rule;
    trace->start = parser_match_get_start(span);
    trace->end = trace->start + parser_match_get_length(span);
    trace->definition_start = replacement.start; trace->definition_end = replacement.end;
    if (auto* previous = syntax_get_origin(invocation)) trace->previous = previous->expansion;
    size_t depth = 0;
    for (auto previous = trace->previous; previous; previous = previous->previous)
      if (++depth >= max_trace) { session.error = "Replacement recursion limit exceeded (256 expansions in one chain)"; return owned(nullptr); }
    std::map<std::string, TowerNode*> captures;
    for (const auto& [name, type] : replacement.captures) {
      auto* capture = tower_node_get_child_member(captured_from, name.c_str());
      if (!capture) { session.error = "Missing replacement capture: $" + name; return owned(nullptr); }
      captures[name] = capture;
    }
    auto remaining = replacement.uses;
    auto container = owned(tower_node_create());
    struct Work { TowerNode* source; TowerNode* parent; std::string role; };
    std::vector<Work> pending{{replacement.tree.get(), container.get(), {}}};
    while (!pending.empty()) {
      auto work = std::move(pending.back()); pending.pop_back();
      auto* m = match(work.source);
      std::string label = parser_match_get_label(m);
      if (parser_match_get_id(m) >= FirstHole && label.starts_with("$")) {
        const std::string name = label.substr(1);
        Node value = owned(nullptr);
        if (--remaining.at(name)) value = copy_tree(captures.at(name));
        else { tower_node_add_ref(captures.at(name)); value = owned(captures.at(name)); tower_node_detach(value.get()); }
        if (!value) return owned(nullptr);
        auto attach_capture = [&](TowerNode* capture, const std::string& role) {
          // Captured leaves keep their source spans and own expansion history.
          // Record the splice at its root, sharing the invocation trace.
          if (!syntax_get_origin(capture)) {
            auto* o = origin(capture); o->generated = false; o->expansion = trace;
            o->template_start = parser_match_get_start(m);
            o->template_end = o->template_start + parser_match_get_length(m);
          } else origin(capture)->splices.push_back(trace);
          tower_node_attach_member(capture, work.parent, role.empty() ? nullptr : role.c_str());
        };
        if (semantic(replacement.captures.at(name)).repetition) {
          std::vector<Node> items;
          while (auto* item = tower_node_take_last_child(value.get())) items.push_back(owned(item));
          if (!work.role.empty() && items.size() > 1) { session.error = "List capture requires a repeated destination"; return owned(nullptr); }
          for (auto it = items.rbegin(); it != items.rend(); ++it) attach_capture(it->get(), work.role);
        } else attach_capture(value.get(), work.role);
        continue;
      }
      if (!count_node(false)) return owned(nullptr);
      auto made = copy_match(work.source);
      auto* made_match = match(made.get());
      parser_match_set_start(made_match, trace->start);
      parser_match_set_length(made_match, trace->end - trace->start);
      auto* o = origin(made.get()); o->generated = true; o->expansion = trace;
      o->template_start = parser_match_get_start(m); o->template_end = o->template_start + parser_match_get_length(m);
      tower_node_attach_member(made.get(), work.parent, work.role.empty() ? nullptr : work.role.c_str());
      for (size_t i = tower_node_get_child_count(work.source); i > 0; --i) {
        auto* role = tower_node_get_child_member_name(work.source, i - 1);
        pending.push_back({child(work.source, i - 1), made.get(), role ? role : ""});
      }
    }
    if (tower_node_get_child_count(container.get()) != 1) { session.error = "Replacement must produce one root"; return owned(nullptr); }
    return owned(tower_node_take_last_child(container.get()));
  }
  std::pair<const Replacement*, TowerNode*> applicable(TowerNode* root) {
    std::string category = parser_match_get_label(match(root));
    auto* candidate = root;
    for (;;) {
      auto found = session.version->replacements.find(parser_match_get_rule_index(match(candidate)));
      if (found != session.version->replacements.end() && found->second.category == category)
        return {&found->second, candidate};
      if (tower_node_get_child_count(candidate) != 1) return {nullptr, nullptr};
      auto* next = child(candidate, 0);
      if (parser_match_get_rule_index(match(next)) == TOWER_INVALID_INDEX) return {nullptr, nullptr};
      candidate = next;
    }
  }
  bool run(Node& root) {
    struct Frame { TowerNode* node; size_t next; size_t index; };
    std::vector<Frame> stack{{root.get(), 0, 0}};
    while (!stack.empty()) {
      auto& frame = stack.back();
      if (normal.contains(tower_node_get_id(frame.node))) { stack.pop_back(); continue; }
      if (frame.next < tower_node_get_child_count(frame.node)) {
        size_t i = frame.next++;
        stack.push_back({child(frame.node, i), 0, i}); continue;
      }
      auto [replacement, captures] = applicable(frame.node);
      if (!replacement) {
        auto deferred = session.version->replacements.find(parser_match_get_rule_index(match(frame.node)));
        if (deferred != session.version->replacements.end()) {
          bool destination = false;
          for (size_t i = stack.size() - 1; i > 0; --i) {
            auto* parent = stack[i - 1].node;
            if (tower_node_get_child_count(parent) != 1) break;
            if (deferred->second.category == parser_match_get_label(match(parent))) { destination = true; break; }
          }
          if (!destination) {
            session.error_offset = parser_match_get_start(match(frame.node));
            session.error = "Replacement for " + deferred->second.rule + " requires a " + deferred->second.category + " destination";
            return false;
          }
        }
        normal.insert(tower_node_get_id(frame.node)); stack.pop_back(); continue;
      }
      session.error_offset = parser_match_get_start(match(frame.node));
      if (session.expansion_stats.replacements++ >= max_steps) {
        session.error = "Replacement step limit exceeded (4096)"; return false;
      }
      auto expanded = instantiate(*replacement, frame.node, captures);
      if (!expanded) { session.error += " while replacing " + replacement->rule; return false; }
      auto* next = expanded.get();
      if (stack.size() == 1) root = std::move(expanded);
      else tower_node_replace_child(stack[stack.size() - 2].node, frame.index, expanded.get());
      frame.node = next; frame.next = 0;
    }
    return true;
  }
};
