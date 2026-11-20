import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {refreshCompilerSources} from '../src/projects.mjs';

const root=new URL('../../scaffolding/',import.meta.url);
async function sources(folder='') {
  const files=[];
  for(const entry of await readdir(new URL(folder,root),{withFileTypes:true})) {
    const name=folder+entry.name;
    if(entry.isDirectory())files.push(...await sources(name+'/'));
    else if(name.endsWith('.tower'))files.push(name);
  }
  return files;
}

test('every owned Tower source path has an ordinary dotted import spelling',async()=>{
  const files=await sources();
  const available=new Set(files);
  for(const file of files) {
    for(const part of file.slice(0,-6).split('/'))assert.match(part,/^[A-Za-z_][A-Za-z_0-9]*$/,file);
    if(!file.startsWith('tests/')) {
      const source=await readFile(new URL(file,root),'utf8');
      assert.doesNotMatch(source,/^import\s+['"]/m,file+': production imports use dotted names');
      for(const imported of source.matchAll(/^import\s+([^;]+);/gm)) {
        const name=imported[1].split(/\s+as\s+/)[0];
        const match=/^(\.*)([A-Za-z_][A-Za-z_0-9]*(?:\.[A-Za-z_][A-Za-z_0-9]*)*)$/.exec(name);
        assert.ok(match,file+': identifier import '+name);
        const target='../'.repeat(match[1].length)+match[2].replaceAll('.','/')+'.tower';
        const local=path.posix.normalize(path.posix.join(path.posix.dirname(file),target));
        assert.ok(available.has(local)||(!match[1]&&available.has(target)),file+': missing import '+name);
      }
    }
  }
});

test('compiler project upgrades retire unchanged old names and preserve edits',()=>{
  const project={active:'old-name.tower',sourceBaseline:{'old-name.tower':'original','edited-name.tower':'original'},
    files:[{path:'old-name.tower',text:'original'},{path:'edited-name.tower',text:'my edit'},
      {path:'custom.tower',text:'my source'}]};
  const recipe={entry:'new_name.tower',files:[{path:'new_name.tower',text:'updated'}]};
  refreshCompilerSources(project,recipe);
  assert.deepEqual(project.files,[{path:'edited-name.tower',text:'my edit'},
    {path:'custom.tower',text:'my source'},{path:'new_name.tower',text:'updated'}]);
  assert.equal(project.active,'new_name.tower');
  refreshCompilerSources(project,recipe);
  assert.equal(project.files.length,3);
});
