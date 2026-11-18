import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

const server = spawn(process.execPath, [fileURLToPath(new URL('./serve.mjs', import.meta.url))], {
  env: { ...process.env, HOST: '127.0.0.1', PORT: '0' }, stdio: ['ignore', 'pipe', 'inherit'],
});
try {
  const url = await new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(new Error('Static server did not start')), 10000);
    server.once('error', error => { clearTimeout(timeout); reject(error); });
    server.once('exit', code => { clearTimeout(timeout); reject(new Error(`Static server exited: ${code}`)); });
    server.stdout.on('data', data => {
      output += data;
      const match = output.match(/Tower playground: (http:\/\/[^\s]+)/);
      if (match) { clearTimeout(timeout); resolve(match[1] + '/'); }
    });
  });
  const verify = spawn(process.execPath, [fileURLToPath(new URL('./verify-deployment.mjs', import.meta.url)), url], {stdio: 'inherit'});
  const [code] = await once(verify, 'exit');
  process.exitCode = code ?? 1;
} finally {
  if (server.exitCode === null && server.signalCode === null) {
    const exited = once(server, 'exit');
    server.kill();
    await exited;
  }
}
