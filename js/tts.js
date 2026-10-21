// Google 고음질 안내 음성 (Cloud Text-to-Speech)
// 매달 Chirp 3 HD 100만 자, WaveNet 400만 자까지 무료예요. 안내 문구는 한 번 만들어 파일로 저장해 두고
// 계속 다시 쓰기 때문에, 보통 학교·학원은 무료 한도의 1%도 쓰지 않아요.
import { TTS_API_KEY } from './tts-config.js';

export const ttsAvailable = () => !!(TTS_API_KEY && TTS_API_KEY.length > 20);

const F = '여성', M = '남성';
export const GOOGLE_VOICES = [
  // Chirp 3 HD — 가장 자연스러운 목소리
  ...[['Aoede', F], ['Kore', F], ['Leda', F], ['Zephyr', F], ['Callirrhoe', F], ['Despina', F], ['Erinome', F], ['Laomedeia', F],
      ['Achernar', F], ['Autonoe', F], ['Gacrux', F], ['Pulcherrima', F], ['Sulafat', F], ['Vindemiatrix', F]]
    .map(([n, g], i) => ({ id: `ko-KR-Chirp3-HD-${n}`, label: `${g} ${i + 1} · ${n}`, gender: g, tier: 'HD' })),
  ...[['Charon', M], ['Puck', M], ['Fenrir', M], ['Orus', M], ['Achird', M], ['Algenib', M], ['Algieba', M], ['Alnilam', M],
      ['Enceladus', M], ['Iapetus', M], ['Rasalgethi', M], ['Sadachbia', M], ['Sadaltager', M], ['Schedar', M], ['Umbriel', M], ['Zubenelgenubi', M]]
    .map(([n, g], i) => ({ id: `ko-KR-Chirp3-HD-${n}`, label: `${g} ${i + 1} · ${n}`, gender: g, tier: 'HD' })),
  // WaveNet — 또렷한 안내 방송 느낌
  { id: 'ko-KR-Wavenet-A', label: '여성 · WaveNet A', gender: F, tier: 'WaveNet' },
  { id: 'ko-KR-Wavenet-B', label: '여성 · WaveNet B', gender: F, tier: 'WaveNet' },
  { id: 'ko-KR-Wavenet-C', label: '남성 · WaveNet C', gender: M, tier: 'WaveNet' },
  { id: 'ko-KR-Wavenet-D', label: '남성 · WaveNet D', gender: M, tier: 'WaveNet' }
];
export const DEFAULT_VOICE = 'ko-KR-Chirp3-HD-Aoede';
export function voiceLabel(id) { const v = GOOGLE_VOICES.find(x => x.id === id); return v ? v.label : id; }

// 문구 → MP3 데이터
export async function synthesize(text, voice, rate = 1) {
  if (!ttsAvailable()) throw new Error('tts-key');
  const body = {
    input: { text: String(text).slice(0, 200) },
    voice: { languageCode: 'ko-KR', name: voice || DEFAULT_VOICE },
    audioConfig: { audioEncoding: 'MP3', speakingRate: Math.max(0.5, Math.min(1.6, Number(rate) || 1)), sampleRateHertz: 24000 }
  };
  const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(TTS_API_KEY)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  if (!res.ok) {
    let msg = '';
    try { msg = (await res.json()).error.message; } catch (e) { /* 무시 */ }
    const err = new Error('tts-http-' + res.status + ' ' + msg);
    err.status = res.status;
    throw err;
  }
  const j = await res.json();
  const bin = atob(j.audioContent);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// 같은 문구·목소리·속도면 같은 이름 → 한 번만 만들고 계속 다시 씀
export async function ttsKey(text, voice, rate) {
  const data = new TextEncoder().encode(`${voice}|${Number(rate || 1).toFixed(2)}|${text}`);
  const h = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(h)].slice(0, 10).map(b => b.toString(16).padStart(2, '0')).join('');
}
