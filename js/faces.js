// 벨키퍼 재생기 시계 모양 — 아날로그 시계판 · 수묵화 · 디지털 · 한글 시계 (모두 직접 그린 그림)
const SERIF = "'Noto Serif KR', 'Noto Serif CJK KR', serif";
const SANS = "'Noto Sans KR', 'Noto Sans CJK KR', sans-serif";

export function makeRng(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
const pt = (cx, cy, r, a) => [+(cx + r * Math.sin(a)).toFixed(2), +(cy - r * Math.cos(a)).toFixed(2)];
const ROMAN = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
const ZODIAC = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const KIDS = ['#F2A7A0', '#F6C48F', '#F5E08E', '#C6E3A0', '#A8DCC4', '#9FD3E8', '#A9C1EE', '#C1AEEA', '#E3AEDD', '#F2A7C3', '#F4B9A0', '#E9D3A0'];

export const CLOCK_DEFS = `<defs>
  <filter id="bkGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="bkChalk"><feTurbulence type="fractalNoise" baseFrequency="1.8" numOctaves="2" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2"/></filter>
  <filter id="bkMarble" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.024 0.06" numOctaves="5" seed="4"/><feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.56  0 0 0 0 0.6  0 0 0 -2.2 1.35"/></filter>
  <filter id="bkWood" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.008 0.24" numOctaves="3" seed="2"/><feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.2  0 0 0 0 0.1  0 0 0 0.9 -0.2"/></filter>
  <clipPath id="bkFace"><circle cx="100" cy="100" r="90.2"/></clipPath>
</defs>`;

// ── 아날로그 시계판 ─────────────────────────────
const deco = {
  wood: () => { let s = '<rect x="0" y="0" width="200" height="200" filter="url(#bkWood)" opacity=".55"/>'; for (let i = 1; i < 9; i++) s += `<ellipse cx="72" cy="114" rx="${i * 11.7}" ry="${i * 8.1}" fill="none" stroke="#7A4E2A" stroke-opacity=".25" stroke-width="1.2"/>`; return s; },
  marble: () => '<rect x="0" y="0" width="200" height="200" filter="url(#bkMarble)"/>',
  zodiac: () => { const r = makeRng(5); let s = ''; for (let i = 0; i < 60; i++) s += `<circle cx="${(100 + (r() * 2 - 1) * 72).toFixed(1)}" cy="${(100 + (r() * 2 - 1) * 72).toFixed(1)}" r="${(0.4 + r()).toFixed(2)}" fill="#fff" opacity="${(0.3 + r() * 0.6).toFixed(2)}"/>`; return s + '<circle cx="100" cy="100" r="52" fill="none" stroke="#B8913F" stroke-opacity=".5"/>'; },
  chalk: () => '<circle cx="100" cy="100" r="90" fill="#fff" opacity=".04" filter="url(#bkChalk)"/>',
  kids: () => { let s = ''; for (let i = 0; i < 12; i++) { const a0 = (i - 0.5) * Math.PI / 6, a1 = (i + 0.5) * Math.PI / 6; const [x0, y0] = pt(100, 100, 91, a0), [x1, y1] = pt(100, 100, 91, a1); s += `<path d="M100 100 L${x0} ${y0} A91 91 0 0 1 ${x1} ${y1} Z" fill="${KIDS[i]}"/>`; } return s + '<circle cx="100" cy="100" r="58" fill="#FFFDF8"/>'; },
  guilloche: () => { let s = ''; for (let i = 0; i < 36; i++) s += `<circle cx="${(100 + 14 * Math.sin(i * Math.PI / 18)).toFixed(1)}" cy="${(100 - 14 * Math.cos(i * Math.PI / 18)).toFixed(1)}" r="40" fill="none" stroke="#9AA6B8" stroke-opacity=".35" stroke-width=".5"/>`; return s + '<circle cx="100" cy="100" r="62" fill="none" stroke="#9AA6B8" stroke-opacity=".5" stroke-width=".6"/>'; },
  sector: () => '<circle cx="100" cy="100" r="90" fill="#E9E4D6"/><circle cx="100" cy="100" r="72" fill="#F6F2E8"/><circle cx="100" cy="100" r="40" fill="#E9E4D6"/><circle cx="100" cy="100" r="72" fill="none" stroke="#1C1C1C" stroke-width=".6"/><circle cx="100" cy="100" r="40" fill="none" stroke="#1C1C1C" stroke-width=".6"/>',
  h24: () => { let s = ''; for (let i = 1; i <= 12; i++) { const [x, y] = pt(100, 100, 46, i * Math.PI / 6); s += `<text x="${x}" y="${y}" dy="0.36em" text-anchor="middle" font-family="${SANS}" font-size="7.5" font-weight="700" fill="#C8352A">${i + 12}</text>`; } return s; },
  obang: () => { const cols = ['#1F4E9C', '#C8352A', '#F2B134', '#F7F3EA', '#1E1E1C']; let s = ''; for (let i = 0; i < 5; i++) { const a0 = i * 2 * Math.PI / 5, a1 = a0 + 2 * Math.PI / 5; const [o0x, o0y] = pt(100, 100, 91, a0), [o1x, o1y] = pt(100, 100, 91, a1), [i1x, i1y] = pt(100, 100, 72, a1), [i0x, i0y] = pt(100, 100, 72, a0); s += `<path d="M${o0x} ${o0y} A91 91 0 0 1 ${o1x} ${o1y} L${i1x} ${i1y} A72 72 0 0 0 ${i0x} ${i0y} Z" fill="${cols[i]}" stroke="#1E1E1C" stroke-width=".8"/>`; } return s; }
};
// 시계판 설정값 (모두 200×200 안에서 그림)
export const DIAL_PRESETS = {
  classic: { face: '#FFFDF8', rim: '#17231F', tick: '#17231F', hand: '#17231F', sec: '#C9822B', num: 'arabic', label: 'BELLKEEPER' },
  school: { face: '#FFFFFF', rim: '#17231F', tick: '#17231F', hand: '#17231F', sec: '#D0403A', num: 'arabic', numR: 0.6, numSize: 17, minuteNums: true, secCenter: true },
  roman: { face: '#FFFDF8', rim: '#17231F', tick: '#17231F', hand: '#17231F', sec: '#C9822B', num: 'roman', font: SERIF, numSize: 14, numR: 0.68 },
  minimal: { face: '#FFFDF8', rim: '#17231F', tick: '#17231F', ticks: 'hours', bigW: 5, longBig: 0.72, cap: 'butt', hand: '#17231F', sec: '#C9822B', num: 'none' },
  kids: { face: '#FFFDF8', rim: '#F6C48F', deco: 'kids', tick: '#3B3B3B', ticks: 'hours', hand: '#3C7DBF', mHand: '#C0567F', hW: 9, mW: 6, sec: '#2F8F5B', num: 'arabic', numR: 0.78, numSize: 17, font: "'Jua', " + SANS },
  gold: { face: '#14201B', rim: '#B8913F', tick: '#E0B25A', ticks: 'dots', hand: '#E9C77E', sec: '#F4F5F2', num: 'roman', only4: true, font: SERIF, numColor: '#E0B25A', numSize: 15, label: 'BELLKEEPER', labelColor: '#8C7A4E' },
  wood: { face: '#B98552', rim: '#6E4425', deco: 'wood', tick: '#3B2412', hand: '#D9B26A', sec: '#F2E3C0', num: 'arabic', numColor: '#2B1A0C', numR: 0.64, label: 'BELLKEEPER' },
  marble: { face: '#F3F1EC', rim: '#C9A45C', deco: 'marble', tick: '#B8913F', bigW: 4, cap: 'butt', hand: '#2A2A2A', sec: '#B8913F', num: 'roman', only4: true, font: SERIF, numColor: '#2A2A2A', numSize: 17 },
  neon: { face: '#0B0F1A', rim: '#151B2B', tick: '#47E5FF', glow: true, hand: '#FF5BC8', mHand: '#47E5FF', sec: '#FFE45B', num: 'arabic', numColor: '#B9F3FF', numW: 500, numR: 0.64 },
  bauhaus: { face: '#F1E9DA', rim: '#1D1D1D', tick: '#1D1D1D', ticks: 'hours', bigW: 6, cap: 'butt', longBig: 0.8, hand: '#D8352A', mHand: '#1F4E9C', handCap: 'butt', hW: 10, mW: 7, sec: '#E8B21A', secDot: true, num: 'none', label: 'BELLKEEPER' },
  pocket: { face: '#FBF6E9', rim: '#B88A3A', rimInner: '#D9B56A', tick: '#1C1C1C', hand: '#1C1C1C', sec: '#1C1C1C', num: 'roman', font: SERIF, numSize: 13, numR: 0.66, sub: true },
  zodiac: { face: '#14213D', rim: '#B8913F', deco: 'zodiac', tick: '#E0C27A', ticks: 'dots', hand: '#F4E3B5', sec: '#E0B25A', num: 'zodiac', font: SERIF, numColor: '#E0C27A', numSize: 16, numR: 0.74 },
  chalk: { face: '#2F4A3A', rim: '#8A6A44', deco: 'chalk', tick: '#EDEDE4', chalk: true, hand: '#F2F2EA', sec: '#F4A6A0', num: 'arabic', numColor: '#F2F2EA', numW: 400, numSize: 18, numR: 0.64 },
  glass: { face: '#FFFFFF', faceOpacity: 0.28, rim: 'rgba(255,255,255,.55)', tick: '#FFFFFF', hand: '#FFFFFF', sec: '#FFD27A', num: 'none' },
  railway: { face: '#FFFFFF', rim: '#C9CDD0', tick: '#111111', ticks: 'bars', bigW: 6.5, longBig: 0.7, cap: 'butt', hand: '#111111', handCap: 'butt', hW: 9, mW: 6.5, sec: '#111111', num: 'none' },
  antique: { face: '#F6F1E3', rim: '#7C6A4A', deco: 'guilloche', tick: '#2B2B2B', hand: '#1F3F8A', sec: '#1F3F8A', num: 'roman', font: SERIF, numSize: 13, numR: 0.76, hW: 4.5, mW: 3 },
  navy: { face: '#13294B', rim: '#0B1A33', tick: '#FFFFFF', hand: '#FFFFFF', sec: '#FF8A3D', num: 'arabic', numColor: '#FFFFFF', numR: 0.66, label: 'BELLKEEPER', labelColor: '#8FA3C4' },
  sector: { face: '#F6F2E8', rim: '#1C1C1C', deco: 'sector', tick: '#1C1C1C', hand: '#1C1C1C', sec: '#C8352A', num: 'arabic', numR: 0.56, numSize: 13, font: SERIF },
  h24: { face: '#FFFDF8', rim: '#17231F', deco: 'h24', tick: '#17231F', hand: '#17231F', sec: '#C8352A', num: 'arabic', numR: 0.68, numSize: 14 },
  obang: { face: '#F7F3EA', rim: '#1E1E1C', deco: 'obang', tick: '#1E1E1C', ticks: 'hours', hand: '#1E1E1C', sec: '#C8352A', num: 'none' }
};

export function clockSvg(z, dialId, extra) {
  const o = Object.assign({}, DIAL_PRESETS[dialId] || DIAL_PRESETS.classic, extra || {});
  const x = 100, y = 100, r = 97, fr = r * (o.rim ? 0.93 : 1);
  let s = `<svg viewBox="0 0 200 200" class="bk-clock" aria-label="${z.h}시 ${z.mi}분">${CLOCK_DEFS}`;
  if (o.rim) s += `<circle cx="100" cy="100" r="${r}" fill="${o.rim}"/>`;
  if (o.rimInner) s += `<circle cx="100" cy="100" r="${r * 0.965}" fill="${o.rimInner}"/>`;
  s += `<circle cx="100" cy="100" r="${fr}" fill="${o.face}" ${o.faceOpacity ? `fill-opacity="${o.faceOpacity}"` : ''}/>`;
  if (o.deco && deco[o.deco]) s += `<g clip-path="url(#bkFace)">${deco[o.deco]()}</g>`;
  const glow = o.glow ? 'filter="url(#bkGlow)"' : '', chalk = o.chalk ? 'filter="url(#bkChalk)"' : '';
  for (let i = 0; i < 60; i++) {
    const big = i % 5 === 0, a = i * Math.PI / 30;
    if ((o.ticks === 'hours' || o.ticks === 'bars') && !big && o.ticks === 'hours') continue;
    if (o.ticks === 'dots') { const [px, py] = pt(x, y, fr * 0.88, a); s += `<circle cx="${px}" cy="${py}" r="${big ? 2.4 : 0.9}" fill="${o.tick}"/>`; continue; }
    const r1 = fr * (big ? (o.longBig || 0.82) : 0.9), r2 = fr * 0.95;
    const [a1, b1] = pt(x, y, r1, a), [a2, b2] = pt(x, y, r2, a);
    s += `<line x1="${a1}" y1="${b1}" x2="${a2}" y2="${b2}" stroke="${o.tick}" stroke-width="${big ? (o.bigW || 3) : (o.ticks === 'bars' ? 2 : 1.1)}" stroke-linecap="${o.cap || 'round'}" ${glow} ${chalk}/>`;
  }
  if (o.minuteNums) for (let i = 1; i <= 12; i++) { const [px, py] = pt(x, y, fr * 0.79, i * Math.PI / 6); s += `<text x="${px}" y="${py}" dy="0.36em" text-anchor="middle" font-family="${SANS}" font-size="6.5" font-weight="600" fill="#8A938F">${i * 5}</text>`; }
  if (o.num && o.num !== 'none') for (let i = 1; i <= 12; i++) {
    if (o.only4 && i % 3) continue;
    const [px, py] = pt(x, y, fr * (o.numR || 0.7), i * Math.PI / 6);
    const t = o.num === 'roman' ? ROMAN[i % 12] : o.num === 'zodiac' ? ZODIAC[i % 12] : i;
    s += `<text x="${px}" y="${py}" dy="0.36em" text-anchor="middle" font-family="${o.font || SANS}" font-weight="${o.numW || 700}" font-size="${o.numSize || 15}" fill="${o.numColor || o.tick}" ${glow} ${chalk}>${t}</text>`;
  }
  if (o.label) s += `<text x="100" y="${(100 + fr * 0.36).toFixed(1)}" text-anchor="middle" font-family="${SANS}" font-size="6.5" letter-spacing="2" font-weight="700" fill="${o.labelColor || o.tick}" opacity=".75">${o.label}</text>`;
  const sec = z.s, ha = ((z.h % 12) + z.mi / 60) * Math.PI / 6, ma = (z.mi + sec / 60) * Math.PI / 30, sa = sec * Math.PI / 30;
  const hand = (a, len, w, col, tail = 0.12) => { const [ex, ey] = pt(x, y, fr * len, a), [tx, ty] = pt(x, y, -fr * tail, a); return `<line x1="${tx}" y1="${ty}" x2="${ex}" y2="${ey}" stroke="${col}" stroke-width="${w}" stroke-linecap="${o.handCap || 'round'}" ${glow}/>`; };
  if (o.sub) {
    const sy = y + fr * 0.45, sr = fr * 0.2;
    s += `<circle cx="100" cy="${sy}" r="${sr}" fill="none" stroke="${o.tick}" stroke-width=".8"/>`;
    for (let i = 0; i < 12; i++) { const [a1, b1] = pt(x, sy, sr * 0.8, i * Math.PI / 6), [a2, b2] = pt(x, sy, sr, i * Math.PI / 6); s += `<line x1="${a1}" y1="${b1}" x2="${a2}" y2="${b2}" stroke="${o.tick}" stroke-width=".8"/>`; }
    const [sx2, sy2] = pt(x, sy, sr * 0.85, sa);
    s += `<line x1="100" y1="${sy}" x2="${sx2}" y2="${sy2}" stroke="${o.sec}" stroke-width="1"/>`;
  }
  s += hand(ha, o.hLen || 0.52, o.hW || 7, o.hand);
  s += hand(ma, o.mLen || 0.76, o.mW || 4.5, o.mHand || o.hand);
  if (!o.sub) {
    s += hand(sa, 0.84, 1.6, o.sec, 0.2);
    if (o.secDot) { const [dx, dy] = pt(x, y, fr * 0.7, sa); s += `<circle cx="${dx}" cy="${dy}" r="3.4" fill="${o.sec}"/>`; }
    if (o.secCenter) s += `<circle cx="100" cy="100" r="4.2" fill="${o.sec}"/>`;
  }
  s += `<circle cx="100" cy="100" r="5" fill="${o.sec || o.hand}"/><circle cx="100" cy="100" r="2" fill="${o.faceOpacity ? '#FFFFFF' : o.face}"/></svg>`;
  return s;
}

// ── 한국어 날짜·시각 말 ─────────────────────────────
const SINO = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
export function sinoNum(n) { if (n === 0) return '영'; const t = Math.floor(n / 10), o = n % 10; return (t ? (t > 1 ? SINO[t] : '') + '십' : '') + SINO[o]; }
export function monthWord(m) { return m === 6 ? '유월' : m === 10 ? '시월' : sinoNum(m) + '월'; }
export function dayWord(d) { return sinoNum(d) + '일'; }
const NATIVE = ['열두', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열', '열한', '열두'];
export function hourWord(h) { return NATIVE[h % 12 === 0 ? 12 : h % 12]; }
const HANJA = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
export function hanjaNum(n) { const t = Math.floor(n / 10), o = n % 10; return (t ? (t > 1 ? HANJA[t] : '') + '十' : '') + HANJA[o] || '零'; }

// ── 수묵화 (흑백 그림 + 색 시계) ─────────────────────────────
const AW = 1280, AH = 720;
export const INK_DEFS = `<defs>
  <filter id="inkPaper"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" result="n"/><feColorMatrix in="n" values="0 0 0 0 0.45  0 0 0 0 0.42  0 0 0 0 0.36  0 0 0 0.09 0"/></filter>
  <filter id="inkWash" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.02 0.05" numOctaves="4" seed="9" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="24"/><feGaussianBlur stdDeviation="1"/></filter>
  <filter id="inkBrush" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="7"/></filter>
  <filter id="inkMist"><feGaussianBlur stdDeviation="18"/></filter>
</defs>`;
function inkKit(seed) {
  const rnd = makeRng(seed), R = (a, b) => a + (b - a) * rnd();
  const paper = (c = '#F1ECE0') => `<rect width="${AW}" height="${AH}" fill="${c}"/><rect width="${AW}" height="${AH}" filter="url(#inkPaper)"/>`;
  const ridge = (base, amp, col, op, n, step = 36) => { let d = `M0 ${AH} L0 ${base}`; for (let x = 0; x <= AW + step; x += step) d += ` L${x} ${(base - Math.abs(Math.sin(x / 160 + n) * amp) - Math.abs(Math.sin(x / 47 + n * 3)) * amp * 0.25).toFixed(1)}`; return `<path d="${d} L${AW} ${AH} Z" fill="${col}" opacity="${op}" filter="url(#inkWash)"/>`; };
  const mist = (y, h, c = '#F1ECE0', op = .85) => `<rect x="-50" y="${y}" width="${AW + 100}" height="${h}" fill="${c}" opacity="${op}" filter="url(#inkMist)"/>`;
  const bamboo = (x, y0, y1, w, op = 1) => { let s = ''; for (let y = y1; y > y0;) { const seg = Math.min(y - y0, R(70, 110)); s += `<rect x="${x - w / 2}" y="${(y - seg + 4).toFixed(1)}" width="${w.toFixed(1)}" height="${(seg - 6).toFixed(1)}" rx="${(w / 3).toFixed(1)}" fill="#2B2B28" opacity="${(op * R(.75, .95)).toFixed(2)}" filter="url(#inkBrush)"/><path d="M${x - w / 2 - 3} ${(y - seg + 3).toFixed(1)} q ${w / 2 + 3} -5 ${w + 6} 0" stroke="#111" stroke-width="3" fill="none" opacity="${op}"/>`; y -= seg; } return s; };
  const leaf = (x, y, len, ang, op) => { const a = ang * Math.PI / 180, ex = x + len * Math.cos(a), ey = y + len * Math.sin(a), nx = -Math.sin(a) * len * 0.12, ny = Math.cos(a) * len * 0.12, mx = (x + ex) / 2, my = (y + ey) / 2; return `<path d="M${x.toFixed(1)} ${y.toFixed(1)} Q ${(mx + nx).toFixed(1)} ${(my + ny).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)} Q ${(mx - nx * 0.3).toFixed(1)} ${(my - ny * 0.3).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)} Z" fill="#1E1E1C" opacity="${op.toFixed(2)}"/>`; };
  const leaves = (x, y, n) => { let s = ''; for (let i = 0; i < n; i++) s += leaf(x + R(-10, 10), y + R(-14, 14), R(60, 110), R(-40, 210), R(.55, .95)); return s; };
  const branch = (pts, w, op = 1) => { let d = `M${pts[0][0]} ${pts[0][1]}`; for (let i = 1; i < pts.length; i++) d += ` Q ${(pts[i - 1][0] + R(-30, 30)).toFixed(1)} ${((pts[i - 1][1] + pts[i][1]) / 2 + R(-20, 20)).toFixed(1)} ${pts[i][0]} ${pts[i][1]}`; return `<path d="${d}" stroke="#1C1C1A" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}" filter="url(#inkBrush)"/>`; };
  const blossom = (x, y, r) => { let s = ''; for (let i = 0; i < 5; i++) { const a = i * 1.2566; s += `<circle cx="${(x + r * .8 * Math.cos(a)).toFixed(1)}" cy="${(y + r * .8 * Math.sin(a)).toFixed(1)}" r="${(r * .62).toFixed(1)}" fill="none" stroke="#2A2A28" stroke-width="1.6" opacity=".9"/>`; } return s + `<circle cx="${x}" cy="${y}" r="${(r * .25).toFixed(1)}" fill="#2A2A28"/>`; };
  const orchid = (x, y, len, bend, w) => `<path d="M${x.toFixed(1)} ${y} Q ${(x + len * .3 * Math.cos(bend) + 60).toFixed(1)} ${(y - len * .7).toFixed(1)} ${(x + len * Math.cos(bend)).toFixed(1)} ${(y - len * Math.sin(bend)).toFixed(1)}" stroke="#1E1E1C" stroke-width="${w.toFixed(1)}" fill="none" stroke-linecap="round" filter="url(#inkBrush)"/>`;
  const needles = (x, y, r) => { let s = ''; for (let i = 0; i < 26; i++) { const a = R(Math.PI * 1.05, Math.PI * 1.95), l = R(r * .6, r); s += `<line x1="${x}" y1="${y}" x2="${(x + l * Math.cos(a)).toFixed(1)}" y2="${(y + l * Math.sin(a) * .55).toFixed(1)}" stroke="#1E1E1C" stroke-width="2.2" opacity="${R(.5, .9).toFixed(2)}"/>`; } return s; };
  return { rnd, R, paper, ridge, mist, bamboo, leaves, branch, blossom, orchid, needles };
}
// 색 시계 (수묵화용)
const INK_CLOCKS = {
  red: { face: '#D8352A', rim: '#F2EBDD', tick: '#FFF3E6', ticks: 'hours', bigW: 4, hand: '#FFFFFF', sec: '#F2C14E', num: 'none' },
  cobalt: { face: '#F7F3EA', rim: '#1F4E9C', tick: '#1F4E9C', hand: '#1F4E9C', sec: '#E4572E', num: 'arabic', numColor: '#1F4E9C', numR: .64 },
  jade: { face: '#1E8C6E', rim: '#0F5C48', tick: '#E9F7EF', ticks: 'hours', bigW: 5, cap: 'butt', hand: '#FFFFFF', sec: '#FFD166', num: 'none' },
  saffron: { face: '#F2B134', rim: '#1E1E1C', tick: '#1E1E1C', hand: '#1E1E1C', sec: '#C8352A', num: 'arabic', numColor: '#1E1E1C', numR: .64 },
  coral: { face: '#F7F3EA', rim: '#EF6F6C', tick: '#EF6F6C', ticks: 'dots', hand: '#3D405B', sec: '#EF6F6C', num: 'none' },
  teal: { face: '#127C8A', rim: '#F7F3EA', tick: '#F7F3EA', hand: '#F7F3EA', sec: '#F4A259', num: 'roman', numColor: '#F7F3EA', font: SERIF, only4: true, numSize: 18 },
  violet: { face: '#5B3F9E', rim: '#E8DFF8', tick: '#E8DFF8', ticks: 'hours', hand: '#FFFFFF', sec: '#F6C177', num: 'none' },
  obang: Object.assign({}, { face: '#F7F3EA', rim: '#1E1E1C', deco: 'obang', tick: '#1E1E1C', ticks: 'hours', hand: '#1E1E1C', sec: '#C8352A', num: 'none' })
};
// pos: 시계 자리 (가로 화면 기준 %), seal: 낙관 색
export const INK_SCENES = [
  { id: 'mountain', name: '산수', color: 'red', seal: '#D8352A', pos: { x: 75, y: 27, r: 16 }, vt: true, bg: k => k.paper() + k.ridge(330, 120, '#A3A39C', .35, 1) + k.ridge(430, 150, '#6E6E68', .55, 2.4) + k.mist(440, 70) + k.ridge(560, 120, '#36362F', .8, 4) + k.ridge(650, 60, '#151513', .9, 5.5) },
  { id: 'bamboo', name: '대나무', color: 'jade', pos: { x: 50, y: 44, r: 26 }, bg: k => { let s = k.paper('#EEE9DD'); [[180, 1], [260, .7], [380, .9], [1040, .85], [1140, 1], [1220, .6]].forEach(([x, op]) => { s += k.bamboo(x, -20, AH + 20, k.R(18, 26), op); }); [[200, 120], [240, 300], [380, 200], [1060, 160], [1140, 350], [1200, 90]].forEach(([x, y]) => { s += k.leaves(x, y, 7); }); return s; } },
  { id: 'plum', name: '매화', color: 'coral', seal: '#EF6F6C', pos: { x: 76, y: 41, r: 23 }, vt: true, bg: k => { let s = k.paper(); s += k.branch([[-20, 620], [200, 520], [380, 420], [520, 360], [700, 330]], 26) + k.branch([[380, 420], [450, 260], [430, 150]], 12) + k.branch([[200, 520], [260, 380], [330, 300]], 10) + k.branch([[520, 360], [610, 230]], 8); [[430, 150], [455, 205], [330, 300], [300, 340], [610, 230], [650, 320], [700, 330], [560, 330], [260, 420], [480, 300]].forEach(([x, y]) => { s += k.blossom(x, y, k.R(10, 15)); }); return s; } },
  { id: 'orchid', name: '난초', color: 'cobalt', pos: { x: 67, y: 44, r: 27 }, vt: true, bg: k => { let s = k.paper('#F2EEE4'); for (let i = 0; i < 9; i++) s += k.orchid(260 + k.R(-30, 30), 680, k.R(260, 520), k.R(.6, 2.5), k.R(5, 9)); return s; } },
  { id: 'pine', name: '소나무', color: 'saffron', pos: { x: 74, y: 41, r: 25 }, bg: k => { let s = k.paper('#EFEADF'); s += k.ridge(560, 80, '#8E8E86', .4, 3) + k.branch([[330, 720], [300, 560], [340, 430], [300, 300], [380, 200]], 40) + k.branch([[310, 470], [140, 400], [40, 410]], 16) + k.branch([[330, 330], [520, 260], [680, 270]], 16) + k.branch([[350, 230], [230, 150]], 10); [[60, 400], [150, 390], [200, 380], [520, 250], [600, 260], [680, 260], [230, 140], [380, 190], [440, 230]].forEach(([x, y]) => { s += k.needles(x, y, k.R(50, 80)); }); return s; } },
  { id: 'waterfall', name: '폭포', color: 'teal', pos: { x: 49, y: 32, r: 21 }, bg: k => { let s = k.paper('#EDE8DC'); s += `<path d="M0 0 L520 0 L560 160 L500 380 L540 720 L0 720 Z" fill="#2A2A26" opacity=".85" filter="url(#inkWash)"/><path d="M1280 0 L740 0 L700 200 L760 420 L700 720 L1280 720 Z" fill="#3A3A34" opacity=".8" filter="url(#inkWash)"/>`; for (let i = 0; i < 30; i++) { const x = k.R(560, 700); s += `<line x1="${x.toFixed(1)}" y1="0" x2="${(x + k.R(-10, 10)).toFixed(1)}" y2="${k.R(500, 720).toFixed(1)}" stroke="#8C8C84" stroke-width="${k.R(1, 3).toFixed(1)}" opacity="${k.R(.15, .45).toFixed(2)}"/>`; } return s + k.mist(560, 160, '#EDE8DC', .95); } },
  { id: 'reed', name: '달밤 갈대', color: 'obang', pos: { x: 72, y: 34, r: 22 }, vt: true, bg: k => { let s = `<rect width="${AW}" height="${AH}" fill="#E6E1D4"/><rect width="${AW}" height="${AH}" filter="url(#inkPaper)"/>` + k.ridge(520, 70, '#8C8C84', .35, 2) + k.mist(500, 80, '#E6E1D4'); for (let i = 0; i < 70; i++) { const x = k.R(0, AW), hh = k.R(120, 300); s += `<path d="M${x.toFixed(1)} ${AH} q ${k.R(-20, 20).toFixed(1)} ${(-hh / 2).toFixed(1)} ${k.R(-40, 40).toFixed(1)} ${(-hh).toFixed(1)}" stroke="#1E1E1C" stroke-width="${k.R(1.5, 3.5).toFixed(1)}" fill="none" opacity="${k.R(.4, .9).toFixed(2)}"/>`; if (k.rnd() > .6) s += `<ellipse cx="${(x + k.R(-30, 30)).toFixed(1)}" cy="${(AH - hh).toFixed(1)}" rx="5" ry="14" fill="#1E1E1C" opacity=".7"/>`; } for (let i = 0; i < 6; i++) s += `<path d="M${220 + i * 40} ${160 + i * 14} l 10 -6 l 10 6" stroke="#1E1E1C" stroke-width="2.4" fill="none"/>`; return s; } },
  { id: 'boat', name: '강 위 쪽배', color: 'violet', seal: '#5B3F9E', pos: { x: 75, y: 31, r: 21 }, vt: true, bg: k => { let s = k.paper('#F0ECE2') + k.ridge(300, 140, '#A8A8A0', .35, 5) + k.ridge(380, 100, '#77776F', .5, 1.3) + k.mist(370, 60, '#F0ECE2'); for (let i = 0; i < 26; i++) { const y = k.R(440, 700); s += `<line x1="${k.R(0, 600).toFixed(1)}" y1="${y.toFixed(1)}" x2="${k.R(600, AW).toFixed(1)}" y2="${y.toFixed(1)}" stroke="#77776F" stroke-width="${k.R(.8, 2).toFixed(1)}" opacity="${k.R(.2, .5).toFixed(2)}"/>`; } return s + `<path d="M420 560 q 80 30 170 0 l -20 18 q -60 14 -130 0 Z" fill="#1E1E1C"/><line x1="500" y1="560" x2="500" y2="470" stroke="#1E1E1C" stroke-width="3"/><circle cx="530" cy="545" r="8" fill="#1E1E1C"/><path d="M515 552 l 30 0 l -8 -14 z" fill="#1E1E1C"/>`; } }
];
const inkCache = {};
export function inkArt(id) {
  if (!inkCache[id]) {
    const sc = INK_SCENES.find(s => s.id === id) || INK_SCENES[0];
    inkCache[id] = `<svg class="ink-bg" viewBox="0 0 ${AW} ${AH}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${INK_DEFS}${sc.bg(inkKit(11 + INK_SCENES.indexOf(sc) * 97))}</svg>`;
  }
  return inkCache[id];
}
export function inkClock(z, id) { const sc = INK_SCENES.find(s => s.id === id) || INK_SCENES[0]; return clockSvg(z, 'classic', INK_CLOCKS[sc.color]); }

// ── 디지털 시계 ─────────────────────────────
const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
function seg7(ch, x, y, w, h, on, off, t, skew) {
  const g = t * .25, hy = h / 2;
  const S = {
    a: [[g, 0], [w - g, 0], [w - g - t, t], [g + t, t]], d: [[g + t, h - t], [w - g - t, h - t], [w - g, h], [g, h]],
    g: [[g + t * .5, hy], [g + t, hy - t / 2], [w - g - t, hy - t / 2], [w - g - t * .5, hy], [w - g - t, hy + t / 2], [g + t, hy + t / 2]],
    f: [[0, g], [t, g + t], [t, hy - g - t / 2], [0, hy - g]], b: [[w, g], [w, hy - g], [w - t, hy - g - t / 2], [w - t, g + t]],
    e: [[0, hy + g], [t, hy + g + t / 2], [t, h - g - t], [0, h - g]], c: [[w, hy + g], [w, h - g], [w - t, h - g - t], [w - t, hy + g + t / 2]]
  };
  let s = '';
  for (const k of 'abcdefg') {
    const lit = SEG[ch].includes(k);
    if (!lit && !off) continue;
    s += `<polygon points="${S[k].map(([px, py]) => `${(x + px - (py - h) * skew).toFixed(1)},${(y + py).toFixed(1)}`).join(' ')}" fill="${lit ? on : off}"/>`;
  }
  return s;
}
function segRow(str, w, h, gap, on, off, t, skew, filter, blink) {
  let s = `<g ${filter ? `filter="url(#${filter})"` : ''}>`, cx = 10;
  for (const ch of str) {
    if (ch === ':') { const op = blink ? 0.25 : 1; s += `<circle cx="${(cx + gap * .9 - (h * .3 - h) * skew).toFixed(1)}" cy="${(h * .32).toFixed(1)}" r="${t * .55}" fill="${on}" opacity="${op}"/><circle cx="${(cx + gap * .9 - (h * .7 - h) * skew).toFixed(1)}" cy="${(h * .7).toFixed(1)}" r="${t * .55}" fill="${on}" opacity="${op}"/>`; cx += gap * 1.8; continue; }
    s += seg7(ch, cx, 0, w, h, on, off, t, skew); cx += w + gap;
  }
  return { s: s + '</g>', w: cx + 10 + h * skew };
}
const DOT = { 0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'], 1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'], 2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'], 3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'], 4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'], 5: ['11111', '10000', '11110', '00001', '00001', '10001', '01110'], 6: ['00110', '01000', '10000', '11110', '10001', '10001', '01110'], 7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'], 8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'], 9: ['01110', '10001', '10001', '01111', '00001', '00010', '01100'], ':': ['0', '1', '1', '0', '1', '1', '0'] };
const DGLOW = `<defs><filter id="dGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><filter id="dGlow2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
// 디지털 모양 (기존 8 + 초까지 보이는 새 모양 9)
export const DIGI_STYLES = [
  { id: 'led', name: '7세그먼트 LED', col: 'red', sec: false },
  { id: 'vfd', name: '형광 표시관', col: 'cyan', sec: false },
  { id: 'lcd', name: '레트로 LCD', col: 'lcd', sec: false },
  { id: 'nixie', name: '닉시관', col: 'nixie', sec: false },
  { id: 'dot', name: 'LED 도트', col: 'amber', sec: false },
  { id: 'thin', name: '미니멀 얇은 글씨', col: 'white', sec: false },
  { id: 'block', name: '오방색 블록', col: 'obang', sec: false },
  { id: 'ring', name: '초 링 + 큰 숫자', col: 'gold', sec: true, fixed: true },
  { id: 'clean', name: '심플 (작은 초)', col: 'paper', sec: true, isNew: true },
  { id: 'mono', name: '심플 시:분:초', col: 'white', sec: true, isNew: true },
  { id: 'word', name: '글자 (10시 09분 32초)', col: 'gold', sec: true, isNew: true },
  { id: 'cards', name: '시·분·초 카드', col: 'white', sec: true, isNew: true },
  { id: 'bar', name: '초 진행 막대', col: 'blue', sec: true, fixed: true, isNew: true },
  { id: 'arc', name: '초 원호', col: 'violet', sec: true, fixed: true, isNew: true },
  { id: 'studio', name: '방송실 스튜디오', col: 'red', sec: true, fixed: true, isNew: true },
  { id: 'score', name: '경기장 전광판', col: 'amber', sec: true, isNew: true },
  { id: 'stack', name: '세로 포스터', col: 'sunset', sec: true, isNew: true }
];
// 색 (on: 숫자 · off: 꺼진 칸 · bg: 바탕 · tile: 카드 · sub: 글자)
export const DIGI_COLORS = [
  { id: 'auto', name: '모양 기본색' },
  { id: 'red', name: '레드', on: '#FF3B2F', off: '#2A1414', bg: '#0C0D0F', tile: '#1A1214', sub: '#B9B2AE' },
  { id: 'sunset', name: '선셋 오렌지', on: '#FF8A3D', off: '#2C1A0F', bg: '#100A06', tile: '#1E140C', sub: '#C4A48C' },
  { id: 'amber', name: '앰버', on: '#FFB020', off: '#2A2010', bg: '#0D0B07', tile: '#1C170E', sub: '#9C8B6E' },
  { id: 'gold', name: '벨키퍼 골드', on: '#E0B25A', off: '#2E3A34', bg: '#17231F', tile: '#22302B', sub: '#C9D1CC' },
  { id: 'green', name: '터미널 그린', on: '#3DFF7A', off: '#0F2A18', bg: '#050C07', tile: '#0E1A12', sub: '#7FBF95' },
  { id: 'cyan', name: '네온 시안', on: '#5CFFD8', off: '#0E2A26', bg: '#06100F', tile: '#0C1E1B', sub: '#7FBFAF' },
  { id: 'blue', name: '아이스 블루', on: '#7CC4FF', off: '#12263A', bg: '#070D16', tile: '#101C2C', sub: '#8FA6BF' },
  { id: 'violet', name: '바이올렛', on: '#C29BFF', off: '#251A3A', bg: '#0D0916', tile: '#1B1430', sub: '#A797C2' },
  { id: 'pink', name: '로즈 핑크', on: '#FF7EB6', off: '#2E1422', bg: '#120810', tile: '#22101B', sub: '#C49AAE' },
  { id: 'white', name: '화이트', on: '#F4F5F2', off: '#1F2422', bg: '#0B0D0C', tile: '#171B19', sub: '#9AA5A0' },
  { id: 'paper', name: '크림 종이', on: '#1E1E1C', off: '#E3DCCB', bg: '#F4F0E6', tile: '#FFFFFF', sub: '#6B7671', light: true },
  { id: 'mint', name: '민트', on: '#1F5E4E', off: '#CFE6DD', bg: '#E8F3EE', tile: '#FFFFFF', sub: '#5A7A70', light: true },
  { id: 'sky', name: '하늘', on: '#1F3E7A', off: '#D4E0F2', bg: '#EEF3FA', tile: '#FFFFFF', sub: '#5A6A85', light: true },
  { id: 'peach', name: '복숭아', on: '#A8412B', off: '#F3D9CC', bg: '#FBEFE8', tile: '#FFFFFF', sub: '#8A6A5E', light: true }
];
const SPECIAL = {
  lcd: { on: '#283022', off: '#A9B596', bg: '#2A2C2A', tile: '#B7C2A4', sub: '#B7C2A4' },
  nixie: { on: '#FFB25A', off: '#3B2D24', bg: '#120D0A', tile: '#2A1E15', sub: '#FFB25A' },
  obang: { on: '#1E1E1C', off: '#E3DCCB', bg: '#F4F0E6', tile: '#FFFFFF', sub: '#4A5752', light: true }
};
export function digiStyle(id) { return DIGI_STYLES.find(s => s.id === id) || DIGI_STYLES[0]; }
// 실제로 쓸 색 (모양 기본색이면 모양마다 정해 둔 색)
export function digiPalette(id, col) {
  const st = digiStyle(id);
  const pick = (!col || col === 'auto') ? st.col : col;
  return SPECIAL[pick] || DIGI_COLORS.find(c => c.id === pick && c.on) || DIGI_COLORS[1];
}
export function digiShowSec(id, secOpt) {
  const st = digiStyle(id);
  if (st.fixed) return true;
  if (secOpt === 'on') return true;
  if (secOpt === 'off') return false;
  return st.sec;
}
const p2 = n => String(n).padStart(2, '0');
const T = (x, y, size, fill, txt, extra = '') => `<text x="${x}" y="${y}" text-anchor="middle" font-family="inherit" font-size="${size}" fill="${fill}" ${extra}>${txt}</text>`;
const dgSvg = (vb, body, cls = '') => `<svg viewBox="${vb}" class="dg-svg ${cls}">${DGLOW}${body}</svg>`;

export function digitalSvg(id, hm, sec, o = {}) {
  sec = Number(sec) || 0;
  const ss = p2(sec);
  const blink = sec % 2 === 1;
  const C = digiPalette(id, o.col);
  const custom = o.col && o.col !== 'auto';
  const showSec = digiShowSec(id, o.sec);
  const [hh, mm] = hm.split(':');

  if (id === 'led' || id === 'vfd' || id === 'lcd') {
    const P = { led: [150, 270, 40, 22, 0.08, 'dGlow'], vfd: [140, 250, 44, 16, 0.1, 'dGlow2'], lcd: [120, 210, 34, 18, 0.12, ''] }[id];
    const glow = C.light ? '' : P[5];
    let on = C.on, off = C.off;
    let panel = '';
    if (id === 'lcd') {
      const lightPanel = C.light ? C.bg : (custom ? C.on : '#B7C2A4');
      on = C.light ? C.on : (custom ? '#141614' : '#283022'); off = 'rgba(0,0,0,.08)';
      panel = lightPanel;
    }
    const r = segRow(hm, P[0], P[1], P[2], on, off, P[3], P[4], id === 'lcd' ? '' : glow, blink && id !== 'lcd');
    let body = r.s, W = r.w;
    if (showSec) {
      const k = 0.5;
      const r2 = segRow(ss, P[0] * k, P[1] * k, P[2] * k, on, off, P[3] * k, P[4], id === 'lcd' ? '' : glow, false);
      body += `<g transform="translate(${W + 10} ${P[1] * (1 - k)})">${r2.s}</g>`;
      W += r2.w + 10;
    }
    if (id === 'lcd') return dgSvg(`-60 -70 ${W + 120} ${P[1] + 140}`, `<rect x="-40" y="-50" width="${W + 80}" height="${P[1] + 100}" rx="16" fill="${panel}"/>${body}`);
    return dgSvg(`0 -20 ${W} ${P[1] + 40}`, body);
  }
  if (id === 'nixie') {
    let s = '', x = 0;
    const tube = (d, k) => {
      const w = 190 * k, ht = 340 * k, y0 = 340 - ht;
      let t = `<rect x="${x}" y="${y0}" width="${w}" height="${ht}" rx="${90 * k}" fill="${C.off}" opacity=".6" stroke="#6E5A48" stroke-width="3"/>`;
      for (let i = 0; i < 9; i++) t += `<line x1="${x + (20 + i * 19) * k}" y1="${y0 + 30 * k}" x2="${x + (20 + i * 19) * k}" y2="${y0 + 320 * k}" stroke="#4A3A2E" stroke-width="1.2"/>`;
      t += `<text x="${x + w / 2}" y="${y0 + 270 * k}" text-anchor="middle" font-family="${SANS}" font-weight="300" font-size="${260 * k}" fill="${C.on}" filter="url(#dGlow2)">${d}</text>`;
      x += w + 30 * k; return t;
    };
    const colon = k => { const op = blink ? .3 : 1; const t = `<circle cx="${x + 20 * k}" cy="${340 - 200 * k}" r="${10 * k}" fill="${C.on}" filter="url(#dGlow)" opacity="${op}"/><circle cx="${x + 20 * k}" cy="${340 - 120 * k}" r="${10 * k}" fill="${C.on}" filter="url(#dGlow)" opacity="${op}"/>`; x += 60 * k; return t; };
    for (const d of hh) s += tube(d, 1);
    s += colon(1);
    for (const d of mm) s += tube(d, 1);
    if (showSec) { s += colon(.6); for (const d of ss) s += tube(d, .6); }
    return dgSvg(`-20 -20 ${x + 20} 380`, `<rect x="-20" y="-20" width="${x + 20}" height="380" rx="20" fill="${C.tile}"/>${s}`);
  }
  if (id === 'dot') {
    let s = '', cx = 0;
    const put = (str, d, y0) => { for (const ch of str) { const m = DOT[ch]; for (let r = 0; r < 7; r++) for (let c = 0; c < m[r].length; c++) { const lit = m[r][c] === '1' && !(ch === ':' && blink); s += `<circle cx="${cx + c * d + d / 2}" cy="${y0 + r * d + d / 2}" r="${d * .38}" fill="${lit ? C.on : C.off}"/>`; } cx += (m[0].length + 1) * d; } };
    const d = 34;
    put(hm, d, 0);
    if (showSec) { cx += d * .4; put(ss, d * .55, 7 * d * .45); }
    return dgSvg(`0 0 ${cx} ${7 * d}`, `<g ${C.light ? '' : 'filter="url(#dGlow)"'}>${s}</g>`);
  }
  if (id === 'block') {
    const cols = custom ? [C.on, C.on, C.on, C.on] : ['#1F4E9C', '#C8352A', '#F2B134', '#1E8C6E'];
    const fg = custom ? C.bg : '#FFFFFF', dotc = custom ? C.on : '#1E1E1C';
    const ds = hm.replace(':', ''); let s = '';
    [...ds].forEach((d, i) => { const x = i * 260 + (i >= 2 ? 60 : 0); s += `<rect x="${x}" y="0" width="230" height="320" rx="28" fill="${cols[i]}"/><text x="${x + 115}" y="250" text-anchor="middle" font-family="${SANS}" font-weight="900" font-size="250" fill="${fg}">${d}</text>`; });
    s += `<circle cx="535" cy="120" r="13" fill="${dotc}" opacity="${blink ? .3 : 1}"/><circle cx="535" cy="200" r="13" fill="${dotc}" opacity="${blink ? .3 : 1}"/>`;
    let W = 1070;
    if (showSec) { s += `<rect x="1110" y="140" width="220" height="180" rx="22" fill="${custom ? C.off : '#4A5752'}"/><text x="1220" y="280" text-anchor="middle" font-family="${SANS}" font-weight="900" font-size="150" fill="${custom ? C.on : '#FFFFFF'}">${ss}</text>`; W = 1330; }
    return dgSvg(`0 0 ${W} 320`, s);
  }
  if (id === 'ring') {
    let s = ''; const cx = 300, cy = 300, r = 290;
    const lit = custom ? C.on : '#E0B25A', dim = custom ? C.off : '#2E3D37', num = custom ? C.on : '#F4F5F2';
    for (let i = 0; i < 60; i++) { const a = i * Math.PI / 30, on = i <= sec; s += `<line x1="${(cx + (r - 22) * Math.sin(a)).toFixed(1)}" y1="${(cy - (r - 22) * Math.cos(a)).toFixed(1)}" x2="${(cx + r * Math.sin(a)).toFixed(1)}" y2="${(cy - r * Math.cos(a)).toFixed(1)}" stroke="${on ? lit : dim}" stroke-width="${i % 5 ? 5 : 8}" stroke-linecap="round"/>`; }
    return dgSvg('0 0 600 600', `${s}${T(300, 345, 150, num, hm, 'font-weight="900"')}${T(300, 420, 34, lit, `${sec}초`, 'font-weight="700"')}`, 'ring');
  }
  if (id === 'clean') {
    // 큰 시:분 + 오른쪽 위 작은 초 (가장 깔끔한 모양)
    const body = `<text x="20" y="250" font-family="inherit" font-weight="600" font-size="300" letter-spacing="-6" fill="${C.on}">${hm}</text>`
      + (showSec ? `<text x="815" y="250" font-family="inherit" font-weight="500" font-size="110" fill="${C.on}" opacity=".55">${ss}</text>` : '');
    return dgSvg(`0 0 ${showSec ? 980 : 820} 290`, body);
  }
  if (id === 'mono') {
    // 같은 크기로 시:분:초 (가볍고 단정하게)
    const txt = showSec ? `${hm}<tspan fill-opacity=".45">:${ss}</tspan>` : hm;
    return dgSvg(`0 0 ${showSec ? 1200 : 820} 280`, `<text x="${showSec ? 600 : 410}" y="225" text-anchor="middle" font-family="inherit" font-weight="300" font-size="240" letter-spacing="2" fill="${C.on}" style="font-variant-numeric:tabular-nums">${txt}</text>`);
  }
  if (id === 'word') {
    // 10시 09분 32초 — 숫자는 크게, 단위는 작게
    const parts = [[String(Number(hh)), '시'], [mm, '분']].concat(showSec ? [[ss, '초']] : []);
    let s = '', x = 0;
    for (const [n, u] of parts) {
      const nw = n.length * 138;
      s += `<text x="${x}" y="230" font-family="inherit" font-weight="800" font-size="240" fill="${C.on}">${n}</text><text x="${x + nw + 6}" y="230" font-family="inherit" font-weight="500" font-size="90" fill="${C.sub}">${u}</text>`;
      x += nw + 150;
    }
    return dgSvg(`-10 0 ${x} 270`, s);
  }
  if (id === 'cards') {
    // 시·분·초 세 장의 카드
    const items = [[hh, '시'], [mm, '분']].concat(showSec ? [[ss, '초']] : []);
    let s = '', x = 0;
    for (const [n, u] of items) {
      s += `<rect x="${x}" y="0" width="300" height="300" rx="34" fill="${C.tile}" ${C.light ? 'stroke="#00000014" stroke-width="3"' : ''}/>`
        + `<line x1="${x}" y1="150" x2="${x + 300}" y2="150" stroke="${C.bg}" stroke-width="5"/>`
        + T(x + 150, 228, 210, C.on, n, 'font-weight="800" style="font-variant-numeric:tabular-nums"')
        + T(x + 150, 350, 44, C.sub, u, 'font-weight="700"');
      x += 340;
    }
    return dgSvg(`0 0 ${x - 40} 370`, s);
  }
  if (id === 'bar') {
    // 큰 시:분 + 초 숫자 + 60칸 막대
    let s = `<text x="0" y="230" font-family="inherit" font-weight="800" font-size="260" letter-spacing="-4" fill="${C.on}">${hm}</text>`
      + `<text x="1000" y="230" text-anchor="end" font-family="inherit" font-weight="600" font-size="120" fill="${C.on}" opacity=".7">${ss}</text>`;
    for (let i = 0; i < 60; i++) s += `<rect x="${i * 16.6}" y="280" width="11" height="${i % 5 ? 26 : 38}" rx="3" fill="${i <= sec ? C.on : C.off}"/>`;
    return dgSvg('0 0 1000 330', s);
  }
  if (id === 'arc') {
    // 큰 숫자 둘레로 초가 원호처럼 차오름
    const cx = 300, cy = 300, r = 270, a = (sec + 1) / 60 * Math.PI * 2;
    const ex = cx + r * Math.sin(a), ey = cy - r * Math.cos(a);
    const arc = sec >= 59 ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.on}" stroke-width="16"/>`
      : `<path d="M${cx} ${cy - r} A ${r} ${r} 0 ${a > Math.PI ? 1 : 0} 1 ${ex.toFixed(1)} ${ey.toFixed(1)}" fill="none" stroke="${C.on}" stroke-width="16" stroke-linecap="round"/>`;
    const s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.off}" stroke-width="16"/>${arc}<circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="14" fill="${C.on}"/>`
      + T(300, 335, 170, C.on, hm, 'font-weight="300" letter-spacing="-4"') + T(300, 420, 56, C.sub, ss, 'font-weight="600"');
    return dgSvg('0 0 600 600', s, 'ring');
  }
  if (id === 'studio') {
    // 방송실 시계: 60개 점이 초마다 켜지고, 바깥 12점은 늘 켜짐
    const cx = 300, cy = 300; let s = '';
    for (let i = 0; i < 60; i++) { const a = i * Math.PI / 30; s += `<circle cx="${(cx + 230 * Math.sin(a)).toFixed(1)}" cy="${(cy - 230 * Math.cos(a)).toFixed(1)}" r="9" fill="${i <= sec ? C.on : C.off}"/>`; }
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; s += `<circle cx="${(cx + 272 * Math.sin(a)).toFixed(1)}" cy="${(cy - 272 * Math.cos(a)).toFixed(1)}" r="11" fill="${C.on}"/>`; }
    const r = segRow(hm, 64, 120, 20, C.on, C.off, 11, 0.04, '', blink);
    const r2 = segRow(ss, 38, 70, 12, C.on, C.off, 7, 0.04, '', false);
    s += `<g transform="translate(${(300 - r.w / 2).toFixed(1)} 200)">${r.s}</g><g transform="translate(${(300 - r2.w / 2).toFixed(1)} 345)">${r2.s}</g>`;
    return dgSvg('0 0 600 600', `<g ${C.light ? '' : 'filter="url(#dGlow)"'}>${s}</g>`, 'ring');
  }
  if (id === 'score') {
    // 경기장 전광판: 칸마다 테두리, 아래에 시·분·초
    const items = [[hh, '시'], [mm, '분']].concat(showSec ? [[ss, '초']] : []);
    let s = '', x = 30;
    for (const [n, u] of items) {
      const r = segRow(n, 110, 200, 26, C.on, C.off, 18, 0.06, C.light ? '' : 'dGlow', false);
      s += `<rect x="${x}" y="30" width="${r.w + 40}" height="260" rx="10" fill="${C.tile}" stroke="${C.sub}" stroke-opacity=".35" stroke-width="4"/>`
        + `<g transform="translate(${x + 20} 60)">${r.s}</g>` + T(x + (r.w + 40) / 2, 345, 46, C.sub, u, 'font-weight="800" letter-spacing="8"');
      x += r.w + 80;
    }
    return dgSvg(`0 0 ${x - 10} 370`, s);
  }
  if (id === 'stack') {
    // 세로 포스터: 시 / 분 크게, 초는 색 띠
    const s = `<text x="0" y="250" font-family="inherit" font-weight="900" font-size="300" letter-spacing="-10" fill="${C.on}">${hh}</text>`
      + `<text x="0" y="540" font-family="inherit" font-weight="900" font-size="300" letter-spacing="-10" fill="${C.on}" opacity=".85">${mm}</text>`
      + (showSec ? `<rect x="370" y="330" width="210" height="210" rx="105" fill="${C.on}"/>${T(475, 476, 120, C.bg, ss, 'font-weight="800"')}` : '')
      + `<rect x="0" y="290" width="${showSec ? 580 : 340}" height="14" rx="7" fill="${C.on}" opacity=".35"/>`;
    return dgSvg(`-10 -30 ${showSec ? 600 : 360} 600`, s, 'tall');
  }
  // thin (미니멀 얇은 글씨)
  const txt = showSec ? `${hm}<tspan font-size="110" dx="18" fill-opacity=".5">${ss}</tspan>` : hm;
  return dgSvg(`0 0 ${showSec ? 1100 : 900} 300`, `<text x="${showSec ? 550 : 450}" y="250" text-anchor="middle" font-family="inherit" font-weight="100" font-size="300" letter-spacing="-8" fill="${C.on}">${txt}</text>`);
}

// ── 한글 시계 ─────────────────────────────
export const HG_GRID = ['한두세네다섯', '여섯일곱여덟', '아홉열한두시', '자이삼사오십', '정오일이삼사', '오육칠팔구분'];
const HOUR_CELLS = { 1: ['0,0'], 2: ['0,1'], 3: ['0,2'], 4: ['0,3'], 5: ['0,4', '0,5'], 6: ['1,0', '1,1'], 7: ['1,2', '1,3'], 8: ['1,4', '1,5'], 9: ['2,0', '2,1'], 10: ['2,2'], 11: ['2,2', '2,3'], 12: ['2,2', '2,4'] };
const TENS = { 1: [], 2: ['3,1'], 3: ['3,2'], 4: ['3,3'], 5: ['3,4'] };
const ONES = { 1: ['4,2'], 2: ['4,3'], 3: ['4,4'], 4: ['4,5'], 5: ['5,0'], 6: ['5,1'], 7: ['5,2'], 8: ['5,3'], 9: ['5,4'] };
export function hangulLit(h, m) {
  if (m === 0 && h === 12) return new Set(['4,0', '4,1']);      // 정오
  if (m === 0 && h === 0) return new Set(['3,0', '4,0']);       // 자정
  const cells = [...HOUR_CELLS[h % 12 === 0 ? 12 : h % 12], '2,5'];
  if (m > 0) {
    const t = Math.floor(m / 10), o = m % 10;
    if (t) cells.push(...TENS[t], '3,5');
    if (o) cells.push(...ONES[o]);
    cells.push('5,5');
  }
  return new Set(cells);
}
export function hangulSentence(h, m) {
  if (m === 0 && h === 12) return { a: '낮 열두 시', b: '정오예요' };
  if (m === 0 && h === 0) return { a: '밤 열두 시', b: '자정이에요' };
  const ampm = h < 12 ? '오전' : '오후';
  return { a: `${ampm} ${hourWord(h)} 시`, b: m ? `${sinoNum(m)} 분이에요` : '정각이에요' };
}
export const HG_STYLES = [
  { id: 'gold', name: '금빛 글자판', desc: '어두운 바탕 · 빛나는 글자' },
  { id: 'ink', name: '한지와 먹', desc: '한지 바탕 · 붉은 글씨' },
  { id: 'tile', name: '오방색 칸', desc: '타일마다 색' },
  { id: 'sentence', name: '문장 시계', desc: '"오전 열 시 구 분이에요"' }
];

// 설정 화면용: 디지털 모양·색·초 보이기 고르기 (재생기·관리자 공용)
// attr(k, v) → 버튼에 붙일 data 속성 문자열
export function digiPickerHtml(cur, attr, esc) {
  const id = DIGI_STYLES.some(s => s.id === cur.digi) ? cur.digi : 'led';
  const col = cur.dcol || 'auto', sec = cur.dsec || 'auto';
  const st = digiStyle(id);
  const mini = (sid, c) => { const C = digiPalette(sid, c); return `<span class="dg-mini" style="background:${C.bg}">${digitalSvg(sid, '10:09', 32, { col: c, sec })}</span>`; };
  return `<div class="dg-grid">${DIGI_STYLES.map(d => `<button class="${id === d.id ? 'on' : ''}" ${attr('digi', d.id)}>${mini(d.id, col)}<span class="tiny">${esc(d.name)}${d.isNew ? ' <b class="dg-newb">NEW</b>' : ''}</span></button>`).join('')}</div>
    <div class="small bold" style="margin-top:6px">색</div>
    <div class="dc-grid">${DIGI_COLORS.map(c => { const C = c.on ? c : digiPalette(id, 'auto'); return `<button class="${col === c.id ? 'on' : ''}" ${attr('dcol', c.id)} title="${esc(c.name)}"><span class="dc-sw" style="background:${C.bg}"><b style="color:${C.on}">${c.on ? '12' : '자동'}</b></span><span class="tiny">${esc(c.name)}</span></button>`; }).join('')}</div>
    <div class="small bold" style="margin-top:6px">초 보이기 ${st.fixed ? '<span class="tiny muted">· 이 모양은 늘 초가 보여요</span>' : ''}</div>
    <div class="chips wrap">${[['auto', `모양 기본 (${st.sec ? '보임' : '안 보임'})`], ['on', '초 보이기'], ['off', '시:분만']].map(([v, t]) => `<button class="chip ${sec === v ? 'on' : ''}" ${attr('dsec', v)} ${st.fixed && v !== 'auto' ? 'disabled' : ''}>${t}</button>`).join('')}</div>`;
}
