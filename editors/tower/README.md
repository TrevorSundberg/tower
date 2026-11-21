# Tower editor support

This directory is a standalone, declarative VS Code language extension and the
source of the proposed GitHub TextMate grammar. All newly authored files in this
directory are covered by [LICENSE](LICENSE); that license does not apply to Tower
sources elsewhere in this repository.

| Identity | Value |
| --- | --- |
| Display name | Tower |
| Extension / language ID | `.tower` / `tower` |
| TextMate scope | `source.tower` |
| Grammar | `syntaxes/tower.tmLanguage.json` |

From the repository root, launch an isolated extension development window:

```sh
code --extensionDevelopmentPath="$(pwd)/editors/tower" .
```

PowerShell:

```powershell
code --extensionDevelopmentPath="$($PWD.Path)/editors/tower" .
```

Open a `.tower` file and select **Tower** if the language mode is not automatic.
No executable extension entry point or network service is needed. The required
`publisher` field uses `tower-local` solely as a local extension identifier. It
does not claim a registered Marketplace publisher; choose and verify an owned
publisher before any future Marketplace release.

## Highlighting contract

The grammar recognizes common Bedrock/Foundation/Tower declarations, strings,
comments, escaped identifiers, grammar captures, operators and decimal integers.
It treats `/.../` as a pattern only inside `token`/`skip` declarations, keeping
ordinary division separate; character classes can contain a slash. Built-in
type names receive a lexical color, not semantic name resolution. Both quote
styles are strings. Backticks quote identifiers.

Tower can redefine its grammar within a file, which a static TextMate grammar
cannot execute or track. Custom syntax, imported grammar changes, user-defined
types and compiler diagnostics remain the compiler/playground's responsibility.
This is editor metadata, not another Tower parser or semantic model. Retired
`const` shorthand is deliberately not advertised as a declaration keyword.

## Validation

```sh
npm ci --prefix editors/tower
npm test --prefix editors/tower
```

Tests are `.tower` text with scope assertions in comments, executed by the
existing `vscode-tmgrammar-test` runner against VS Code's TextMate/Oniguruma engine.
They check highlighting, including malformed editor input, not compilation or
program semantics. They are not candidate Linguist classifier samples.
GitHub's PCRE-based grammar compiler must also be run during eventual submission;
passing these tests does not claim that upstream check has run.

See [GitHub preparation](../../docs/github_language_support.md) for remaining
adoption, sample-license and upstream integration requirements.
