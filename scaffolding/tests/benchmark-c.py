"""Compare repeated native process timings; check every result before reporting."""
import json
import pathlib
import statistics
import subprocess
import sys
import time

compiler = str(pathlib.Path(sys.argv[1]).resolve())
directory = pathlib.Path(sys.argv[2]).resolve()
directory.mkdir(parents=True, exist_ok=True)

def call(args):
    return subprocess.run(list(map(str,args)), capture_output=True, check=True, timeout=120)

cases = {
    'recurrence': '''var state:u32=7; var i:u32=0;
loop { if i == LIMIT { break; } state=state*1664525; state=state+1013904223;
var half=state/65536; state=state^half; i=i+1; } print(state);''',
    'memory': '''var data=alloc(u32,4096); var i:u32=0; var sum:u32=1;
fill(data,0,16384);
loop { if i == LIMIT { break; } var slot=i%4096; var value=data[slot];
sum=sum*1664525; sum=sum+value; sum=sum+i; data[slot]=sum; i=i+1; }
print(sum); free(data);''',
}
report = {'compiler':compiler, 'method':'Seven alternating process runs; median wall seconds; matching output required. Includes process launch, excludes compilation.', 'cases':[]}
for name, template in cases.items():
    path=directory/(name+'.tower')
    # Foundation keeps if operands simple, as does the source fixture.
    source=template.replace('if i == LIMIT { break; }','var done=i==LIMIT; if done { break; }')
    path.write_text(source.replace('LIMIT','30000000'))
    variants={}
    native=directory/(name+'-native')
    call([compiler,path,'-o',native]); variants['Tower LLVM O2']=native
    for optimize in [False,True]:
        stem=name+('-optimized' if optimize else '-raw')
        c=directory/(stem+'.c')
        call([compiler,path,'--emit','c','-o',c,*([] if optimize else ['--no-optimize'])])
        for cc in ['clang','gcc']:
            exe=directory/(stem+'-'+cc)
            call([cc,'-std=c89','-pedantic','-Wall','-Wextra','-Werror','-O2',c,'-o',exe])
            variants[('optimized C' if optimize else 'raw C')+' / '+cc+' O2']=exe
    expected=call([native]).stdout
    samples={key:[] for key in variants}
    for round in range(7):
        keys=list(variants)
        if round%2: keys.reverse()
        for key in keys:
            start=time.perf_counter(); result=call([variants[key]]); elapsed=time.perf_counter()-start
            assert result.stdout==expected, (name,key,result.stdout,expected)
            samples[key].append(elapsed)
    medians={key:statistics.median(values) for key,values in samples.items()}
    report['cases'].append({'name':name,'iterations':30000000,'stdout':expected.decode(),'median_seconds':medians,'samples':samples})
    print(name,medians,flush=True)
    # Short identical source isolates interpreter execution from compilation using
    # the existing CLI timing report; avoid timing a multi-minute graph run.
    path.write_text(source.replace('LIMIT','100000'))
    expected=call([compiler,path,'--interpret']).stdout
    for mode, options in [('--interpret', []), ('--interpret-fast O0', ['--interpret-fast','--no-optimize']),
                          ('--interpret-fast O2', ['--interpret-fast'])]:
        run=call([compiler,path,*(options or ['--interpret']),'--timings']); assert run.stdout==expected
        report['cases'][-1][mode]=run.stderr.decode()
(directory/'report.json').write_text(json.dumps(report,indent=2))
