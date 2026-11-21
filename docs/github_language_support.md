# Preparing Tower for GitHub language recognition

Checked against upstream Linguist on **2026-11-21**. This is preparation in the
Tower repository; no upstream issue, pull request, grammar registration or
Marketplace publication has been made.

## What can work now

The [editor package](../editors/tower/README.md) associates `.tower` with Tower
and provides a tested `source.tower` TextMate grammar for local use. The root
README identifies the language and points to working code and the playground.
The [candidate metadata](../linguist/languages.yml) and
[real-source inventory](../linguist/sample_candidates.json) are ready to refine
for a future submission.

`.gitattributes` keeps Tower text eligible for statistics and excludes dependency
trees and generated distribution artifacts. It does not assign `.tower` to C++,
JavaScript, Text or an invented language. Project-owned compiler, browser and
build sources remain ordinary source; they are not hidden to manipulate ratios.

GitHub's [override documentation](https://github.com/github-linguist/linguist/blob/main/docs/overrides.md#detectable)
explicitly says an unregistered language remains absent even with
`linguist-language` and `linguist-detectable` attributes. Upstream
[languages.yml](https://github.com/github-linguist/linguist/blob/main/lib/linguist/languages.yml)
currently has no Tower, `.tower` or `Other` language entry. “Other” groups smaller
recognized languages in the chart, as illustrated in this
[Linguist answer](https://github.com/github-linguist/linguist/discussions/7378).
There is no truthful repository-only switch to count unknown Tower files there.

## Remaining gates

1. **Independent usage.** The current
   [contribution policy](https://github.com/github-linguist/linguist/blob/main/CONTRIBUTING.md#language-extension-and-filename-usage-requirements)
   asks for at least 2,000 indexed files for a repeating extension such as
   `.tower`, indexed within the last year, excluding forks, with meaningful
   distribution across owners and repositories. Maintainers may remove dominant
   owners from their assessment. Files here, copies and artificial repositories
   are not evidence of broad adoption. No qualifying usage total is claimed.
2. **Sample permission.** Existing Tower sources have no repository-wide license
   at this revision. The inventory marks their licenses `null`. Obtain explicit
   permission or an appropriate source license before copying candidates into
   Linguist. The new editor package's MIT license covers only its own directory.
   Its small scope tests and the README tutorial are not real-world samples.
3. **Upstream validation.** TextMate tests run locally and in this repo's editor
   CI. Linguist's grammar import/compiler, classifier checks and full tests must
   run in a current Linguist checkout when a submission is justified.

Keep an evidence record at submission time: assessment date, exact search query,
indexed count, sampled independent `owner/repo` links, source permalinks and
licenses. Start with
[non-fork `.tower` code search](https://github.com/search?q=NOT+is%3Afork+path%3A*.tower&type=code)
and [the same search excluding this owner](https://github.com/search?q=NOT+is%3Afork+path%3A*.tower+-user%3ATrevorSundberg&type=code).
Inspect results for unrelated uses of the extension; local Git counts do not
measure GitHub's index, recency or independent adoption.

## Future upstream contribution

Use the current upstream **Adding a language** instructions and PR template.
The outline below is preparation, not a command to submit now:

1. Merge the candidate `Tower` entry into `lib/linguist/languages.yml` in its
   alphabetical position. Recheck name, extension, scope and color conflicts.
2. Run `script/add-grammar https://github.com/TrevorSundberg/tower`.
   The grammar is nested at `editors/tower/syntaxes/tower.tmLanguage.json` and its
   scoped MIT license is adjacent at `editors/tower/LICENSE`. Verify that the
   importer discovers both; if it cannot associate the nested package/license,
   arrange an upstream-supported grammar source layout before claiming success.
   A separate grammar repository is not created by this task.
3. After permission is recorded, copy representative real source to
   `samples/Tower/` and list original commit-pinned URLs and licenses in the PR.
   Use the inventory to choose sources; do not inflate samples with tutorials or
   duplicate a corpus here. Add corresponding `test/test_blob.rb` detection cases.
4. Run these upstream tools, reviewing generated changes:

   ```sh
   script/update-ids
   bundle exec rake test
   bundle exec script/cross-validation --test
   ```

5. Fill in the upstream PR template, linking usage evidence, the language guide,
   grammar, source provenance, permission and test results. Submit only when the
   gates above are met and the user authorizes work outside this repository.

An accepted PR still needs a Linguist release deployed to GitHub. Search indexing
can lag further; see [upstream rollout notes](https://github.com/github-linguist/linguist/blob/main/docs/troubleshooting.md#my-linguist-pr-has-been-merged-but-github-doesnt-reflect-my-changes).
The chart, code highlighting, Markdown fences, search and local editor support
are related integrations with different rollout paths, not one repo setting.

## Maintaining the kit

Use `npm ci --prefix editors/tower` then `npm test --prefix editors/tower` for
grammar changes. Add `.tower` scope fixtures when lexical syntax changes. Keep
the grammar conservative: it cannot execute incremental Tower declarations or
replace the compiler's highlighting. Before submission, rerun upstream checks
and refresh every requirement and evidence link above.
