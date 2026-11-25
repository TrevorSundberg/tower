import {test, expect} from '@playwright/test';

test('warm Execute preserves the first module error and retries failed replacements', async ({page}) => {
  await page.goto('/builtins.json');
  const replies = await page.evaluate(async () => {
    const names = await (await fetch('./builtins.json')).json();
    const builtins = Object.fromEntries(await Promise.all(names.map(async name =>
      [name, await (await fetch('./' + name + '.tower')).text()])));
    const {foundation, bedrock, tower} = builtins;
    const main = {path:'main.tower', text:'import tower; print(42);'};
    const invalid = {path:'extra.tower', text:'\0'};
    const worker = new Worker('./execution-worker.js', {type:'module'});
    let id = 0;
    function execute(drive) {
      return new Promise((resolve, reject) => {
        worker.onerror = event => reject(new Error(event.message));
        worker.onmessage = ({data}) => {
          if (data.ready) worker.postMessage({command:'execute', id});
          if (data.error) resolve(data.error);
          if (data.result && data.result.status !== 'executing') resolve(data.result.error || data.result.output);
        };
        worker.postMessage({id:++id, backend:'interpreter', entry:main.path, source:main.text,
          files:[main], drive, builtins, foundation, bedrock});
      });
    }
    try {
      const warm = await execute([main]);
      builtins.tower += '\0';
      const competing = await execute([main, invalid]);
      builtins.tower = tower;
      const recovered = await execute([main]);
      const failedReplacement = await execute([main, invalid]);
      const retry = await execute([main]);
      return [warm, competing, recovered, failedReplacement, retry];
    } finally { worker.terminate(); }
  });
  expect(replies).toEqual(['42\n', 'Invalid module input: .tower/tower.tower', '42\n',
    'Invalid module input: extra.tower', 'Invalid module input: extra.tower']);
});
