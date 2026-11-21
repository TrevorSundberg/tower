#!/usr/bin/env python3
"""Exercise a compiler from an unrelated cwd, without searching system tools.

This verifies host behavior, not dependency closure or whole-compiler self-build.
Use an OS/VM/container with no development tools for the release isolation gate.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import platform
import re
import shutil
import subprocess
import time


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def verify(compiler, fixtures, directory, allow_tools=False):
    compiler = Path(compiler).resolve(strict=True)
    fixtures = Path(fixtures).resolve(strict=True)
    directory = Path(directory).resolve()
    directory.mkdir(parents=True, exist_ok=True)
    report = {"compiler_sha256": digest(compiler), "compiler_bytes": compiler.stat().st_size,
              "platform": platform.platform(), "machine": platform.machine(),
              "system_tool_path": allow_tools, "checks": [], "passed": False}
    env = dict(os.environ)
    # No inherited compiler/loader search overrides. OS runtime libraries are
    # still available: a PATH test alone cannot establish dependency closure.
    for key in list(env):
        if key.startswith(("LD_", "DYLD_", "TOWER_")) or key in {
                "LIBRARY_PATH", "CPATH", "C_INCLUDE_PATH", "CPLUS_INCLUDE_PATH"}:
            del env[key]
    if not allow_tools:
        env["PATH"] = str(compiler.parent) + os.pathsep + str(compiler.parent / "tools")

    def run(name, argv, expected=None, fails=False, diagnostic=None):
        start = time.perf_counter()
        result = subprocess.run([str(arg) for arg in argv], cwd=directory, env=env,
                                capture_output=True, timeout=180)
        elapsed = (time.perf_counter() - start) * 1000
        (directory / (name + ".stdout")).write_bytes(result.stdout)
        (directory / (name + ".stderr")).write_bytes(result.stderr)
        passed = (result.returncode != 0) if fails else (result.returncode == 0)
        if expected is not None:
            passed = passed and result.stdout.replace(b"\r\n", b"\n") == expected
        if diagnostic:
            passed = passed and re.search(diagnostic, result.stderr.decode("utf-8", "replace")) is not None
        report["checks"].append({"name": name, "exit": result.returncode,
                                  "milliseconds": elapsed, "passed": passed})
        if not passed:
            raise RuntimeError(f"{name} failed (exit {result.returncode}); see {directory / (name + '.stderr')}")
        return result

    try:
        suffix = ".exe" if os.name == "nt" else ""
        for name in [*[f"program-{i}.o" for i in range(3)], "library.o", "linked" + suffix, "program" + suffix]:
            (directory / name).unlink(missing_ok=True)
        for name in ("program", "library", "link", "invalid"):
            shutil.copy2(fixtures / f"distribution_{name}.tower", directory / f"{name}.tower")
        help_result = run("help", [compiler, "--help"])
        if b"--target" not in help_result.stdout:
            raise RuntimeError("Help did not describe compiler options")
        version = run("version", [compiler, "--version"])
        report["version"] = version.stdout.decode("utf-8", "replace").strip()
        run("invalid-option", [compiler, "--not-an-option"], fails=True, diagnostic="Unexpected argument")
        run("missing-source", [compiler, "missing.tower"], fails=True)
        run("diagnostic", [compiler, "invalid.tower", "--interpret"], fails=True,
            diagnostic=r"invalid\.tower:4:\d+:")
        run("interpret", [compiler, "program.tower", "--interpret"], b"42\n")
        for iteration in range(3):
            run(f"compile-{iteration}", [compiler, "program.tower", "--emit", "object", "-o", f"program-{iteration}.o"])
        objects = [digest(directory / f"program-{i}.o") for i in range(3)]
        if any((directory / f"program-{i}.o").stat().st_size == 0 for i in range(3)):
            raise RuntimeError("Object emission produced an empty file")
        if len(set(objects)) != 1:
            raise RuntimeError("Repeated object emission changed bytes")
        report["object_sha256"] = objects[0]
        run("library", [compiler, "library.tower", "--library", "-o", "library.o"])
        run("link", [compiler, "link.tower", "--link", "library.o", "-o", "linked" + suffix])
        run("linked-execution", [directory / ("linked" + suffix)], b"42\n")
        run("compile-executable", [compiler, "program.tower", "-o", "program" + suffix])
        for iteration in range(3):
            run(f"execution-{iteration}", [directory / ("program" + suffix)], b"42\n")
        report["passed"] = True
    except (RuntimeError, OSError, subprocess.SubprocessError) as error:
        report["error"] = str(error)
    finally:
        (directory / "report.json").write_text(json.dumps(report, indent=2) + "\n")
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("compiler", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--fixtures", type=Path,
                        default=Path(__file__).resolve().parents[2] / "scaffolding/tests")
    parser.add_argument("--allow-development-tools", action="store_true",
                        help="Use installed tools; explicitly not the portable release gate")
    args = parser.parse_args()
    # Caller normally points at a relocated candidate. An unrelated cwd prevents
    # implicit lookup of grammar/runtime files in the checkout.
    report = verify(args.compiler, args.fixtures, args.output, args.allow_development_tools)
    print(json.dumps(report, indent=2))
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
