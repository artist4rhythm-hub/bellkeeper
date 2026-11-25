// 벨키퍼 RTA — 지금 나오는 소리를 1/3 옥타브 막대로 보여 줘요 (재생기·관리자 공용)
import { getAnalyser, isSpeaking, isPlaying } from './sounds.js';

// 1/3 옥타브 중심 주파수 (40Hz ~ 16kHz)
const BANDS = [40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000];
const LABELS = { 63: '63', 250: '250', 1000: '1k', 4000: '4k', 16000: '16k' };

export function createRTA(canvas, opts = {}) {
  const o = Object.assign({ labels: true, segments: 14, fps: 30, gold: '#E0B25A', hot: '#F6E3B4', dim: 'rgba(244,245,242,0.07)', grid: 'rgba(244,245,242,0.10)', text: 'rgba(244,245,242,0.45)' }, opts);
  let g = null;
  try { g = canvas && canvas.getContext && canvas.getContext('2d', { alpha: true, desynchronized: true }); } catch (e) { g = null; }
  if (!g) return { start() {}, stop() {}, kill() {} };   // 그림을 못 그리는 환경이면 조용히 넘어감
  const level = new Float32Array(BANDS.length);
  const peak = new Float32Array(BANDS.length);
  const peakHold = new Float32Array(BANDS.length);
  // v1.19: 가볍게 — 바탕(눈금·꺼진 칸·글자)과 켜진 칸 모양은 미리 한 번만 그려 두고, 매번은 잘라 붙이기만 해요
  let raf = 0, last = 0, lastDraw = 0, frame = 0, data = null, bins = null, binsFor = null, running = false, quietSince = 0;
  let W = 0, H = 0, DPR = 1, bg = null, litCol = null, geo = null;
  const minGap = 1000 / Math.max(5, Math.min(60, o.fps));

  function layout() {
    const r = canvas.getBoundingClientRect();
    DPR = Math.min(1.5, window.devicePixelRatio || 1);
    const w = Math.max(10, Math.round(r.width * DPR)), h = Math.max(10, Math.round(r.height * DPR));
    if (w === W && h === H && bg) return;
    W = w; H = h; canvas.width = w; canvas.height = h;
    const padB = o.labels ? 14 * DPR : 2 * DPR, ch = h - padB, n = BANDS.length;
    const gap = Math.max(2, Math.round(w / n * 0.22)), bw = (w - gap * (n - 1)) / n;
    const segs = o.segments, sg = Math.max(1, Math.round(1.5 * DPR)), sh = (ch - sg * (segs - 1)) / segs;
    geo = { ch, gap, bw, segs, sg, sh, n };
    bg = document.createElement('canvas'); bg.width = w; bg.height = h;
    const b = bg.getContext('2d');
    b.fillStyle = o.grid;
    for (const f of [0.25, 0.5, 0.75]) b.fillRect(0, Math.round(ch * f), w, Math.max(1, DPR * 0.5));
    b.fillStyle = o.dim;
    for (let i = 0; i < n; i++) { const x = i * (bw + gap); for (let k = 0; k < segs; k++) b.fillRect(x, ch - (k + 1) * sh - k * sg, bw, sh); }
    if (o.labels) {
      b.fillStyle = o.text; b.font = `${10 * DPR}px system-ui, sans-serif`; b.textAlign = 'center';
      for (let i = 0; i < n; i++) { const t = LABELS[BANDS[i]]; if (!t) continue; const x = i * (bw + gap), tw = b.measureText(t).width; b.fillText(t, Math.min(w - tw / 2 - DPR, Math.max(tw / 2, x + bw / 2)), h - 2 * DPR); }
    }
    // 켜진 칸 한 줄(아래에서 위로 금색 → 밝은색)
    litCol = document.createElement('canvas'); litCol.width = Math.max(1, Math.ceil(bw)); litCol.height = Math.ceil(ch);
    const L = litCol.getContext('2d');
    for (let k = 0; k < segs; k++) { const t = k / (segs - 1); L.fillStyle = t > 0.82 ? o.hot : o.gold; L.globalAlpha = 0.55 + 0.45 * t; L.fillRect(0, ch - (k + 1) * sh - k * sg, litCol.width, sh); }
  }

  function read(dt) {
    const an = getAnalyser();
    const target = new Float32Array(BANDS.length);
    let any = false;
    if (an) {
      if (!data || data.length !== an.frequencyBinCount) data = new Uint8Array(an.frequencyBinCount);
      if (binsFor !== an) {   // 막대마다 볼 칸 범위는 한 번만 계산
        const sr = (an.context && an.context.sampleRate) || 48000, binHz = sr / an.fftSize;
        bins = BANDS.map(fc => [Math.max(1, Math.floor(fc / Math.pow(2, 1 / 6) / binHz)), Math.min(data.length - 1, Math.ceil(fc * Math.pow(2, 1 / 6) / binHz))]);
        binsFor = an;
      }
      an.getByteFrequencyData(data);   // 0~255 (= -95dB ~ -25dB)
      for (let i = 0; i < BANDS.length; i++) {
        const [lo, hi] = bins[i]; let m = 0;
        for (let k = lo; k <= hi; k++) if (data[k] > m) m = data[k];
        const v = m / 255;
        target[i] = v; if (v > 0.04) any = true;
      }
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
    raf = 0;
    if (now - lastDraw < minGap - 2) { raf = requestAnimationFrame(draw); return; }   // 초당 30번까지만
    const dt = Math.min(0.1, last ? (now - last) / 1000 : 0.033); last = now; lastDraw = now;
    if (frame++ % 30 === 0) layout();   // 크기는 가끔만 확인
    const any = read(dt);
    const { ch, gap, bw, segs, sg, sh, n } = geo;
    g.clearRect(0, 0, W, H);
    g.drawImage(bg, 0, 0);
    g.fillStyle = o.hot;
    for (let i = 0; i < n; i++) {
      const x = i * (bw + gap), lit = Math.round(level[i] * segs);
      if (lit > 0) { const top = ch - lit * sh - (lit - 1) * sg; g.drawImage(litCol, 0, top, litCol.width, ch - top, x, top, bw, ch - top); }
      if (peak[i] > 0.03) g.fillRect(x, Math.max(0, ch - peak[i] * ch - DPR), bw, Math.max(1.5, 2 * DPR));
    }
    // 소리가 끝나고 막대가 다 내려오면 잠시 쉼
    if (any || isPlaying()) quietSince = now;
    if (running || now - quietSince < 1500) raf = requestAnimationFrame(draw);
  }

  return {
    start() { running = true; quietSince = performance.now(); if (!raf) { last = 0; lastDraw = 0; frame = 0; raf = requestAnimationFrame(draw); } },
    stop() { running = false; },
    kill() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
  };
}
