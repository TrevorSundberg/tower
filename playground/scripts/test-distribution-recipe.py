#!/usr/bin/env python3
"""Build-recipe validation tests; compiler functional fixtures remain Tower."""
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('self_build', Path(__file__).with_name('self-build-compiler.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class RecipeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        # This is schema-test data. The pretend linker is never executed and
        # these inputs cannot be presented as a complete compiler recipe.
        self.recipe = {'schema': 1, 'source_revision': '0' * 40,
                       'target': 'x86_64-unknown-linux-gnu', 'compiler': 'towerc',
                       'files': {}, 'units': [{'name': 'host', 'sources': ['src/host.tower']}],
                       'compiler_units': ['host'],
                       'link': {'tool': 'tools/linker', 'args': ['{object:host}', '-o', '{output}']}}
        paths = [('share/tower/bedrock.tower', 'tower-source'),
                 ('share/tower/foundation.tower', 'tower-source'),
                 ('src/host.tower', 'tower-source'), ('licenses/linker.txt', 'license'),
                 ('tools/linker', 'third-party')]
        paths += [(f'tests/distribution-{name}.tower', 'fixture') for name in ('program', 'library', 'link', 'invalid')]
        for name, role in paths:
            path = self.root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(b'// schema test only\n')
            item = {'role': role, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
            if role == 'third-party':
                item.update(origin='test fixture', version='test', licenses=['licenses/linker.txt'])
            self.recipe['files'][name] = item

    def validate(self):
        with patch.object(module, 'host_matches', return_value=True):
            module.validate(self.recipe, self.root)

    def test_valid_schema_and_inline_coff_output(self):
        self.validate()
        self.recipe['link']['args'] = ['{object:host}', '/out:{output}', '/timestamp:0', '/entry:main']
        self.validate()

    def test_native_project_source_rejected(self):
        self.recipe['files']['src/host.tower']['role'] = 'project-native'
        with self.assertRaisesRegex(ValueError, 'native project seeds'):
            self.validate()

    def test_tampered_input_rejected(self):
        (self.root / 'src/host.tower').write_bytes(b'changed')
        with self.assertRaisesRegex(ValueError, 'hash mismatch'):
            self.validate()

    def test_dependency_license_required(self):
        self.recipe['files']['tools/linker']['licenses'] = []
        with self.assertRaisesRegex(ValueError, 'license closure'):
            self.validate()

    def test_unbundled_linker_rejected(self):
        self.recipe['link']['tool'] = '/usr/bin/ld'
        with self.assertRaisesRegex(ValueError, 'declared third-party'):
            self.validate()

    def test_implicit_library_search_rejected(self):
        for flag in ('-lLLVM', '--library=LLVM', '--library-path=lib', '/LIBPATH:lib', '/DEFAULTLIB:LLVM'):
            with self.subTest(flag=flag):
                self.recipe['link']['args'] = ['{object:host}', '-o', '{output}', flag]
                with self.assertRaises(ValueError):
                    self.validate()

    def test_traversal_rejected(self):
        self.recipe['files']['../outside.tower'] = self.recipe['files']['src/host.tower']
        with self.assertRaisesRegex(ValueError, 'package-relative'):
            self.validate()

    def test_incomplete_link_rejected(self):
        self.recipe['link']['args'] = ['-o', '{output}']
        with self.assertRaisesRegex(ValueError, 'every declared compiler unit'):
            self.validate()

    def test_target_runtime_is_retained(self):
        self.recipe['units'].append({'name': 'runtime', 'sources': ['src/host.tower'],
                                     'output': 'share/tower/runtime.o'})
        self.validate()
        self.recipe['units'][-1]['output'] = 'objects/runtime.o'
        with self.assertRaisesRegex(ValueError, 'must remain in the package'):
            self.validate()

    def test_cross_build_cannot_claim_execution(self):
        with patch.object(module, 'host_matches', return_value=False):
            with self.assertRaisesRegex(ValueError, 'Actual execution'):
                module.validate(self.recipe, self.root)

    def test_invalid_recipe_cannot_create_candidate(self):
        self.recipe['units'] = []
        path = self.root / 'recipe.json'
        path.write_text(json.dumps(self.recipe))
        with patch.object(module, 'host_matches', return_value=True):
            with self.assertRaisesRegex(ValueError, 'requires source units'):
                module.build(path, self.root / 'no-bootstrap', self.root / 'build')
        self.assertFalse((self.root / 'build').exists())


if __name__ == '__main__':
    unittest.main()
