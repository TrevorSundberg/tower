// Original preparation policy retained for seed/stage1 only.
std::string replacement_excerpt(std::string_view source) {
  size_t first = 0, last = source.size();
  while (first < last && space(source[first])) ++first;
  while (last > first && space(source[last - 1])) --last;
  if (first == last) return "<empty>";
  // Keep diagnostics bounded without splitting a UTF-8 character. Preserve
  // whitespace inside strings/comments rather than pretending to reformat code.
  size_t end = std::min(last, first + 160);
  while (end < last && (static_cast<unsigned char>(source[end]) & 0xc0) == 0x80) --end;
  std::string result = "\"";
  for (size_t i = first; i < end; ++i) {
    switch (source[i]) {
      case '\n': result += "\\n"; break;
      case '\r': result += "\\r"; break;
      case '\t': result += "\\t"; break;
      case '\\': result += "\\\\"; break;
      case '"': result += "\\\""; break;
      default: result += source[i]; break;
    }
  }
  if (end < last) result += "...";
  return result + "\"";
}

bool prepare_replacements(Version& version, const Definitions& defs, std::string& message) {
  // Unattached helper rules cannot yet determine their destination. Validate
  // their templates atomically when a Statement path makes them usable.
  std::set<std::string> reachable;
  std::vector<std::string> pending;
  if (defs.contains("Statement")) pending.push_back("Statement");
  while (!pending.empty()) {
    auto name = pending.back(); pending.pop_back();
    if (!reachable.insert(name).second) continue;
    auto found = defs.find(name);
    if (found != defs.end()) for (const auto& seq : found->second)
      for (auto* entity : semantic(seq).items) {
        const auto& term = syntax_node(entity);
        if (!term.literal) pending.push_back(term.text);
      }
  }
  std::map<std::string, std::set<std::string>> parents;
  for (const auto& [name, alternatives] : defs) if (reachable.contains(name))
    for (const auto& seq : alternatives) if (semantic(seq).items.size() == 1) {
      const auto& term = syntax_node(semantic(seq).items[0]);
      if (!term.literal && !term.repetition) parents[term.text].insert(name);
    }
  for (const auto& [name, alternatives] : defs) {
    for (size_t i = 0; i < alternatives.size(); ++i) {
      const auto& seq = alternatives[i];
      if (!semantic(seq).replacement || !reachable.contains(name)) continue;
      const auto& body = semantic(semantic(seq).replacement);
      Replacement replacement;
      replacement.rule = name; replacement.start = body.start;
      replacement.end = body.end;
      for (auto* entity : semantic(seq).items) {
        const auto& term = syntax_node(entity);
        if (!term.capture.empty()) replacement.captures[term.capture] = TowerNodeRef(entity);
      }
      // Prefer the declared rule. A named helper can acquire a destination from
      // its nearest unit-rule parent. This happens only when compiling grammar;
      // source recognition remains deterministic LR with no backtracking.
      std::set<std::string> ancestors;
      pending = {name};
      bool ready = false;
      bool grammar_failed = false;
      std::vector<std::string> destinations;
      std::string original_error;
      size_t original_offset = replacement.start;
      while (!pending.empty()) {
        auto level = std::move(pending); pending.clear();
        Node selected = owned(nullptr);
        std::string selected_category;
        std::map<std::string, size_t> selected_uses;
        for (const auto& category : level) {
          if (!ancestors.insert(category).second) continue;
          destinations.push_back(category);
          replacement.category = category;
          std::string error;
          bool grammar_error = false;
          if (compile_template(version, defs, seq, replacement, error, grammar_error)) {
            if (selected) {
              message = "Ambiguous replacement destination for " + name + "; attach the handler to its destination rule";
              version.replacement_error_offset = replacement.start; return false;
            }
            selected = std::move(replacement.tree); selected_category = category; selected_uses = replacement.uses;
          } else if (original_error.empty()) { original_error = error; original_offset = replacement.error_offset; }
          grammar_failed |= grammar_error;
          for (const auto& parent : parents[category]) pending.push_back(parent);
        }
        if (selected) {
          replacement.tree = std::move(selected); replacement.category = selected_category; replacement.uses = std::move(selected_uses);
          ready = true; break;
        }
      }
      if (!ready) {
        message = "Replacement for " + name + " must produce ";
        if (destinations.size() == 1) message += "a valid " + destinations.front();
        else {
          message += "one of these syntax categories: ";
          for (size_t j = 0; j < destinations.size(); ++j) {
            if (j) message += ", ";
            message += destinations[j];
          }
        }
        message += ". ";
        const auto excerpt = replacement_excerpt(body.text);
        if (grammar_failed) message += "Could not validate " + excerpt + ".";
        else if (destinations.size() == 1) message += excerpt + " is not a valid " + destinations.front() + ".";
        else message += excerpt + " is not valid in any of these categories.";
        message += "\n" + original_error;
        version.replacement_error_offset = original_offset;
        return false;
      }
      version.replacements.emplace(version.indices.at({name, i}), std::move(replacement));
    }
  }
  return true;
}
