import assert from 'node:assert/strict';
import brs from 'brs-node';
import bsc from 'brighterscript';

// Node 22+ simulator only. No discovery, network, sideload, or device credentials.
export async function runBrightScript(source, main='sub Main()\nTowerRun()\nend sub\n') {
  const program=new bsc.Program({rootDir:process.cwd(),createPackage:false,copyToStaging:false});
  program.setFile('source/program.brs',source);
  program.setFile('source/main.brs',main);
  program.validate();
  const errors=program.getDiagnostics().filter(d=>d.severity===1);
  assert.deepEqual(errors.map(d=>({message:d.message,line:d.range?.start.line})),[],'BrightScript validation');
  program.dispose();
  const payload=await brs.createPayloadFromFileMap(new Map([
    ['source/program.brs',new Blob([source])],['source/main.brs',new Blob([main])],
    ['manifest',new Blob(['title=Tower Roku tests\nmajor_version=1\nminor_version=0\nbuild_version=0\n'])],
  ]));
  let output='',errorsText='';
  const result=await brs.executeFile(payload,{stdout:{write:s=>{output+=s;}},stderr:{write:s=>{errorsText+=s;}},post:false,stopOnCrash:false});
  assert.equal(errorsText,'',errorsText);
  assert.equal(result.exitReason,'EXIT_USER_NAV',JSON.stringify(result));
  return output.replaceAll('\r\n','\n');
}
