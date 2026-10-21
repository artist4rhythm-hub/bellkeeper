// 벨키퍼 소리 재생
// - 기본 종소리 43종: 벨키퍼가 직접 합성해 만든 소리라 저작권 걱정 없이 무료로 써요.
//   멜로디는 저작권이 끝난 곡(공개 저작물)만 썼어요. 파일은 sounds/ 폴더에 있고, 인터넷이 끊겨도 울려요.
// - 올린 소리·음악: 오디오 파일을 미리 불러 두었다가 재생
// - 안내 문구: Google 고음질 음성으로 만든 파일, 또는 기기에 들어 있는 음성

export const SOUND_CATS = [
  { id: 'chime', label: '학교종·차임' },
  { id: 'bell', label: '종' },
  { id: 'melody', label: '멜로디' },
  { id: 'ring', label: '알림·벨소리' },
  { id: 'alert', label: '경보·작업장' },
  { id: 'calm', label: '명상·쉼' }
];

export const BUILTIN_SOUNDS = [
  { id: "b:westminster", name: "웨스트민스터 차임", cat: 'chime', desc: "딩동댕동 8음 · 학교종의 대표", sec: 12.1 },
  { id: "b:westminster4", name: "웨스트민스터 짧게", cat: 'chime', desc: "4음", sec: 9.8 },
  { id: "b:westminster16", name: "웨스트민스터 정시", cat: 'chime', desc: "시계탑 정시 멜로디 · 길게", sec: 19.1 },
  { id: "b:dingdong", name: "딩동", cat: 'chime', desc: "부드러운 2음", sec: 6.8 },
  { id: "b:up3", name: "안내 시작", cat: 'chime', desc: "올라가는 3음", sec: 6.8 },
  { id: "b:down3", name: "안내 끝", cat: 'chime', desc: "내려가는 3음", sec: 6.8 },
  { id: "b:airport", name: "공항 안내 차임", cat: 'chime', desc: "맑은 4음 상승", sec: 7.4 },
  { id: "b:airport_end", name: "공항 안내 끝", cat: 'chime', desc: "맑은 4음 하강", sec: 7.5 },
  { id: "b:vibes4", name: "비브라폰 차임", cat: 'chime', desc: "부드럽게 떨리는 4음", sec: 6.2 },
  { id: "b:glock_up", name: "글로켄 반짝", cat: 'chime', desc: "밝게 올라가는 5음", sec: 4.7 },
  { id: "b:church", name: "교회 종", cat: 'bell', desc: "큰 종 세 번", sec: 15.9 },
  { id: "b:church2", name: "교회 종 두 음", cat: 'bell', desc: "높고 낮은 두 종", sec: 15.1 },
  { id: "b:temple", name: "범종", cat: 'bell', desc: "낮고 깊은 울림 · 14초", sec: 15.2 },
  { id: "b:handbell", name: "손종 흔들기", cat: 'bell', desc: "땡그랑땡그랑 · 교실 종", sec: 6.3 },
  { id: "b:handbell3", name: "핸드벨 3음", cat: 'bell', desc: "솔미도", sec: 5.8 },
  { id: "b:desk", name: "호텔 데스크 벨", cat: 'bell', desc: "띵 · 짧게", sec: 5.1 },
  { id: "b:desk2", name: "데스크 벨 두 번", cat: 'bell', desc: "띵띵", sec: 4.7 },
  { id: "b:bicycle", name: "자전거 벨", cat: 'bell', desc: "띠링띠링", sec: 2.0 },
  { id: "b:windchime", name: "풍경", cat: 'bell', desc: "바람에 흔들리는 맑은 소리", sec: 10.0 },
  { id: "b:triangle", name: "트라이앵글", cat: 'bell', desc: "챙", sec: 6.1 },
  { id: "b:elise_box", name: "엘리제를 위하여 (오르골)", cat: 'melody', desc: "베토벤 · 공개 저작물", sec: 7.5 },
  { id: "b:elise_marimba", name: "엘리제를 위하여 (마림바)", cat: 'melody', desc: "베토벤 · 공개 저작물", sec: 6.3 },
  { id: "b:joy", name: "환희의 송가", cat: 'melody', desc: "베토벤 · 비브라폰", sec: 9.3 },
  { id: "b:twinkle", name: "반짝반짝 작은별", cat: 'melody', desc: "전래 동요 · 오르골", sec: 7.1 },
  { id: "b:brahms", name: "브람스 자장가", cat: 'melody', desc: "오르골 · 하교·취침용", sec: 7.6 },
  { id: "b:minuet", name: "미뉴에트 G장조", cat: 'melody', desc: "페촐트 · 마림바", sec: 6.3 },
  { id: "b:canon", name: "캐논", cat: 'melody', desc: "파헬벨 · 글로켄슈필", sec: 7.7 },
  { id: "b:fanfare", name: "시작 팡파르", cat: 'melody', desc: "짧고 힘차게 · 마림바", sec: 3.3 },
  { id: "b:phone", name: "옛날 전화벨", cat: 'ring', desc: "따르르릉 두 번", sec: 3.5 },
  { id: "b:alarmclock", name: "자명종", cat: 'ring', desc: "따르르르릉", sec: 3.5 },
  { id: "b:digital", name: "디지털 알람", cat: 'ring', desc: "삐삐삐삐 세 번", sec: 2.8 },
  { id: "b:notify_soft", name: "부드러운 알림", cat: 'ring', desc: "톡톡", sec: 2.4 },
  { id: "b:notify_bright", name: "밝은 알림", cat: 'ring', desc: "반짝 3음", sec: 4.3 },
  { id: "b:correct", name: "정답", cat: 'ring', desc: "딩동댕", sec: 2.6 },
  { id: "b:chord", name: "화음 한 번", cat: 'ring', desc: "도미솔 함께", sec: 5.5 },
  { id: "b:woodblock", name: "목탁", cat: 'ring', desc: "톡 톡 톡", sec: 1.8 },
  { id: "b:buzzer", name: "부저", cat: 'alert', desc: "작업장 시작·종료 · 2초", sec: 2.7 },
  { id: "b:whistle", name: "호루라기", cat: 'alert', desc: "삐익 두 번 · 체육 시간", sec: 4.2 },
  { id: "b:siren", name: "사이렌", cat: 'alert', desc: "비상 대피 훈련용 · 5초", sec: 5.7 },
  { id: "b:warning", name: "주의 알림", cat: 'alert', desc: "삐-뽀 세 번", sec: 4.1 },
  { id: "b:bowl", name: "싱잉볼", cat: 'calm', desc: "길고 맑은 울림 · 12초", sec: 12.4 },
  { id: "b:gong", name: "징", cat: 'calm', desc: "둥- 깊게 퍼지는 소리", sec: 11.1 },
  { id: "b:bowl2", name: "싱잉볼 두 번", cat: 'calm', desc: "쉬는 시간·명상", sec: 11.1 }
];

// 예전 이름 → 새 이름
const ALIAS = { 'b:marimba': 'b:glock_up', 'b:alarm': 'b:siren' };
export function resolveBuiltin(id) { return ALIAS[id] || id; }
export function isBuiltin(id) { return typeof id === 'string' && id.startsWith('b:'); }
export function builtinInfo(id) { return BUILTIN_SOUNDS.find(x => x.id === resolveBuiltin(id)); }
export function builtinName(id) { const s = builtinInfo(id); return s ? s.name : '기본 종'; }
export function builtinUrl(id) {
  const s = builtinInfo(id) || BUILTIN_SOUNDS[0];
  return new URL('sounds/' + s.id.slice(2) + '.mp3', document.baseURI).href;
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

// ── 기본 종소리 (미리 풀어 둔 소리 데이터로 정확하게 재생) ──────────
const bufCache = new Map();
function decode(ab) {
  return new Promise((res, rej) => {
    try {
      const p = audioCtx().decodeAudioData(ab, res, rej);
      if (p && p.then) p.then(res, rej);
    } catch (e) { rej(e); }
  });
}
export function loadBuiltin(id) {
  const key = resolveBuiltin(id);
  if (!bufCache.has(key)) {
    const p = fetch(builtinUrl(key)).then(r => { if (!r.ok) throw new Error('sound ' + r.status); return r.arrayBuffer(); }).then(decode);
    p.catch(() => bufCache.delete(key));
    bufCache.set(key, p);
  }
  return bufCache.get(key);
}
export function preloadBuiltins(ids) { for (const id of ids) if (isBuiltin(id)) loadBuiltin(id).catch(() => {}); }

async function playBuiltin(id, volume = 100, maxSec = 0) {
  const c = audioCtx();
  if (c.state === 'suspended') { try { await c.resume(); } catch (e) { /* 무시 */ } }
  let buffer;
  try { buffer = await loadBuiltin(id); } catch (e) {
    // 소리 데이터를 못 풀면 파일을 그대로 재생
    return playUrl(builtinUrl(id), volume, maxSec);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const g = c.createGain();
  const v = Math.max(0, Math.min(1, volume / 100));
  g.gain.value = v;
  src.connect(g); g.connect(master);
  const t0 = c.currentTime + 0.02;
  src.start(t0);
  let dur = buffer.duration;
  if (maxSec > 0 && maxSec < dur) {
    const fade = Math.min(2, maxSec / 3);
    g.gain.setValueAtTime(v, t0 + maxSec - fade);
    g.gain.linearRampToValueAtTime(0.0001, t0 + maxSec);
    src.stop(t0 + maxSec + 0.05);
    dur = maxSec;
  }
  let resolveEnd;
  const finished = new Promise(r => { resolveEnd = r; });
  src.onended = () => resolveEnd();
  setTimeout(resolveEnd, (dur + 0.5) * 1000);
  return {
    finished,
    stop() {
      try { g.gain.cancelScheduledValues(c.currentTime); g.gain.setTargetAtTime(0.0001, c.currentTime, 0.08); src.stop(c.currentTime + 0.4); } catch (e) { /* 무시 */ }
      setTimeout(resolveEnd, 450);
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

// ── 기기 음성 (설정 없이 무료) ─────────────────────────
const LS_VOICE = 'bk.voice';
const LS_RATE = 'bk.voiceRate';
export function deviceVoices() {
  if (!('speechSynthesis' in window)) return [];
  return speechSynthesis.getVoices().filter(v => /^ko/i.test(v.lang));
}
export function getDeviceVoicePref() {
  try { return { uri: localStorage.getItem(LS_VOICE) || '', rate: Number(localStorage.getItem(LS_RATE)) || 1 }; } catch (e) { return { uri: '', rate: 1 }; }
}
export function setDeviceVoicePref(uri, rate) {
  try { localStorage.setItem(LS_VOICE, uri || ''); localStorage.setItem(LS_RATE, String(rate || 1)); } catch (e) { /* 무시 */ }
}
export function speak(text, volume = 100, opts = {}) {
  return new Promise(resolve => {
    if (!text || !('speechSynthesis' in window)) return resolve();
    try {
      const pref = getDeviceVoicePref();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ko-KR';
      u.rate = opts.rate || pref.rate || 1;
      u.volume = Math.max(0, Math.min(1, volume / 100));
      const vs = deviceVoices();
      const v = vs.find(x => x.voiceURI === (opts.uri || pref.uri)) || vs[0];
      if (v) u.voice = v;
      u.onend = resolve; u.onerror = resolve;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
      setTimeout(resolve, 30000);
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

// ── 종 하나 재생 (소리 + 안내) ─────────────────────────
let current = null;

// bell: { soundId, volume, maxSec, say, sayId }
// soundsById: { [id]: { url } } — 올린 소리·만든 안내 음성
export function playBell(bell, soundsById = {}) {
  if (current) current.stop();
  const volume = bell.volume == null ? 100 : bell.volume;
  let stopped = false;
  let inner = null;
  const run = (async () => {
    const id = bell.soundId || 'b:westminster';
    if (id !== 'none') {
      if (isBuiltin(id)) inner = await playBuiltin(id, volume, bell.maxSec || 0);
      else if (soundsById[id] && soundsById[id].url) inner = playUrl(soundsById[id].url, volume, bell.maxSec || 0);
      else inner = await playBuiltin('b:westminster', volume);   // 파일을 찾을 수 없으면 기본 종으로
      if (stopped) inner.stop();
      await inner.finished;
    }
    if (stopped) return;
    const tts = bell.sayId && soundsById[bell.sayId];
    if (tts && tts.url) {
      inner = playUrl(tts.url, Math.min(100, volume + 10));
      await inner.finished;
    } else if (bell.say) {
      await speak(bell.say, volume);
    }
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
    let url = '';
    try { url = URL.createObjectURL(file); } catch (e) { return resolve(0); }
    a.preload = 'metadata';
    a.onloadedmetadata = () => { const d = a.duration; URL.revokeObjectURL(url); resolve(Number.isFinite(d) ? d : 0); };
    a.onerror = () => { URL.revokeObjectURL(url); resolve(0); };
    a.src = url;
  });
}
