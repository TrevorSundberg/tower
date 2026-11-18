import { targets, emptySelection } from './targets.mjs';

// Hints describe the browser/OS, which may itself be emulated. This is a default
// suggestion, never evidence for enabling instructions or changing target ABI.
export function inferBrowserTarget(nav = {}, hints = {}) {
  const ua = nav.userAgent || '';
  const platform = hints.platform || nav.userAgentData?.platform || nav.platform || '';
  const identity = platform + ' ' + ua;
  const osIdentity = hints.platform || nav.userAgentData?.platform || identity;
  let os = /Android/i.test(osIdentity) ? 'android' :
    /iPhone|iPad|iPod|^iOS$/i.test(osIdentity) ||
      (!hints.platform && !nav.userAgentData?.platform && /Mac/i.test(platform) && nav.maxTouchPoints > 1) ? 'ios' :
    /Windows|Win32|Win64/i.test(osIdentity) ? 'windows' : /Mac/i.test(osIdentity) ? 'mac' :
    /CrOS|Chrome OS/i.test(osIdentity) ? 'chromeos' : /Linux/i.test(osIdentity) ? 'linux' : null;
  let architecture = null;
  let osEvidence = os ? 'reported' : 'fallback', architectureEvidence = 'fallback';
  if (/^(arm|aarch64|arm64)$/i.test(hints.architecture || '')) {
    architecture = hints.bitness === '32' ? 'arm32' : 'arm64';
    architectureEvidence = hints.bitness ? 'client hints' : 'client hints; assumed 64-bit';
  } else if (/^(x86|x86_64|x64)$/i.test(hints.architecture || '')) {
    architecture = hints.bitness === '32' && !hints.wow64 ? 'x86' : 'x64';
    architectureEvidence = hints.bitness || hints.wow64 ? 'client hints' : 'client hints; assumed 64-bit';
  } else if (/aarch64|arm64/i.test(identity)) {
    architecture = 'arm64'; architectureEvidence = 'reported';
  } else if (/armv[5-8]l|armv7/i.test(identity)) {
    architecture = 'arm32'; architectureEvidence = 'reported';
  } else if (/x86_64|amd64|Win64|WOW64|x64/i.test(identity)) {
    architecture = 'x64'; architectureEvidence = 'reported';
  } else if (/i[3-6]86/i.test(identity)) {
    architecture = 'x86'; architectureEvidence = 'reported';
  }
  // macOS UAs commonly say "Intel" even on Apple Silicon. Treat that word as
  // ambiguous. Prefer ARM64 on Macs/mobile, x64 elsewhere, without timing probes.
  if (!architecture) architecture = ['mac', 'ios', 'android'].includes(os) ? 'arm64' : 'x64';
  if (!os) os = 'windows';
  const key = Object.keys(targets).find(key => targets[key].os === os && targets[key].architecture === architecture) ?? 'wasm';
  const reason = `${os} (${osEvidence}), ${architecture} (${architectureEvidence})`;
  const strongMatch = key !== 'wasm' && osEvidence === 'reported' &&
    ['reported', 'client hints'].includes(architectureEvidence);
  return { key, os, architecture, reason, strongMatch };
}

export async function detectBrowserTarget(nav = {}, timeoutMs = 200) {
  let timer;
  try {
    const hints = await Promise.race([
      Promise.resolve().then(() => nav.userAgentData?.getHighEntropyValues?.(['architecture', 'bitness', 'wow64'])),
      new Promise(resolve => { timer = setTimeout(() => resolve({}), timeoutMs); }),
    ]);
    return inferBrowserTarget(nav, hints || {});
  } catch { return inferBrowserTarget(nav); }
  finally { clearTimeout(timer); }
}

export function defaultTargetSelection(detection) {
  return { ...emptySelection(), [detection.key]: true, wasm: true };
}
