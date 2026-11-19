// Original lexical session traversal for seed/stage1 only.
std::string skip_meta(SyntaxSession& session, size_t& pos, std::vector<SyntaxHighlight>& highlights) {
  while (pos < session.source.size()) {
    LexiconChoice choice;
    lexicon_skip(session.version->lexicon, session.source.data(), session.source.size(), pos, &choice);
    if (!choice.length) break;
    highlights.push_back({pos, pos + choice.length, session.revision, choice.style, true, choice.id});
    pos += choice.length;
  }
  return {};
}

LexiconChoice choose(const SyntaxSession& session, size_t pos, const ParserLookahead* expected = nullptr) {
  const auto context = expected ? *expected : parser_recognizer_lookahead(session.recognizer);
  LexiconChoice choice;
  lexicon_choose(session.version->lexicon, session.source.data(), session.source.size(), pos,
    session.declaration, context.runtime, context.state, &choice);
  if (!expected) parser_recognizer_account_lookahead(session.recognizer, choice.checks);
  return choice;
}
bool diagnostic_peek(void* context, size_t& pos, const ParserLookahead& expected, uint32_t& id) {
  const auto& session = *static_cast<SyntaxSession*>(context);
  // The same lexer and candidate's parser state determine contextual tokens.
  // Only a local cursor changes; no highlights, declarations or trees are made.
  // Cap skipped tokens as well as parser actions on this error-only path.
  for (size_t count = 0; count < 32; ++count) {
    if (pos == session.source.size()) { id = PARSER_ID_EOF; return true; }
    auto choice = choose(session, pos, &expected);
    if (!choice.length) return false;
    pos += choice.length;
    if (!choice.skipped) { id = choice.id; return true; }
  }
  return false;
}

size_t capture_name_length(const SyntaxSession& session, size_t pos) {
  return lexicon_identifier(session.version->lexicon, session.source.data(), session.source.size(), pos);
}

bool declaration_at(const SyntaxSession& session, size_t pos) {
  return lexicon_declaration(session.version->lexicon, session.source.data(), session.source.size(), pos);
}
std::string skip_source(SyntaxSession& session, size_t& pos, std::vector<SyntaxHighlight>& highlights) {
  if (session.bootstrapping || session.declaration) return skip_meta(session, pos, highlights);
  while (pos < session.source.size() && !declaration_at(session, pos)) {
    auto choice = choose(session, pos);
    if (!choice.length || !choice.skipped) break;
    highlights.push_back({pos, pos + choice.length, session.revision, choice.style, true, choice.id});
    pos += choice.length;
  }
  return {};
}
std::string scan(SyntaxSession& session, size_t& pos, std::vector<SyntaxHighlight>& highlights,
    uint32_t& id, size_t& start, size_t& length) {
  id = PARSER_ID_EOF; length = 0; start = pos;
  std::string error = skip_source(session, pos, highlights);
  if (!error.empty()) { start = highlights.back().start; return error; }
  start = pos;
  if (pos == session.source.size()) return {};
  auto choice = choose(session, pos);
  if (!choice.length) {
    uint32_t value; choice.length = lex_codepoint(session.source, pos, value);
    if (!choice.length) choice.length = 1;
    choice.style = "invalid"; error = "No token rule matches source";
  }
  pos += choice.length; length = choice.length; id = choice.id;
  highlights.push_back({start, pos, session.revision, choice.style, choice.skipped || choice.id == MetaString, choice.id});
  return error;
}

TowerNode* lex(Stream* stream, void* userdata, uint32_t* id, size_t* start, size_t* length) {
  auto& session = **(SyntaxSession**)userdata;
  std::string error = scan(session, session.cursor, session.highlights, *id, *start, *length);
  session.error_offset = *start;
  if (!error.empty()) {
    parser_stream_set_error(stream, error.c_str());
    *id = PARSER_ID_EOF;
    return nullptr;
  }
  if (*id == PARSER_ID_EOF) return nullptr;
  auto* node = tower_node_create();
  auto* m = parser_match_create(node);
  parser_match_set_id(m, *id);
  parser_match_set_start(m, *start);
  parser_match_set_length(m, *length);
  std::string label(session.source.substr(*start, *length));
  parser_match_set_label(m, label.c_str());
  return node;
}

struct TemplateInput {
  SyntaxSession session;
  std::map<std::string, uint32_t> holes;
  size_t base = 0;
};

TowerNode* template_lex(Stream* stream, void* userdata, uint32_t* id, size_t* start, size_t* length) {
  auto& input = **(TemplateInput**)userdata;
  auto& s = input.session;
  skip_source(s, s.cursor, s.highlights);
  *start = s.cursor; *length = 0;
  s.error_offset = *start;
  TowerNode* result = nullptr;
  if (s.cursor < s.source.size() && s.source[s.cursor] == '$') {
    ++s.cursor;
    size_t begin = s.cursor;
    s.cursor += capture_name_length(s, s.cursor);
    std::string name = tower_identifier_value(s.source.substr(begin, s.cursor - begin));
    auto found = input.holes.find(name);
    if (found == input.holes.end()) {
      parser_stream_set_error(stream, ("Unknown replacement capture: $" + name).c_str());
      *id = PARSER_ID_EOF; return nullptr;
    }
    *id = found->second; *length = s.cursor - *start;
    result = tower_node_create();
    auto* m = parser_match_create(result);
    parser_match_set_id(m, *id);
    parser_match_set_label(m, ("$" + name).c_str());
  } else {
    auto* pointer = &s;
    result = lex(stream, &pointer, id, start, length);
  }
  *start += input.base;
  if (result) {
    parser_match_set_start(match(result), *start);
    parser_match_set_length(match(result), *length);
  }
  return result;
}
