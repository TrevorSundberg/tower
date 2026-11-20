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

export const hex=x=>'&h'+BigInt.asUintN(64,BigInt(x)).toString(16).padStart(16,'0')+'&';

export function expression(op, values, width) {
  const [a,b]=values.map(hex),w=String(width),signed=op.endsWith('_s');
  if(['add','sub','mul','and','or','xor'].includes(op)) return `tr_${op}(${a}, ${b}, ${w}, false)`;
  if(/^(div|rem)_[su]$/.test(op)) return `tr_${op.slice(0,3)}(${a}, ${b}, ${w}, ${signed})`;
  if(op==='shl') return `tr_mask(tr_shl(${a}, ${b} and ${width-1}&), ${w})`;
  if(op==='shr_u') return `tr_shr(tr_mask(${a}, ${w}), ${b} and ${width-1}&)`;
  if(op==='shr_s') return `tr_shrs(${a}, ${b}, ${w})`;
  if(['rotl','rotr'].includes(op)) return `tr_${op}(${a}, ${b}, ${w})`;
  if(['clz','ctz','popcnt'].includes(op)) return `tr_${op}(${a}, ${w})`;
  if(op==='eqz') return `tr_bool(tr_mask(${a}, ${w}) = 0&)`;
  if(/^extend(8|16|32)_s$/.test(op)) return `tr_convert(${a}, ${op.match(/\d+/)[0]}, true, ${w}, true, false)`;
  const comparison={eq:'=',ne:'<>',lt:'<',le:'<=',gt:'>',ge:'>='}[op.split('_')[0]];
  assert.ok(comparison,'Unsupported corpus operation '+op);
  return `tr_bool(tr_compare(${a}, ${b}, ${w}, ${signed}) ${comparison} 0)`;
}

// Read the pinned WAST expectations, without executing/reimplementing a Wasm VM.
export function wastCases(source,width) {
  const cases=[];
  const integer=text=>{text=text.replaceAll('_','');return text.startsWith('-')?-BigInt(text.slice(1)):BigInt(text);};
  const rows=source.matchAll(/\(assert_(return|trap)\s+\(invoke\s+"(\w+)"\s*((?:\(i(?:32|64)\.const\s+[-\w]+\)\s*)+)\)\s*(?:\(i(?:32|64)\.const\s+([-\w]+)\)|"([^"]+)")\)/g);
  for(const [,kind,op,args,result,message] of rows) {
    const values=[...args.matchAll(/\.const\s+([-\w]+)/g)].map(m=>integer(m[1]));
    cases.push({op,width,values,expected:kind==='return'?BigInt.asUintN(width,integer(result)):undefined,trap:kind==='trap',message});
  }
  return cases;
}

export function assertions(cases) {
  const chunks=[];
  for(let at=0;at<cases.length;at+=64) {
    const body=cases.slice(at,at+64).map((c,index)=>{
      const expr=expression(c.op,c.values,c.width),label=`${at+index}: i${c.width}.${c.op} ${c.values.join(',')}`;
      if(c.trap) return `    caught = false\n    try\n        value = ${expr}\n    catch e\n        if instr(1, e.message, "Tower:") <> 1 then throw e\n        caught = true\n    end try\n    if not caught then throw "Missing trap ${label}"`;
      return `    value = ${expr}\n    if value <> ${hex(c.expected)} then throw "Mismatch ${label}: " + value.tostr()`;
    }).join('\n');
    chunks.push(`sub check_${at}()\n${body}\nend sub\n`);
  }
  return chunks.join('\n')+`\nsub Main()\n${chunks.map((_,i)=>`    check_${i*64}()`).join('\n')}\n    print "passed ${cases.length}"\nend sub\n`;
}
