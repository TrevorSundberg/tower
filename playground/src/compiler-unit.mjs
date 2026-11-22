import {loadLLVM} from './llvm-host.mjs';

// A worker owns one complete compiler instance, allocator and in-memory FS.
// Only immutable inputs and owned output bytes cross this boundary. The parent
// controls dispatch through the Tower coordinator, not through this adapter.
export function compilerUnitMessages(send) {
  let compiler, files, grammar, sources, revision, profile;
  return async data => {
    try {
      if (data.type === 'prepare') {
        if (compiler) throw new Error('Compiler worker is already initialized');
        ({files,grammar,revision,profile} = data);
        sources = new Map(files.map(file => [file.path,file.text]));
        compiler = await loadLLVM(data.module,undefined,grammar.foundation,undefined,grammar.bedrock,{tower:grammar.tower,builtins:grammar});
        send({type:'ready',revision,profile});
        return;
      }
      if (!compiler || data.revision !== revision || data.profile !== profile)
        throw new Error('Stale compiler worker ticket');
      const {entry} = data;
      if (!sources.has(entry)) throw new Error('Missing compiler entry: '+entry);
      compiler.configureModules({entry,files,builtins:grammar,library:'.'});
      const start = performance.timeOrigin + performance.now();
      const result = compiler.compile(sources.get(entry),{library:true,emit:'object'});
      const end = performance.timeOrigin + performance.now();
      const error = result.status === 'error' ? (result.errorFile || entry)+': '+result.error : undefined;
      const object = result.object;
      send({type:'result',unit:data.unit,revision,profile,object,error,start,end},object ? [object.buffer] : []);
    } catch (error) {
      send({type:'fatal',error:error.message || String(error)});
    }
  };
}
