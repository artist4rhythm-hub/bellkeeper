// 벨키퍼 RTA — 지금 나오는 소리를 1/3 옥타브 막대로 보여 줘요 (재생기·관리자 공용)
import { getAnalyser, isSpeaking, isPlaying } from './sounds.js';

// 1/3 옥타브 중심 주파수 (40Hz ~ 16kHz)
const BANDS = [40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000];
const LABELS = { 63: '63', 250: '250', 1000: '1k', 4000: '4k', 16000: '16k' };

export function createRTA(canvas, opts = {}) {
  const o = Object.assign({ labels: true, segments: 14, gold: '#E0B25A', hot: '#F6E3B4', dim: 'rgba(244,245,242,0.07)', grid: 'rgba(244,245,242,0.10)', text: 'rgba(244,245,242,0.45)' }, opts);
  let g = null;
  try { g = canvas && canvas.getContext && canvas.getContext('2d'); } catch (e) { g = null; }
  if (!g) return { start() {}, stop() {}, kill() {} };   // 그림을 못 그리는 환경이면 조용히 넘어감
  const level = new Float32Array(BANDS.length);
  const peak = new Float32Array(BANDS.length);
  const peakHold = new Float32Array(BANDS.length);
  let raf = 0, last = 0, data = null, running = false, quietSince = 0;

  function size() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(10, Math.round(r.width * dpr)), h = Math.max(10, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    return { w, h, dpr };
  }

  function read(dt) {
    const an = getAnalyser();
    const target = new Float32Array(BANDS.length);
    let any = false;
    if (an) {
      if (!data || data.length !== an.frequencyBinCount) data = new Float32Array(an.frequencyBinCount);
      an.getFloatFrequencyData(data);
      const sr = (an.context && an.context.sampleRate) || 48000, binHz = sr / an.fftSize;
      BANDS.forEach((fc, i) => {
        const lo = fc / Math.pow(2, 1 / 6), hi = fc * Math.pow(2, 1 / 6);
        let s = 0, n = 0;
        for (let k = Math.max(1, Math.floor(lo / binHz)); k <= Math.min(data.length - 1, Math.ceil(hi / binHz)); k++) { s += Math.pow(10, data[k] / 10); n++; }
        const db = n ? 10 * Math.log10(s / n + 1e-12) : -120;
        const v = Math.max(0, Math.min(1, (db + 95) / 70));   // -95dB → 0, -25dB → 1
        target[i] = v;
        if (v > 0.04) any = true;
      });
    }
    // 기기 음성(브라우저 읽기)은 분석할 수 없어 목소리 대역을 부드럽게 표시
    if (!any && isSpeaking()) {
      const t = performance.now() / 1000;
      BANDS.forEach((fc, i) => {
        const voice = Math.exp(-Math.pow(Math.log2(fc / 700), 2) / 1.6);
        const wob = 0.55 + 0.45 * Math.sin(t * (6 + i * 0.7) + i * 1.9) * Math.sin(t * 2.3 + i);
        target[i] = Math.max(0, voice * (0.35 + 0.45 * wob));
      });
      any = true;
    }
    for (let i = 0; i < BANDS.length; i++) {
      const up = target[i] > level[i];
      level[i] += (target[i] - level[i]) * Math.min(1, dt * (up ? 28 : 7));
      if (level[i] >= peak[i]) { peak[i] = level[i]; peakHold[i] = 0.5; }
      else if ((peakHold[i] -= dt) <= 0) peak[i] = Math.max(level[i], peak[i] - dt * 0.55);
    }
    return any;
  }

  function draw(now) {
    const dt = Math.min(0.1, last ? (now - last) / 1000 : 0.016); last = now;
    const any = read(dt);
    const { w, h, dpr } = size();
    g.clearRect(0, 0, w, h);
    const padB = o.labels ? 14 * dpr : 2 * dpr;
    const ch = h - padB;
    const n = BANDS.length, gap = Math.max(2, Math.round(w / n * 0.22));
    const bw = (w - gap * (n - 1)) / n;
    const segs = o.segments, sg = Math.max(1, Math.round(1.5 * dpr)), sh = (ch - sg * (segs - 1)) / segs;
    // 눈금선
    g.fillStyle = o.grid;
    for (const f of [0.25, 0.5, 0.75]) g.fillRect(0, Math.round(ch * f), w, Math.max(1, dpr * 0.5));
    for (let i = 0; i < n; i++) {
      const x = i * (bw + gap);
      const lit = Math.round(level[i] * segs);
      for (let s = 0; s < segs; s++) {
        const y = ch - (s + 1) * sh - s * sg;
        if (s < lit) {
          const t = s / (segs - 1);
          g.fillStyle = t > 0.82 ? o.hot : o.gold;
          g.globalAlpha = 0.55 + 0.45 * t;
        } else { g.fillStyle = o.dim; g.globalAlpha = 1; }
        g.fillRect(x, y, bw, sh);
      }
      g.globalAlpha = 1;
      if (peak[i] > 0.03) {
        const py = ch - peak[i] * ch;
        g.fillStyle = o.hot;
        g.fillRect(x, Math.max(0, py - dpr), bw, Math.max(1.5, 2 * dpr));
      }
      if (o.labels && LABELS[BANDS[i]]) {
        g.fillStyle = o.text;
        g.font = `${10 * dpr}px system-ui, sans-serif`;
        g.textAlign = 'center';
        const tw = g.measureText(LABELS[BANDS[i]]).width;
        g.fillText(LABELS[BANDS[i]], Math.min(w - tw / 2 - dpr, Math.max(tw / 2, x + bw / 2)), h - 2 * dpr);
      }
    }
    // 소리가 끝나고 막대가 다 내려오면 잠시 쉼
    if (any || isPlaying()) quietSince = now;
    if (running || now - quietSince < 1500) raf = requestAnimationFrame(draw);
    else raf = 0;
  }

  return {
    start() { running = true; quietSince = performance.now(); if (!raf) { last = 0; raf = requestAnimationFrame(draw); } },
    stop() { running = false; },
    kill() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
  };
}
