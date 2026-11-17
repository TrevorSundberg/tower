#include "syntax.hpp"
#include "lex-pattern.hpp"
#include <cassert>
#include <cstdio>
#include <cstring>
#include <memory>
#include <string>
#include <vector>

namespace {
using Session = std::unique_ptr<SyntaxSession, decltype(&syntax_destroy)>;
using Node = std::unique_ptr<TowerNode, decltype(&tower_node_release_ref)>;
TowerNode* child(TowerNode* parent, size_t index) { return tower_node_get_child(parent, index); }
struct Allocations {
  size_t nodes = tower_node_get_allocated_count();
  size_t components = tower_component_get_allocated_count();
  size_t memory = tower_memory_get_allocated_count();
  ~Allocations() {
    assert(nodes == tower_node_get_allocated_count());
    assert(components == tower_component_get_allocated_count());
    assert(memory == tower_memory_get_allocated_count());
  }
};
Node next(SyntaxSession* session) {
  Node node(syntax_next(session), tower_node_release_ref);
  if (!node) fprintf(stderr, "Unexpected syntax failure: %s\n", syntax_get_error(session));
  assert(node);
  assert(!*syntax_get_error(session));
  return node;
}
TowerNode* find(TowerNode* root, const char* label) {
  std::vector<TowerNode*> nodes{root};
  while (!nodes.empty()) {
    auto* node = nodes.back(); nodes.pop_back();
    auto* m = (Match*)tower_node_get_component_userdata(node, parser_match_get_type());
    if (m && strcmp(parser_match_get_label(m), label) == 0) return node;
    for (size_t i = 0; i < tower_node_get_child_count(node); ++i) nodes.push_back(tower_node_get_child(node, i));
  }
  return nullptr;
}
std::string source_text(TowerNode* node, const std::string& source) {
  assert(node);
  auto* m = (Match*)tower_node_get_component_userdata(node, parser_match_get_type());
  return source.substr(parser_match_get_start(m), parser_match_get_length(m));
}
const std::string base =
  "parse Variable = Identifier;"
  "parse Expression = Identifier | Number;"
  "parse Statement = Expression ';';";
const std::string feature =
  "parse ForEach = 'for' '(' $Variable 'in' $Expression ')' '{' $Statement* '}';"
  "parse Statement |= ForEach;";
}

void syntax_tests() {
  // Public bedrock definitions are inherited and reusable. Source names may use
  // the old prefix or even the spelling of a generated helper without collision.
  {
    Allocations allocations;
    const char* source = "parse __number = Number;"
      "parse `document(0)` = __number;"
      "parse Statement = 'assignment' GrammarAssignment ';' | `document(0)` ';';"
      "assignment =;assignment |=;42;";
    Session session(syntax_create(source), syntax_destroy);
    for (int i = 0; i < 6; ++i) next(session.get());
    assert(!syntax_next(session.get()) && !*syntax_get_error(session.get()));
    const auto tokens = syntax_get_tokens(session.get());
    size_t whitespace = 0;
    for (const auto& token : tokens) if (token.name == "Whitespace") ++whitespace;
    assert(whitespace == 1);
  }
  // Native seed, parsed declarations and formatted text share the same semantic
  // entities/components. Retaining a document also retains its parse provenance.
  {
    Allocations allocations;
    const auto source = tower_format(syntax_native_bedrock()).source;
    Session session(syntax_create_bedrock(source.c_str()), syntax_destroy);
    while (auto* root = syntax_next(session.get())) {
      auto* declaration = child(root, 0);
      assert(syntax_get(declaration));
      assert(tower_node_get_component_userdata(declaration, parser_match_get_type()));
      tower_node_release_ref(root);
    }
    assert(!*syntax_get_error(session.get()));
    auto document = TowerNodeRef(syntax_document(session.get()));
    assert(syntax_equal(document.get(), syntax_native_bedrock()));
    assert(syntax_format(session.get()).source == source);
    TowerNode* declaration_node = nullptr;
    for (auto* item : syntax_node(document.get()).items) if (syntax_node(item).name == "GrammarDeclaration") declaration_node = item;
    assert(declaration_node);
    auto& declaration = syntax_node(declaration_node);
    auto* literal = syntax_node(declaration.items[0]).items[0];
    assert(syntax_node(literal).text == "parse");
    assert(tower_node_get_component_userdata(literal, parser_match_get_type()));
    // A semantic edit is reflected by the common formatter, not an old source
    // slice or a separate text-dump model. The immutable native seed is untouched.
    syntax_node(literal).text = "rule";
    const auto changed = tower_format(document.get()).source;
    assert(changed.find("= 'rule'") != std::string::npos);
    assert(tower_format(syntax_native_bedrock()).source == source);
    session.reset();
    assert(tower_format(document.get()).source == changed);
    assert(parser_match_get_start((Match*)tower_node_get_component_userdata(literal, parser_match_get_type())) < source.size());
  }
  // Replacement templates are parsed once and splice actual captured trees.
  {
    Allocations allocations;
    const std::string source = base +
      "parse Expression |= 'one' => replace { 1 };"
      "parse Expression |= 'alias' => replace { one };"
      "parse Expression |= 'keep' '(' $value:Expression ')' => replace { $value };"
      "keep(alias);";
    Session session(syntax_create(source.c_str()), syntax_destroy);
    for (int i = 0; i < 6; ++i) next(session.get());
    auto result = next(session.get());
    assert(find(result.get(), "1"));
    assert(!find(result.get(), "one") && !find(result.get(), "alias") && !find(result.get(), "keep"));
    assert(syntax_get_expansion_stats(session.get()).replacements == 3);
    auto* literal = find(result.get(), "1");
    auto* provenance = syntax_get_origin(literal);
    assert(provenance && provenance->generated && provenance->expansion);
    assert(source.substr(provenance->template_start, provenance->template_end - provenance->template_start) == "1");
    assert(source_text(literal, source) == "alias");
    assert(provenance->expansion->previous);
    session.reset();
    assert(syntax_get_origin(literal)->expansion->rule == "Expression");
    char* dump = parser_tree_debug_string(result.get()); assert(strstr(dump, "1")); tower_memory_free(dump);
  }
  // Repeated captures splice whole forests, including empty bodies. Reusing a
  // capture copies it rather than reparenting/destroying the earlier occurrence.
  {
    Allocations allocations;
    const std::string source = base +
      "parse Block = '{' $Statement* '}';parse Statement |= Block;"
      "parse Statement |= 'twice' '{' $body:Statement* '}' => replace { { $body $body } };"
      "twice { a; b; }twice {}";
    Session session(syntax_create(source.c_str()), syntax_destroy);
    for (int i = 0; i < 6; ++i) next(session.get());
    auto result = next(session.get());
    auto* block = find(result.get(), "Block"); assert(block);
    auto* body = tower_node_get_child_member(block, "Statement"); assert(body);
    assert(tower_node_get_child_count(body) == 4);
    assert(source_text(child(body, 0), source) == "a;");
    assert(source_text(child(body, 1), source) == "b;");
    assert(source_text(child(body, 2), source) == "a;");
    assert(tower_node_get_id(child(body, 0)) != tower_node_get_id(child(body, 2)));
    assert(syntax_get_expansion_stats(session.get()).copied_nodes > 0);
    auto empty = next(session.get());
    assert(tower_node_get_child_count(tower_node_get_child_member(find(empty.get(), "Block"), "Statement")) == 0);
  }
  // Named helper replacements acquire their destination through a unit rule.
  // They stay pending while unreachable, then validate before becoming usable.
  {
    Allocations allocations;
    const std::string source = base +
      "parse Alias = 'named' => replace { 9 };parse Expression |= Alias;named;";
    Session session(syntax_create(source.c_str()), syntax_destroy);
    for (int i = 0; i < 5; ++i) next(session.get());
    auto result = next(session.get());
    assert(find(result.get(), "9") && !find(result.get(), "Alias"));
  }
  for (const std::string bad : {
      "parse Expression |= 'bad' => replace { $Missing };",
      "parse Expression |= 'bad' '(' $value:Expression ')' => replace { $value; };",
      "parse Expression |= 'bad' => replace { 1 ",
      "parse Expression |= 'bad' '(' $value:Expression ')' => replace { 1 };bad(unknown);"}) {
    Allocations allocations;
    Session session(syntax_create((base + bad).c_str()), syntax_destroy);
    for (int i = 0; i < 3; ++i) next(session.get());
    if (bad.find("bad(unknown)") != std::string::npos) {
      next(session.get()); auto result = next(session.get());
      assert(find(result.get(), "1") && !find(result.get(), "unknown"));
    } else { assert(!syntax_next(session.get())); assert(*syntax_get_error(session.get())); assert(syntax_get_revision(session.get()) == 3); }
  }
  {
    Allocations allocations;
    Session session(syntax_create((base + "parse Expression |= 'again' => replace { again };again;").c_str()), syntax_destroy);
    for (int i = 0; i < 4; ++i) next(session.get());
    assert(!syntax_next(session.get())); assert(strstr(syntax_get_error(session.get()), "limit exceeded"));
  }
  // Shared prefixes use real LR lookahead. A short statement can precede
  // another statement or declaration; nested loops use the same table actions.
  {
    Allocations allocations;
    const std::string source = base + feature + "parse Statement |= 'for';" +
      "for(item in items){for for(child in children){child;} for}" +
      "for /* lookahead trivia */ item;for " +
      "token Identifier = /@[a-z]+/ as identifier;@item;for";
    Session session(syntax_create(source.c_str()), syntax_destroy);
    for (int i = 0; i < 6; ++i) next(session.get());
    auto loop = next(session.get());
    assert(find(loop.get(), "ForEach"));
    auto* body = tower_node_get_child_member(find(loop.get(), "ForEach"), "Statement");
    assert(tower_node_get_child_count(body) == 3);
    assert(source_text(next(session.get()).get(), source) == "for");
    assert(source_text(next(session.get()).get(), source) == "item;");
    assert(source_text(next(session.get()).get(), source) == "for");
    next(session.get());
    assert(syntax_get_revision(session.get()) == 7);
    assert(source_text(next(session.get()).get(), source) == "@item;");
    assert(source_text(next(session.get()).get(), source) == "for");
    assert(!syntax_next(session.get()) && !*syntax_get_error(session.get()));
  }
  // Once '(' shifts, malformed loops must fail rather than retry the earlier
  // short match. Invalid lookahead after a complete short form belongs to the
  // following construct and must not lose its original error position.
  for (const std::string suffix : {"for(", "for(x xs){}", "for(x in xs){", "for @"}) {
    Allocations allocations;
    const std::string source = base + feature + "parse Statement |= 'for';" + suffix;
    Session session(syntax_create(source.c_str()), syntax_destroy);
    for (int i = 0; i < 6; ++i) next(session.get());
    if (suffix == "for @") assert(source_text(next(session.get()).get(), source) == "for");
    assert(!syntax_next(session.get()) && *syntax_get_error(session.get()));
    if (suffix == "for @") assert(syntax_get_error_offset(session.get()) == source.size() - 1);
  }
  // A boundary that really is ambiguous is a table conflict: 'x x' could be
  // one long statement or two short ones. Candidate installation stays atomic.
  {
    Allocations allocations;
    Session session(syntax_create("parse Statement = 'x';parse Statement |= 'x' 'x';"), syntax_destroy);
    next(session.get());
    assert(!syntax_next(session.get()));
    assert(strstr(syntax_get_error(session.get()), "Conflicting parser actions (shift/reduce)"));
    assert(syntax_get_revision(session.get()) == 1);
  }
  // Definition and use share a line with no separating whitespace. The first
  // `for` must be lexed after installing the new grammar, never as an Identifier.
  {
    Allocations allocations;
    const std::string first = "for(item in items){item;for(child in children){child;}}";
    const std::string replacement = "parse ForEach = 'walk' '(' $Variable 'in' $Expression ')' '{' $Statement* '}';";
    const std::string source = base + feature + first + replacement + "walk(x in xs){}";
    Session session(syntax_create(source.c_str()), syntax_destroy);
    size_t offset = 0;
    for (size_t revision = 1; revision <= 5; ++revision) {
      auto declaration = next(session.get());
      // Grammar literals can contain semicolons, so use the tree's full span.
      auto* m = (Match*)tower_node_get_component_userdata(declaration.get(), parser_match_get_type());
      offset = parser_match_get_start(m) + parser_match_get_length(m);
      assert(syntax_get_revision(session.get()) == revision);
      assert(syntax_get_offset(session.get()) == offset);
    }
    auto loop = next(session.get());
    assert(source_text(loop.get(), source) == first);
    auto* foreach_node = find(loop.get(), "ForEach");
    assert(foreach_node);
    assert(source_text(tower_node_get_child_member(foreach_node, "Variable"), source) == "item");
    assert(source_text(tower_node_get_child_member(foreach_node, "Expression"), source) == "items");
    auto* statements = tower_node_get_child_member(foreach_node, "Statement");
    assert(statements && tower_node_get_child_count(statements) == 2);
    assert(find(tower_node_get_child(statements, 1), "ForEach"));
    auto definition = next(session.get());
    assert(syntax_get_revision(session.get()) == 6);
    auto changed = next(session.get());
    auto* changed_loop = find(changed.get(), "ForEach");
    assert(changed_loop);
    assert(tower_node_get_child_count(tower_node_get_child_member(changed_loop, "Statement")) == 0);
    assert(!syntax_next(session.get()) && !*syntax_get_error(session.get()));
    session.reset();
    char* dump = parser_tree_debug_string(loop.get());
    assert(strstr(dump, "Variable: rule Variable"));
    assert(strstr(dump, "Expression: rule Expression"));
    tower_memory_free(dump);
  }
  // Ordinary identifiers remain identifiers: adding a keyword does not split a
  // longer word. Optional/one-or-more rules and a new punctuation token also work.
  {
    Allocations allocations;
    const std::string source = base + feature +
      "format; // not the keyword for\n"
      "parse Many = 'many' '(' $Expression+ ')' ';';parse Statement |= Many;"
      "many(a 2 b);"
      "parse Maybe = 'maybe' $Expression? ';';parse Statement |= Maybe;maybe;maybe x;"
      "parse Arrow = '=>' $Expression ';';parse Statement |= Arrow;=> x;"
      "parse Expression |= String;\"a ; } // inside a string\";";
    Session session(syntax_create(source.c_str()), syntax_destroy);
    size_t count = 0;
    while (auto* raw = syntax_next(session.get())) { Node node(raw, tower_node_release_ref); ++count; }
    assert(!*syntax_get_error(session.get()));
    assert(count == 18);
  }
  // Activation is sequential: no future grammar declaration can rescue earlier
  // source. Invalid candidates do not publish a revision or damage prior trees.
  for (const auto& bad : std::vector<std::string>{
    "for(x in xs){}" + feature,
    "parse Statement |= Unknown;",
    "parse Missing |= Expression;",
    "parse Statement |= Expression ';';", // reduce/reduce conflict
    "parse Statement = ;",
    "parse Empty = ;parse Bad = Empty*;",
    "parse Cycle = Cycle;",
    "parse Dup = $Expression $Expression;",
    "parse Identifier = 'other';",
    "parse Bad = 'unterminated",
    "/* unterminated",
    "parse Bad = 'two words';",
    "parse Bad = 'x'" // missing declaration semicolon
  }) {
    Allocations allocations;
    Session session(syntax_create((base + bad).c_str()), syntax_destroy);
    auto first = next(session.get()); next(session.get()); next(session.get());
    size_t successful_revision = 3;
    while (auto* raw = syntax_next(session.get())) {
      Node node(raw, tower_node_release_ref);
      successful_revision = syntax_get_revision(session.get());
    }
    assert(*syntax_get_error(session.get()));
    assert(syntax_get_revision(session.get()) == successful_revision);
    assert(!syntax_next(session.get()));
    char* retained = parser_tree_debug_string(first.get());
    assert(strstr(retained, "GrammarDeclaration"));
    tower_memory_free(retained);
  }
  for (const std::string bad_loop : {"for(x in xs){", "for(x xs){}", "for(x in xs){x}", "for(x in xs){}@"}) {
    Allocations allocations;
    Session session(syntax_create((base + feature + bad_loop).c_str()), syntax_destroy);
    while (auto* raw = syntax_next(session.get())) { Node node(raw, tower_node_release_ref); }
    assert(*syntax_get_error(session.get()));
  }
  {
    Allocations allocations;
    const std::string source = base + feature +
      "parse ForEach = 'walk' '(' Variable 'in' Expression ')' '{' Statement* '}';"
      "for(x in xs){}";
    Session session(syntax_create(source.c_str()), syntax_destroy);
    for (int i = 0; i < 6; ++i) next(session.get());
    assert(!syntax_next(session.get()));
    assert(*syntax_get_error(session.get()));
    assert(syntax_get_revision(session.get()) == 6);
  }
  {
    Allocations allocations;
    Session session(syntax_create(" // empty\n /* source */ "), syntax_destroy);
    assert(!syntax_next(session.get()) && !*syntax_get_error(session.get()));
  }
  // Editing sessions retain only compiled grammars. Progress and highlighting
  // restart at revision zero; cache eviction must release every retained table.
  {
    Allocations allocations;
    Session session(syntax_create((base + feature + "for(x in xs){}").c_str()), syntax_destroy);
    auto consume = [&] {
      while (auto* raw = syntax_next(session.get())) { Node node(raw, tower_node_release_ref); }
    };
    consume();
    assert(!*syntax_get_error(session.get()));
    assert(syntax_get_cache_stats(session.get()).builds == 6);
    syntax_reset(session.get(), (base + "for;" + feature + "for(y in ys){}").c_str());
    assert(syntax_get_revision(session.get()) == 0 && syntax_get_offset(session.get()) == 0);
    consume();
    assert(!*syntax_get_error(session.get()));
    assert(syntax_get_cache_stats(session.get()).builds == 0);
    assert(syntax_get_cache_stats(session.get()).hits == 6);
    syntax_reset(session.get(), (base + "parse Statement |= Expression ';';").c_str());
    consume();
    assert(*syntax_get_error(session.get()) && syntax_get_revision(session.get()) == 3);
    for (int i = 0; i < 24; ++i) {
      std::string input = "parse Statement = 'word" + std::to_string(i) + "' ';';word" + std::to_string(i) + ";";
      syntax_reset(session.get(), input.c_str()); consume();
      assert(!*syntax_get_error(session.get()));
      assert(syntax_get_cache_stats(session.get()).entries <= SYNTAX_MAX_CACHED_GRAMMARS);
    }
    syntax_reset(session.get(), (base + feature + "for(z in zs){}").c_str()); consume();
    assert(!*syntax_get_error(session.get()));
    assert(syntax_get_revision(session.get()) == 5);
  }
  {
    std::string error;
    struct Case { const char* pattern; const char* source; size_t length; };
    for (const auto& c : std::vector<Case>{
      {"a|ab", "abc", 2}, {"ab?c", "ac!", 2}, {"ab?c", "abc!", 3},
      {"(ab|a)c", "abc!", 3}, {"((ab)*c)+", "abcc!", 4},
      {"a(b?)*", "abbb!", 4}, {"[a-c]+", "cbad", 3},
      {"[^a-c]+", "xyzb", 3}, {"[a-]+", "a--!", 3},
      {"[\\u{80}-\\u{10ffff}]+", "雪🚀a", 7}, {"\\x41\\u{1f680}", "A🚀!", 5},
      {".+", "hi\nthere", 2}, {"[\\]\\-]+", "]-x", 2},
    }) {
      auto pattern = lex_pattern_compile(c.pattern, error);
      assert(pattern && error.empty()); assert(pattern->match(c.source, 0) == c.length);
    }
    for (const std::string pattern : {"", "a*", "a?", "(a|)", "()*", "[z-a]", "[]", "[^]", "[abc", "(abc", "a**", "a{2}", "^a", "\\d", "\\1", "\\u{d800}", "\\x0"}) {
      assert(!lex_pattern_compile(pattern, error)); assert(!error.empty());
    }
    std::string excessive = "(a|b)*a";
    for (int i = 0; i < 12; ++i) excessive += "(a|b)";
    assert(!lex_pattern_compile(excessive, error));
    assert(error.find("complexity limit") != std::string::npos);
  }
  {
    Allocations allocations;
    const std::string source = R"tower(
      token Identifier = /[A-Za-z_][A-Za-z_0-9-]*/ as identifier;
      token Number = /[0-9]+(\.[0-9]+)?/ as number;
      token Hex = /0x[0-9a-f]+/ as number;
      skip Hash = /#[^\n]*/ as comment;
      parse Statement = Identifier Number String Hex ';';
      parse Extra = Identifier ';';
      parse Statement |= Extra;
      token String = /`[^`]*`/ as string;
      player-name 3.14 `hello` 0xff;
      # ignore me
      token Identifier = /@[a-z]+/ as identifier;
      @player;
    )tower";
    Session session(syntax_create(source.c_str()), syntax_destroy);
    for (int pass = 0; pass < 2; ++pass) {
      if (pass) syntax_reset(session.get(), source.c_str());
      size_t count = 0;
      while (auto* root = syntax_next(session.get())) { tower_node_release_ref(root); ++count; }
      assert(!*syntax_get_error(session.get()) && count == 11);
      assert(syntax_get_revision(session.get()) == 9);
      if (pass) assert(syntax_get_cache_stats(session.get()).builds == 0);
    }
    for (const auto* bad : {"token Identifier = /a*/;", "token Identifier = /[z-a]/;", "skip Identifier = /[a-z]+/;"}) {
      syntax_reset(session.get(), (base + bad).c_str());
      while (auto* root = syntax_next(session.get())) tower_node_release_ref(root);
      assert(*syntax_get_error(session.get()) && syntax_get_revision(session.get()) == 3);
      assert(syntax_get_tokens(session.get())[3].name == "Identifier");
      assert(syntax_get_tokens(session.get())[3].pattern.starts_with("[A-Za-z_][A-Za-z0-9_]*"));
    }
  }
  puts("Live syntax checks passed (declarations, captures, revisions, boundaries, conflicts, ownership, grammar cache, lexical rules).");
}
