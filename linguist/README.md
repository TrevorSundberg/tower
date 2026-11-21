# Tower Linguist submission kit

These files prepare a future contribution to
[GitHub Linguist](https://github.com/github-linguist/linguist). Merely committing
them here does not install a language on GitHub.

- [languages.yml](languages.yml): proposed entry; `language_id` intentionally absent.
  The color matches the playground's accent. No unrelated parent `group`, editor
  mode, MIME type, interpreter/shebang or filename alias is claimed.
- [Editor package](../editors/tower): MIT-licensed `source.tower` TextMate grammar.
- [sample_candidates.json](sample_candidates.json): pointers to maintained,
  real-world source files; not duplicated or newly licensed copies.
- [Preparation and submission checklist](../docs/github_language_support.md):
  requirements, evidence, commands, limitations and outstanding gates.

`Tower` implicitly supplies the `tower` alias in Linguist. Bedrock, Foundation
and Tower sources all use `.tower`; `.towerbc` is a distribution envelope and
must not be registered as text source. Recheck extension/scope conflicts and
upstream requirements when submitting. Do not hand-allocate an ID here.
