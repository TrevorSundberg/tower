import {workloads} from '../../playground/scripts/interpreter-workloads.mjs';
import {spawnSync} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import os from 'node:os';
import assert from 'node:assert/strict';
const compiler=process.argv[2];
assert.ok(compiler,'Supply the production towerc executable');
const report={environment:{node:process.version,platform:process.platform,arch:process.arch,cpu:os.cpus()[0].model},warmups:3,samples:15,workloads:{}};
const median=xs=>xs.toSorted((a,b)=>a-b)[Math.floor(xs.length/2)];
for(const [name,source] of Object.entries(workloads)){
  const filename=fileURLToPath(new URL('../../build/interpreter-bench-'+name+'.tower',import.meta.url));
  await writeFile(filename,source);
  const rows={graph:{execute:[],compile:[]},fast:{execute:[],compile:[],prepare:[]}};
  let expected;
  for(let sample=-3;sample<15;sample++)for(const mode of sample%2?['fast','graph']:['graph','fast']){
    const result=spawnSync(compiler,[filename,mode==='fast'?'--interpret-fast':'--interpret','--timings'],{encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);expected??=result.stdout;assert.equal(result.stdout,expected);
    const timings=JSON.parse(result.stderr.match(/Tower timings \(ms\): (.*)/)[1]);
    if(sample>=0)for(const key of Object.keys(rows[mode]))rows[mode][key].push(timings[key]);
  }
  for(const row of Object.values(rows))for(const key of Object.keys(row))row[key+'MedianMs']=median(row[key]);
  report.workloads[name]=rows;console.error(name,rows.graph.executeMedianMs,rows.fast.executeMedianMs);
}
await writeFile(process.argv[3]??'build/native-interpreters-benchmark.json',JSON.stringify(report,null,2)+'\n');
