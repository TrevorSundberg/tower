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
coreutils, GNU tar and the packages `llvm-19-dev`, `clang-19`, `libc6-dev` and `binutils`.

### Development compiler built from `41de9006`

Download the Ubuntu x64 archive and run these commands from the directory
containing it. The first check authenticates the entire archive, including
`development.json`. Extraction uses a new directory so an existing install
stays usable. [Linux x64 archive](https://tower-lang.org/downloads/41de9006-linux-x64.tar.gz)

```sh
(
  set -eu
  printf '%s  %s\n' 6dd19c7f17e029d758e41c4732235a36fdf424726eaf895a09e80db45853ab27 \
    41de9006-linux-x64.tar.gz | sha256sum --strict --check
  prefix="$HOME/.local/Tower Dev 41de9006"
  mkdir -p "$HOME/.local"
  mkdir -m 700 "$prefix"
  tar -xzpf 41de9006-linux-x64.tar.gz -C "$prefix"
  cd "$prefix/linux-x64"
  sha256sum --strict --check SHA256SUMS
  ./towerc --version
)
```

Alternatively, this installer fetches the checksum list and all 60 payloads
from the pinned package commit. It prints the installed compiler path.
Running it again verifies the files in that prefix.

```sh
installer=$(curl -qfsS -H 'Accept: application/vnd.github.raw+json' \
  https://api.github.com/repos/TrevorSundberg/tower/git/blobs/84e5332cbfee62843ec79439e7335914e506bd5f) &&
  bash -c "$installer" -- "$HOME/.local/Tower Dev 41de9006"
```

Save the sample as `example.tower` and run the commands below. The interpreter
and the compiled executable each print `42`. To relocate the installation,
move the whole prefix and update the compiler path. [Sample program](scaffolding/tests/distribution_program.tower)

```sh
compiler="$HOME/.local/Tower Dev 41de9006/linux-x64/towerc"
"$compiler" example.tower --interpret
"$compiler" example.tower --cc clang-19 -o example && ./example
```

| Package component | Identity |
| --- | --- |
| Compiler build source | `41de9006adff910a23d810010576ef66934fa1c8` |
| Package commit used for every installer request | `7e34072d999e1cc8f7d0f619099f32077b67f697` |
| SHA-256 of `towerc` (2,279,272 bytes) | `e2d03c1e8530fbc5b4dccd147ec388ea0f2663037a26f0f7418ce43eb9dd3e07` |
| SHA-256 of `linux-x64/SHA256SUMS` | `3a3f5f2e915caf95adeb3cf19a1a90021068ee3cd2262b14bb86e99d106aae64` |
| SHA-256 of the installer | `0d2c775efcc92bf790af6a62ecb019343d9d7601022621e4f51b7042eb4ec024` |

### Test compiler built from `8bc867b6`

This Linux x64 compiler was built on Ubuntu 24.04.5 with LLVM 19.1.1.
It supports inline tests, adjacent companions, fixture files and affected-test
selection. To install from the versioned archive, download it and run these
commands in the same directory. They verify the archive, extract it into a
fresh prefix and check all 60 payloads. [Linux x64 archive](https://tower-lang.org/downloads/8bc867b6-linux-x64.tar.gz)

```sh
(
  set -eu
  printf '%s  %s\n' b6517d0c72adca86ce2255b08efdcf80d2acaa2abfcc5f8622c7ae63d056bbdb \
    8bc867b6-linux-x64.tar.gz | sha256sum --check
  prefix="$HOME/.local/Tower Dev 8bc867b6"
  mkdir -p "$HOME/.local"
  mkdir -m 700 "$prefix"
  tar -xzpf 8bc867b6-linux-x64.tar.gz -C "$prefix"
  cd "$prefix/linux-x64"
  sha256sum --check SHA256SUMS
  ./towerc --version
)
```

The installer below uses an immutable package revision. It installs the
compiler in a fresh prefix or verifies the files in a matching prefix.

```sh
installer=$(curl -qfsS -H 'Accept: application/vnd.github.raw+json' \
  https://api.github.com/repos/TrevorSundberg/tower/git/blobs/eff1c8a75b268d02f5c9168fa72e999a5a1cc2bb) &&
  bash -c "$installer" -- "$HOME/.local/Tower Dev 8bc867b6"
```

Keep `linux-x64/towerc` and its adjacent resources together when moving the
installation. To try it, save the distribution sample as `example.tower` and
run the following commands in that directory. Both runs print `42`. [Sample program](scaffolding/tests/distribution_program.tower)

```sh
compiler="$HOME/.local/Tower Dev 8bc867b6/linux-x64/towerc"
"$compiler" example.tower --interpret
"$compiler" example.tower --cc clang-19 -o example && ./example
```

| Package component | Identity |
| --- | --- |
| Compiler build source | `8bc867b69cc6084b9da09a51475c7c740efd9419` |
| Package commit used for every installer request | `15cacf5ae9a46bbf7d1e5f348a5c9c737331a8b6` |
| SHA-256 of `towerc` (2,319,768 bytes) | `7315b86e2b2751a9434281125884fc9ed7d223b64603e96b930bc59d274d4138` |
| SHA-256 of `linux-x64/SHA256SUMS` | `15ae00aa12ae28f926fee13882a4ce81341643725462da4da62fb84def6c05df` |
| SHA-256 of the installer | `0d4b4bfa643818241887d7cac92e0a789f132a0d724d158eb2fde00f88d99fc6` |

### Published compiler built from `3ae475c2`

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

The installer checks all 59 files in the checksum list before running the
compiler. On Ubuntu 24.04.5, the matching installation passed verification.
An installation of the previous version in the requested prefix produced an
error and preserved its files.

To use the previous `0823b028` compiler, run its original installer.

```sh
installer=$(curl -qfsS -H 'Accept: application/vnd.github.raw+json' \
  https://api.github.com/repos/TrevorSundberg/tower/git/blobs/b7e14bf007857d108c90834230bedae240edb3ba) &&
  bash -c "$installer" -- "$HOME/.local/Tower Dev 0823b028"
```

The earlier `be41c755` compiler also has its original installer and prefix.

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
