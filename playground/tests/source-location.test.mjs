import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Text} from '@codemirror/state';
import {documentLocation,sourceLocation} from '../src/source-location.mjs';
import {sourceDiagnostic} from '../src/diagnostics.mjs';
import {byteOffsets} from '../src/offsets.mjs';

test('cursor and diagnostic locations share filenames and Unicode scalar columns',()=>{
  const source='// heading\n"🚀é";?',doc=Text.of(source.split('\n')),offset=source.indexOf('?');
  const location=documentLocation(doc,offset,'.tower/foundation.tower');
  assert.deepEqual(location,{file:'foundation.tower',line:2,column:6});
  const diagnostic=sourceDiagnostic(doc,byteOffsets(source),{errorOffset:new TextEncoder().encode(source.slice(0,offset)).length,error:'Unexpected ?'},[],'.tower/foundation.tower');
  assert.equal(sourceLocation(location.file,location.line,location.column),'foundation.tower:2:6');
  assert.equal(sourceLocation(diagnostic.file,diagnostic.line,diagnostic.column),'foundation.tower:2:6');
  assert.equal(sourceLocation('helpers/math.tower',3,7),'helpers/math.tower:3:7');
});
