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
