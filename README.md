# Tower

Tower is an experimental programming language with extensible syntax written in
Tower itself. Source files use the **`.tower`** extension. Bedrock supplies grammar
declarations, Foundation supplies typed operations, and Tower builds richer syntax
on those same nodes. Canonical Foundation source remains the semantic interchange
format.

**[Try the playground](https://tower-lang.org/)** ·
[Language guide](docs/tower.md) ·
[Foundation](docs/foundation.md) ·
[Modules](docs/modules.md)

```tower
import tower;

fn sum_to(count: i32): i32 {
    var total: i32 = 0;
    for (var i: i32 = 1; i <= count; i++) {
        total += i;
    }
    return total;
}

print(sum_to(10));
```

The playground runs compilation and execution in cancellable workers. It includes
graph and fast interpreters, WebAssembly execution, and optional native/backend
outputs. See the [playground documentation](playground/README.md) for supported
targets, limitations, build commands and deployment checks.

## Install the Linux x64 development compiler

On Ubuntu 24.04 x86-64, the prerequisites are Bash, curl, CA certificates, GNU
coreutils and the packages `llvm-19-dev`, `clang-19`, `libc6-dev` and `binutils`.
Use this command to install the compiler
built at `3ae475c2` from package commit `e3872c21`. The versioned
prefix lets you keep an earlier installation alongside it.

```sh
installer=$(curl -qfsS -H 'Accept: application/vnd.github.raw+json' \
  https://api.github.com/repos/TrevorSundberg/tower/git/blobs/30113ef9fec199da4e8a060bc393bd94a5332906) &&
  bash -c "$installer" -- "$HOME/.local/Tower Dev 3ae475c2"
```

The installer prints the executable path. Repeating the command verifies the
installed copy. If the prefix already contains another version, choose a fresh
directory and use that path below. To try it, save the [sample Tower program](scaffolding/tests/distribution_program.tower)
as `example.tower` in a new directory. Run these commands from that directory.
Each prints `42`.

```sh
"$HOME/.local/Tower Dev 3ae475c2/linux-x64/towerc" example.tower --interpret
"$HOME/.local/Tower Dev 3ae475c2/linux-x64/towerc" example.tower --cc clang-19 -o example && ./example
```

The delivery receipt records the Ubuntu 24.04.5 x86-64 installation checks
against a local HTTPS mirror of the immutable Git bytes. The installer
verifies the 57 payloads listed in the package.

The preceding `be41c755` compiler remains available through its original
installer and prefix.

```sh
installer=$(curl -qfsS -H 'Accept: application/vnd.github.raw+json' \
  https://api.github.com/repos/TrevorSundberg/tower/git/blobs/7efb6d68a294e8e46b8143a6aac93ab129bbadd8) &&
  bash -c "$installer" -- "$HOME/.local/Tower Dev be41c755"
```

### Previously published compiler

To install or verify the published `902a358f` compiler and its resources from
`93210484`, use its original command and prefix.

```sh
installer=$(curl -qfsS -H 'Accept: application/vnd.github.raw+json' \
  https://api.github.com/repos/TrevorSundberg/tower/git/blobs/5772d8b61771ad95021b2455432e48ae316c8c80) &&
  bash -c "$installer" -- "$HOME/.local/Tower Dev"
```

That installer and the example above passed on Ubuntu 24.04.5 x86-64 with
LLVM/Clang 19.1.1 and Debian 12 x86-64 with LLVM/Clang 19.1.7 using
`$HOME/.local/Tower Dev/linux-x64/towerc`.

## Build and explore

Start with the [documented development bootstrap](bootstrap/README.md). It is a
hybrid Linux x64 development package; portable, pure-Tower compiler releases are
still a goal. The [backend build guide](scaffolding/backend/README.md) describes
the native compiler. Real sources live in [scaffolding](scaffolding), including
the [library](scaffolding/library), [compiler](scaffolding/compiler) and
[examples](scaffolding/examples).

## Editor and GitHub support

The [Tower editor package](editors/tower/README.md) supplies a TextMate grammar,
`.tower` file association and basic VS Code editing support. It is usable locally;
it has not been published to the VS Code Marketplace or accepted into GitHub.

GitHub's language chart currently omits unrecognized `.tower` files. Its “Other”
category is not a bucket for unknown languages. The chart therefore does not yet
describe all of this repository's source. We keep the
[Linguist submission materials and remaining requirements](docs/github_language_support.md)
here, including metadata, a grammar and real-source sample candidates.

## Licensing

The new editor package has its own [MIT license](editors/tower/LICENSE), limited
to that directory. This repository does not currently declare a project-wide
license for the existing Tower sources. Third-party components retain their own
licenses. Candidate Linguist samples need explicit redistribution permission
before submission; the editor license does not grant that permission.
