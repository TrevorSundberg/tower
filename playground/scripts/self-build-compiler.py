#!/usr/bin/env python3
"""Build three complete compiler generations from an explicit source recipe.

No project C/C++ compilation, shell expansion, downloads or system tool search.
This prepares a candidate only; platform isolation/dependency audits and release
review remain required. See docs/bootstrap-distribution.md for the recipe.
"""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath
import platform
import re
import shutil
import subprocess
import time


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def relative(value):
    path = PurePosixPath(value)
    if not value or path.is_absolute() or any(x in ("", ".", "..") for x in value.split("/")) or ":" in value or "\\" in value:
        raise ValueError(f"Expected a package-relative path: {value!r}")
    return path


def host_matches(target):
    machine = platform.machine().lower()
    arch = "x86_64" if machine in ("amd64", "x86_64") else "aarch64" if machine in ("arm64", "aarch64") else machine
    system = platform.system()
    known = {"x86_64-unknown-linux-gnu": ("Linux", "x86_64"),
             "aarch64-unknown-linux-gnu": ("Linux", "aarch64"),
             "x86_64-pc-windows-msvc": ("Windows", "x86_64"),
             "x86_64-apple-macos11": ("Darwin", "x86_64"),
             "arm64-apple-macos11": ("Darwin", "aarch64")}
    return known.get(target) == (system, arch)


def validate(recipe, root):
    if recipe.get("schema") != 1:
        raise ValueError("Unsupported compiler recipe schema")
    if not re.fullmatch(r"[0-9a-f]{40}", recipe.get("source_revision", "")):
        raise ValueError("Recipe must record the source revision; input hashes identify its exact contents")
    if not host_matches(recipe["target"]):
        raise ValueError("Actual execution on this target OS/architecture is required; cross-produced objects are insufficient")
    files = recipe["files"]
    if not files:
        raise ValueError("Recipe has no input closure")
    for name, item in files.items():
        path = root / relative(name)
        if name.split("/")[0] in ("objects", "composed", "evidence", "recipe.json", "manifest.json"):
            raise ValueError(f"Reserved package path: {name}")
        if path.is_symlink() or not path.resolve().is_relative_to(root):
            raise ValueError(f"Input escapes the source root or is a symlink: {name}")
        if sha(path) != item["sha256"]:
            raise ValueError(f"Input hash mismatch: {name}")
        if item["role"] not in ("tower-source", "third-party", "license", "fixture"):
            raise ValueError(f"Unapproved input role (native project seeds are forbidden): {name}")
        if item["role"] in ("tower-source", "fixture") and path.suffix != ".tower":
            raise ValueError(f"Project implementation/tests must be Tower source: {name}")
        if item["role"] == "third-party":
            if not item.get("origin") or not item.get("version"):
                raise ValueError(f"Dependency provenance missing: {name}")
            licenses = item.get("licenses", [])
            if not licenses or any(files.get(license, {}).get("role") != "license" for license in licenses):
                raise ValueError(f"Dependency license closure missing: {name}")
    for grammar in ("share/tower/bedrock.tower", "share/tower/foundation.tower", "share/tower/tower.tower"):
        if files.get(grammar, {}).get("role") != "tower-source":
            raise ValueError(f"Required grammar missing: {grammar}")
    for name in ("program", "library", "link", "invalid"):
        if files.get(f"tests/distribution-{name}.tower", {}).get("role") != "fixture":
            raise ValueError(f"Correctness fixture missing: {name}")
    compiler = str(relative(recipe["compiler"]))
    if compiler not in ("towerc", "towerc.exe"):
        raise ValueError("The compiler must live at the package root beside share/tower")
    if compiler in files:
        raise ValueError("The successor compiler must be built, not copied from inputs")
    units = recipe["units"]
    names = set()
    outputs = set()
    for unit in units:
        name = unit["name"]
        if not name or any(c not in "abcdefghijklmnopqrstuvwxyz0123456789-_" for c in name) or name in names:
            raise ValueError(f"Invalid/duplicate unit name: {name}")
        names.add(name)
        output = str(relative(unit.get("output", f"objects/{name}.o")))
        if not output.endswith(".o") or not output.startswith(("objects/", "share/tower/")) or output in files or output in outputs:
            raise ValueError(f"Invalid or colliding generated object path: {output}")
        outputs.add(output)
        if not unit["sources"] or any(files.get(source, {}).get("role") != "tower-source" for source in unit["sources"]):
            raise ValueError(f"Unit {name} must be built entirely from declared Tower sources")
    if not names:
        raise ValueError("A complete compiler requires source units")
    link = recipe["link"]
    if files.get(link["tool"], {}).get("role") != "third-party":
        raise ValueError("Linker must be included in the declared third-party closure")
    used = {name for arg in link["args"] for name in re.findall(r"\{object:([^}]+)\}", arg)}
    compiler_units = set(recipe["compiler_units"])
    if not compiler_units or not compiler_units <= names or used != compiler_units or not any("{output}" in arg for arg in link["args"]):
        raise ValueError("Link must consume every declared compiler unit and explicitly name {output}")
    for unit in units:
        if unit["name"] not in compiler_units and not unit.get("output", "").startswith("share/tower/"):
            raise ValueError("Target runtime units must remain in the package under share/tower")
    for arg in link["args"]:
        for name in re.findall(r"\{file:([^}]+)\}", arg):
            if files.get(name, {}).get("role") != "third-party":
                raise ValueError(f"Undeclared third-party linker input: {arg}")
        literal = re.sub(r"\{(?:output|(?:file|object):[^}]+)\}", "", arg)
        coff_flag = literal.startswith(("/out:", "/entry:", "/subsystem:", "/machine:", "/timestamp:", "/threads:", "/export:")) or literal in ("/nodefaultlib", "/dll", "/noentry")
        if "{" in literal or "}" in literal or (Path(literal).is_absolute() and not coff_flag):
            raise ValueError(f"Unresolved placeholder or absolute linker path: {arg}")
        if literal.startswith(("@", "-L", "-l", "--library", "--sysroot", "-syslibroot")) or literal.lower().startswith(("/libpath:", "/defaultlib:")):
            raise ValueError(f"Link inputs must be explicit files, not host searches: {arg}")
    return files


def run(argv, cwd, report, name, env):
    start = time.perf_counter()
    result = subprocess.run([str(x) for x in argv], cwd=cwd, env=env, capture_output=True, timeout=1800)
    report["commands"].append({"name": name, "argv": [str(x) for x in argv],
                               "milliseconds": (time.perf_counter() - start) * 1000,
                               "exit": result.returncode})
    logs = cwd / "evidence"
    logs.mkdir(exist_ok=True)
    (logs / (name + ".stdout")).write_bytes(result.stdout)
    (logs / (name + ".stderr")).write_bytes(result.stderr)
    if result.returncode:
        raise RuntimeError(f"{name} failed; see {logs / (name + '.stderr')}")


def build(recipe_path, bootstrap, out):
    root = recipe_path.parent.resolve()
    recipe = json.loads(recipe_path.read_text())
    files = validate(recipe, root)
    bootstrap = bootstrap.resolve(strict=True)
    # Never merge a candidate with stale outputs or overwrite an earlier trial.
    out.mkdir(parents=True, exist_ok=False)
    report = {"schema": 1, "target": recipe["target"], "source_revision": recipe["source_revision"], "recipe_sha256": sha(recipe_path),
              "bootstrap_sha256": sha(bootstrap), "platform": platform.platform(),
              "commands": [], "stages": [], "passed": False}
    spec = importlib.util.spec_from_file_location("verify_compiler", Path(__file__).with_name("verify-compiler.py"))
    verifier = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(verifier)
    previous = bootstrap
    try:
        for generation in range(1, 4):
            stage = out / f"stage{generation}"
            stage.mkdir()
            for name, item in files.items():
                dest = stage / name
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(root / name, dest)
                dest.chmod(0o755 if item.get("executable") else 0o644)
            shutil.copyfile(recipe_path, stage / "recipe.json")
            objects = stage / "objects"
            objects.mkdir()
            outputs = {unit["name"]: unit.get("output", f"objects/{unit['name']}.o") for unit in recipe["units"]}
            source_dir = stage / "composed"
            source_dir.mkdir()
            env = {key: value for key, value in os.environ.items()
                   if key in ("SystemRoot", "WINDIR", "TEMP", "TMP", "TMPDIR", "HOME")}
            env["PATH"] = str(stage / "tools")
            for unit in recipe["units"]:
                source = source_dir / (unit["name"] + ".tower")
                source.write_text("import tower;\n" + "".join(
                    "import " + ("." + path.removesuffix(".tower").replace("/", ".")
                        if all(re.fullmatch(r"[A-Za-z_][A-Za-z_0-9]*", part)
                            for part in path.removesuffix(".tower").split("/"))
                        else json.dumps("../" + path, ensure_ascii=False)) + ";\n"
                    for path in unit["sources"]), encoding="utf-8")
                object_path = stage / outputs[unit["name"]]
                object_path.parent.mkdir(parents=True, exist_ok=True)
                run([previous, source, "--library", "--target", recipe["target"],
                     "--bedrock", stage / "share/tower/bedrock.tower",
                     "--foundation", stage / "share/tower/foundation.tower",
                     "-o", object_path], stage, report,
                    f"compile-{unit['name']}", env)
            compiler = stage / recipe["compiler"]
            compiler.parent.mkdir(parents=True, exist_ok=True)
            args = []
            for arg in recipe["link"]["args"]:
                arg = arg.replace("{output}", str(compiler))
                arg = re.sub(r"\{object:([^}]+)\}", lambda match: str(stage / outputs[match[1]]), arg)
                arg = re.sub(r"\{file:([^}]+)\}", lambda match: str(stage / match[1]), arg)
                args.append(arg)
            run([stage / recipe["link"]["tool"], *args], stage, report, "link-compiler", env)
            compiler.chmod(0o755)
            checks = verifier.verify(compiler, stage / "tests", stage / "evidence/verification")
            if not checks["passed"]:
                raise RuntimeError(f"Generation {generation} compiler failed: {checks.get('error')}")
            if "hybrid" in checks.get("version", "").lower():
                raise RuntimeError("A hybrid compiler cannot pass the whole-compiler release gate")
            artifacts = [recipe["compiler"], *outputs.values()]
            hashes = {name: sha(stage / name) for name in artifacts}
            report["stages"].append({"generation": generation, "artifacts": hashes, "checks": checks})
            previous = compiler
        if report["stages"][1]["artifacts"] != report["stages"][2]["artifacts"]:
            raise RuntimeError("Second and third whole-compiler generations differ")
        candidate = out / "candidate"
        shutil.copytree(out / "stage3", candidate, ignore=shutil.ignore_patterns("evidence", "objects", "composed"))
        manifest = {"schema": 1, "target": recipe["target"], "kind": "candidate", "source_revision": recipe["source_revision"],
                    "recipe_sha256": report["recipe_sha256"], "files": {}}
        for path in sorted(candidate.rglob("*")):
            if path.is_file():
                manifest["files"][path.relative_to(candidate).as_posix()] = {
                    "sha256": sha(path), "bytes": path.stat().st_size, "executable": bool(path.stat().st_mode & 0o111)}
        (candidate / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
        report["candidate_bytes"] = sum(item["bytes"] for item in manifest["files"].values()) + (candidate / "manifest.json").stat().st_size
        report["passed"] = True
    except (ValueError, KeyError, OSError, RuntimeError, subprocess.SubprocessError) as error:
        report["error"] = str(error)
        raise
    finally:
        (out / "report.json").write_text(json.dumps(report, indent=2) + "\n")
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("recipe", type=Path)
    parser.add_argument("--bootstrap", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    try:
        report = build(args.recipe.resolve(strict=True), args.bootstrap, args.output.resolve())
        print(json.dumps(report, indent=2))
    except (ValueError, KeyError, OSError, RuntimeError, subprocess.SubprocessError) as error:
        parser.exit(1, str(error) + "\n")


if __name__ == "__main__":
    main()
