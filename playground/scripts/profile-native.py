#!/usr/bin/env python3
"""Run under Linux/WSL: profile fresh native compiler processes and their outputs."""
import argparse, json, pathlib, subprocess, time
parser=argparse.ArgumentParser()
parser.add_argument('compiler',type=pathlib.Path)
parser.add_argument('report',type=pathlib.Path)
parser.add_argument('--timings',action='store_true')
args=parser.parse_args()
root=pathlib.Path(__file__).resolve().parents[2]
output=root/'build/native-profile'; output.mkdir(exist_ok=True)
samples=[]
def run(command):
    start=time.perf_counter()
    result=subprocess.run([str(item) for item in command],capture_output=True,text=True,check=True)
    phases={}
    for line in result.stderr.splitlines():
        if line.startswith('Tower timings (ms): '): phases=json.loads(line.split(': ',1)[1])
    return {'wallMs':(time.perf_counter()-start)*1000,'phases':phases,'output':result.stdout}
for fixture,expected in [('memory','5\n84\n42\n'),('functions','720\n721\n')]:
    source=root/'scaffolding/examples'/f'{fixture}.tower'
    for sample in range(5):
        base=[args.compiler.resolve(),source]+(['--timings'] if args.timings else [])
        interpreted=run(base+['--interpret']); assert interpreted['output']==expected
        compiled=run(base+['-o',output/'program'])
        executed=run([output/'program']); assert executed['output']==expected
        obj=run(base+['--emit','object','-o',output/'program.o'])
        samples.append({'fixture':fixture,'sample':sample,'interpret':interpreted,'compile':compiled,'execute':executed,'object':obj})
args.report.write_text(json.dumps({'units':'milliseconds','compiler':str(args.compiler),'samples':samples},indent=2)+'\n')
print(args.report)
