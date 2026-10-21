// 새 버전 확인 — 서버의 version.json과 지금 열린 화면의 버전을 비교해요.
import { APP_VERSION } from './core.js';

let cache = null;
export async function fetchVersion() {
  try {
    const r = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!r.ok) return cache;
    cache = await r.json();
  } catch (e) { /* 인터넷이 끊겼으면 마지막으로 받은 정보 */ }
  return cache;
}
export function cmpVer(a, b) {
  const pa = String(a || '0').split('.').map(Number), pb = String(b || '0').split('.').map(Number);
  for (let i = 0; i < 3; i++) { const d = (pa[i] || 0) - (pb[i] || 0); if (d) return d; }
  return 0;
}
// { current, latest, isNew, info }
export async function checkUpdate() {
  const info = await fetchVersion();
  const latest = info && info.version ? info.version : APP_VERSION;
  return { current: APP_VERSION, latest, isNew: cmpVer(latest, APP_VERSION) > 0, info };
}
// 새로 고침 — 서비스 워커의 저장본도 새 버전으로
export async function reloadToLatest() {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r => r.update().catch(() => {})));
  } catch (e) { /* 무시 */ }
  location.reload();
}
// 일정 간격으로 확인해서 새 버전이면 알려줌
export function watchUpdates(onNew, everyMs = 10 * 60 * 1000) {
  const run = async () => { const u = await checkUpdate(); if (u.isNew) onNew(u); };
  run();
  return setInterval(run, everyMs);
}
