// 벨키퍼 소리 재생
// - 기본 종소리: 파일 없이 브라우저가 직접 만들어 냅니다 (인터넷이 끊겨도 울림, 저작권 걱정 없음)
// - 올린 소리·음악: 오디오 파일을 미리 불러 두었다가 재생
// - 안내 문구: 기기의 음성 읽기 기능 사용

export const BUILTIN_SOUNDS = [
  { id: 'b:westminster', name: '학교종 (웨스트민스터)', desc: '딩동댕동 8음 · 7초' },
  { id: 'b:dingdong', name: '딩동', desc: '2음 차임 · 2초' },
  { id: 'b:up3', name: '안내 시작', desc: '올라가는 3음 · 2초' },
  { id: 'b:down3', name: '안내 끝', desc: '내려가는 3음 · 2초' },
  { id: 'b:handbell', name: '손종', desc: '땡땡땡 · 3초' },
  { id: 'b:marimba', name: '실로폰', desc: '밝은 6음 · 2초' },
  { id: 'b:buzzer', name: '부저', desc: '작업장용 · 2초' },
  { id: 'b:alarm', name: '경보음', desc: '비상용 사이렌 · 5초' }
];

export function isBuiltin(id) { return typeof id === 'string' && id.startsWith('b:'); }
export function builtinName(id) { const s = BUILTIN_SOUNDS.find(x => x.id === id); return s ? s.name : '기본 종'; }

const NOTE = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
function freq(n) { // 'E5', 'G#4'
  const mm = /^([A-G])(#|b)?(\d)$/.exec(n);
  const semi = NOTE[mm[1]] + (mm[2] === '#' ? 1 : mm[2] === 'b' ? -1 : 0) + (Number(mm[3]) - 4) * 12;
  return 440 * Math.pow(2, semi / 12);
}

let ctx = null;
let master = null;
export function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createDynamicsCompressor();
    master.connect(ctx.destination);
  }
  return ctx;
}

// 종 같은 소리 하나
function chime(dest, t0, f, dur, amp) {
  const c = ctx;
  const partials = [[1, 1], [2, 0.42], [3, 0.2], [4.2, 0.1], [5.4, 0.05]];
  for (const [ratio, a] of partials) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.value = f * ratio;
    const d = dur / Math.sqrt(ratio);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(amp * a, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(g); g.connect(dest);
    o.start(t0); o.stop(t0 + d + 0.05);
  }
}
// 금속 손종 (배음이 고르지 않은 소리)
function metal(dest, t0, f, dur, amp) {
  const c = ctx;
  for (const [ratio, a] of [[1, 1], [2.76, 0.5], [5.4, 0.25], [8.93, 0.12]]) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.value = f * ratio;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(amp * a, t0 + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur / ratio * 2);
    o.connect(g); g.connect(dest);
    o.start(t0); o.stop(t0 + dur * 2 + 0.05);
  }
}
function marimbaNote(dest, t0, f, amp) {
  const c = ctx;
  for (const [ratio, a, d] of [[1, 1, 0.9], [4, 0.25, 0.18], [10, 0.06, 0.05]]) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.value = f * ratio;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(amp * a, t0 + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(g); g.connect(dest);
    o.start(t0); o.stop(t0 + d + 0.05);
  }
}

function seq(dest, t0, notes, gap, dur, amp, last) {
  notes.forEach((n, i) => chime(dest, t0 + i * gap, freq(n), i === notes.length - 1 ? (last || dur) : dur, amp));
  return (notes.length - 1) * gap + (last || dur);
}

// 기본 종소리 재생 → { stop(), duration(초) }
export function playBuiltin(id, volume = 100) {
  const c = audioCtx();
  if (c.state === 'suspended') c.resume();
  const out = c.createGain();
  out.gain.value = Math.max(0, Math.min(1, volume / 100)) * 0.9;
  out.connect(master);
  const t0 = c.currentTime + 0.05;
  let dur = 2;
  switch (id) {
    case 'b:dingdong':
      dur = seq(out, t0, ['E5', 'C5'], 0.65, 1.8, 0.5, 2.4); break;
    case 'b:up3':
      dur = seq(out, t0, ['C5', 'E5', 'G5'], 0.32, 1.4, 0.4, 2.0); break;
    case 'b:down3':
      dur = seq(out, t0, ['G5', 'E5', 'C5'], 0.32, 1.4, 0.4, 2.0); break;
    case 'b:handbell':
      for (let i = 0; i < 9; i++) metal(out, t0 + i * 0.27, 1046.5, 0.7, 0.35);
      dur = 9 * 0.27 + 1.2; break;
    case 'b:marimba':
      ['C5', 'D5', 'E5', 'G5', 'A5', 'C6'].forEach((n, i) => marimbaNote(out, t0 + i * 0.15, freq(n), 0.45));
      dur = 6 * 0.15 + 1.0; break;
    case 'b:buzzer': {
      const o = c.createOscillator(); const o2 = c.createOscillator();
      const lp = c.createBiquadFilter(); const g = c.createGain();
      o.type = 'square'; o.frequency.value = 330; o2.type = 'square'; o2.frequency.value = 333;
      lp.type = 'lowpass'; lp.frequency.value = 1800;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
      g.gain.setValueAtTime(0.18, t0 + 1.9); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.0);
      o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(out);
      o.start(t0); o2.start(t0); o.stop(t0 + 2.05); o2.stop(t0 + 2.05);
      dur = 2.1; break;
    }
    case 'b:alarm': {
      const o = c.createOscillator(); const g = c.createGain();
      o.type = 'sawtooth';
      for (let i = 0; i < 5; i++) {
        o.frequency.setValueAtTime(600, t0 + i);
        o.frequency.linearRampToValueAtTime(1200, t0 + i + 0.5);
        o.frequency.linearRampToValueAtTime(600, t0 + i + 1);
      }
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.05);
      g.gain.setValueAtTime(0.12, t0 + 4.9); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 5);
      o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + 5.05);
      dur = 5.1; break;
    }
    case 'b:westminster':
    default:
      dur = seq(out, t0, ['E5', 'C5', 'D5', 'G4', 'G4', 'D5', 'E5', 'C5'], 0.62, 2.0, 0.45, 3.2);
  }
  return {
    duration: dur,
    stop() {
      try { out.gain.setTargetAtTime(0.0001, c.currentTime, 0.05); setTimeout(() => out.disconnect(), 400); } catch (e) { /* 무시 */ }
    }
  };
}

// ── 오디오 파일 ─────────────────────────────────────
const pool = new Map(); // url → HTMLAudioElement

export function preloadUrl(url) {
  if (!url) return null;
  let a = pool.get(url);
  if (!a) {
    a = new Audio();
    a.preload = 'auto';
    a.src = url;
    try { a.load(); } catch (e) { /* 무시 */ }
    pool.set(url, a);
  }
  return a;
}
export function forgetUnused(keepUrls) {
  for (const [url, a] of pool) if (!keepUrls.has(url)) { try { a.pause(); a.src = ''; } catch (e) { /* 무시 */ } pool.delete(url); }
}

function playUrl(url, volume = 100, maxSec = 0) {
  const a = preloadUrl(url);
  const base = Math.max(0, Math.min(1, volume / 100));
  let fadeTimer = null, stopTimer = null, stepTimer = null;
  let resolveEnd;
  const finished = new Promise(r => { resolveEnd = r; });
  const end = () => { clearTimeout(fadeTimer); clearTimeout(stopTimer); clearInterval(stepTimer); resolveEnd(); };
  a.onended = end;
  a.onerror = end;
  a.volume = base;
  try { a.currentTime = 0; } catch (e) { /* 무시 */ }
  const p = a.play();
  if (p && p.catch) p.catch(end);
  const fadeOut = () => {
    let v = a.volume;
    clearInterval(stepTimer);
    stepTimer = setInterval(() => {
      v -= base / 20;
      if (v <= 0.01) { clearInterval(stepTimer); a.pause(); end(); } else a.volume = v;
    }, 100);
  };
  if (maxSec > 0) {
    fadeTimer = setTimeout(fadeOut, Math.max(0, maxSec - 2) * 1000);
    stopTimer = setTimeout(() => { a.pause(); end(); }, (maxSec + 1) * 1000);
  }
  return { finished, stop() { fadeOut(); } };
}

// 안내 문구 읽기
export function speak(text, volume = 100) {
  return new Promise(resolve => {
    if (!text || !('speechSynthesis' in window)) return resolve();
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ko-KR';
      u.rate = 0.95;
      u.volume = Math.max(0, Math.min(1, volume / 100));
      const ko = speechSynthesis.getVoices().find(v => /ko/i.test(v.lang));
      if (ko) u.voice = ko;
      u.onend = resolve; u.onerror = resolve;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
      setTimeout(resolve, 20000);
    } catch (e) { resolve(); }
  });
}

// 브라우저가 소리를 낼 수 있도록 사용자가 누를 때 한 번 호출
export async function unlockAudio() {
  const c = audioCtx();
  try { await c.resume(); } catch (e) { /* 무시 */ }
  try {
    const b = c.createBuffer(1, 1, 22050);
    const s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0);
  } catch (e) { /* 무시 */ }
  for (const a of pool.values()) {
    try { a.muted = true; await a.play(); a.pause(); a.currentTime = 0; } catch (e) { /* 무시 */ } finally { a.muted = false; }
  }
  if ('speechSynthesis' in window) { try { speechSynthesis.getVoices(); } catch (e) { /* 무시 */ } }
  return c.state === 'running';
}
export function audioReady() { return !!ctx && ctx.state === 'running'; }

// ── 종 하나 재생 (소리 + 안내 문구) ─────────────────────────
let current = null;

// bell: { soundId, volume, maxSec, say }
// soundsById: { [id]: { url } } — 올린 소리
export function playBell(bell, soundsById = {}) {
  if (current) current.stop();
  const volume = bell.volume == null ? 100 : bell.volume;
  let stopped = false;
  let inner = null;
  const run = (async () => {
    const id = bell.soundId || 'b:westminster';
    if (isBuiltin(id)) {
      inner = playBuiltin(id, volume);
      await new Promise(r => setTimeout(r, inner.duration * 1000));
    } else {
      const s = soundsById[id];
      if (s && s.url) {
        inner = playUrl(s.url, volume, bell.maxSec || 0);
        await inner.finished;
      } else {
        // 파일을 찾을 수 없으면 기본 종으로 대신 울림
        inner = playBuiltin('b:westminster', volume);
        await new Promise(r => setTimeout(r, inner.duration * 1000));
      }
    }
    if (!stopped && bell.say) await speak(bell.say, volume);
  })();
  const ctl = {
    finished: run,
    stop() {
      stopped = true;
      if (inner) inner.stop();
      if ('speechSynthesis' in window) { try { speechSynthesis.cancel(); } catch (e) { /* 무시 */ } }
    }
  };
  current = ctl;
  run.finally(() => { if (current === ctl) current = null; });
  return ctl;
}
export function stopAll() { if (current) current.stop(); }

// 업로드 전에 파일 길이 알아내기
export function fileDuration(file) {
  return new Promise(resolve => {
    const a = new Audio();
    const url = URL.createObjectURL(file);
    a.preload = 'metadata';
    a.onloadedmetadata = () => { const d = a.duration; URL.revokeObjectURL(url); resolve(Number.isFinite(d) ? d : 0); };
    a.onerror = () => { URL.revokeObjectURL(url); resolve(0); };
    a.src = url;
  });
}
