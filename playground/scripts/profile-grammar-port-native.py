#!/usr/bin/env python3
"""Paired native CLI comparison; --interpret's compile phase includes machine setup."""
import argparse, json, pathlib, re, statistics, subprocess, time
parser=argparse.ArgumentParser()
parser.add_argument('baseline',type=pathlib.Path)
parser.add_argument('current',type=pathlib.Path)
parser.add_argument('report',type=pathlib.Path)
args=parser.parse_args()
root=pathlib.Path(__file__).resolve().parents[2]
out=root/'build/emission-profile'; out.mkdir(exist_ok=True)
fixtures={
 'small':'var value = 42; print(value);',
 'inference':(root/'scaffolding/examples/inference.tower').read_text(),
 'replacements':(root/'scaffolding/examples/increment.tower').read_text(),
 'declarations500':'\n'.join(f'var value{i} = {i};' for i in range(500))+'\nprint(value499);',
 'grammar50':'\n'.join(f"parse Profile{i} = 'profile{i}';" for i in range(50))+'\nprint(42);',
}
compilers={'before':args.baseline.resolve(),'after':args.current.resolve()}
report={'baseline':str(compilers['before']),'current':str(compilers['after']),
 'method':'4 warmups + 30 alternating paired independent CLI processes; identical explicit grammar inputs; milliseconds', 'fixtures':{}}
for name,source in fixtures.items():
 path=out/(name+'.tower'); path.write_text(source)
 samples={key:{} for key in compilers}; expected=None
 for i in range(34):
  for stage in (['after','before'] if i%2 else ['before','after']):
   start=time.perf_counter()
   result=subprocess.run([str(compilers[stage]),str(path),'--interpret','--timings','--bedrock',str(root/'scaffolding/bedrock.tower'),'--foundation',str(root/'scaffolding/foundation.tower')],capture_output=True,text=True,check=True)
   elapsed=(time.perf_counter()-start)*1000
   if expected is None: expected=result.stdout
   assert expected==result.stdout,(name,stage,result.stdout,expected)
   values=json.loads(re.search(r'Tower timings \(ms\): (\{.*\})',result.stderr)[1]); values['process']=elapsed
   if i>=4:
    for key,value in values.items(): samples[stage].setdefault(key,[]).append(value)
 report['fixtures'][name]={stage:{key:{'p50':round(statistics.median(xs),3),'p95':round(sorted(xs)[28],3),'samples':xs} for key,xs in values.items()} for stage,values in samples.items()}
 print(name,json.dumps({stage:{key:{'p50':entry['p50'],'p95':entry['p95']} for key,entry in values.items()} for stage,values in report['fixtures'][name].items()}),flush=True)
args.report.write_text(json.dumps(report,indent=2)+'\n')
