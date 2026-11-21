// Static hosts cannot always set COOP/COEP. Establish them before starting the
// editor, so an initial navigation never interrupts unsaved edits. Unsupported
// browsers and denied registrations keep the portable compiler.
export async function prepareCompilerIsolation() {
  const attempt = 'tower.compiler-isolation-attempt';
  try {
    if (globalThis.crossOriginIsolated) { sessionStorage.removeItem(attempt); return; }
    if (!globalThis.isSecureContext || !navigator.serviceWorker || sessionStorage.getItem(attempt)) return;
    const url = new URL('./compiler-isolation-worker.js', import.meta.url);
    let registrationTimer;
    const registered = await Promise.race([
      navigator.serviceWorker.register(url, {scope:'./'}).then(() => true),
      new Promise(resolve => { registrationTimer = setTimeout(() => resolve(false), 3000); }),
    ]);
    clearTimeout(registrationTimer);
    if (!registered) return;
    const controls = () => navigator.serviceWorker.controller?.scriptURL === url.href;
    if (!controls()) {
      let timer;
      const controlled = await new Promise(resolve => {
        const changed = () => {
          if (!controls()) return;
          clearTimeout(timer);
          navigator.serviceWorker.removeEventListener('controllerchange', changed);
          resolve(true);
        };
        navigator.serviceWorker.addEventListener('controllerchange', changed);
        timer = setTimeout(() => {
          navigator.serviceWorker.removeEventListener('controllerchange', changed);
          resolve(false);
        }, 3000);
        changed();
      });
      if (!controlled) return;
    }
    sessionStorage.setItem(attempt, '1');
    location.reload();
    // The replacement document will start the editor. Do not launch workers on
    // the outgoing, non-isolated document while navigation is being scheduled.
    await new Promise(() => {});
  } catch { /* Storage/service-worker policies may require the portable path. */ }
}
