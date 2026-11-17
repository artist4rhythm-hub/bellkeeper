// 벨키퍼 화면 모양(테마)별 옵션 — 재생기 설정과 관리자 [기기] 화면이 함께 써요
import { PLAYER_STYLES, DIALS, ABGS, INK_ARTS, FONTS, loadFont, CYCLE_MINS, cycleMode, cycleList, SAVERS, NIGHT_FROM, NIGHT_TO, CLOCK_BGS, screenZone } from './core.js';
import { clockSvg, inkArt, digiPickerHtml, HG_STYLES } from './faces.js';

// 화면 모양마다 고를 수 있는 옵션 (글씨체는 모든 모양 공통이라 맨 뒤)
export const THEME_OPTS = {
  light: ['font'], dark: ['font'], board: ['font'], big: ['font'], period: ['font'],
  analog: ['dial', 'abg', 'font'], analog2: ['dial', 'font'], date: ['font'], flip: ['font'], minimal: ['font'],
  analog3: ['dial', 'abg', 'font'], ink: ['art', 'font'], digital: ['digi', 'font'], hangul: ['hg', 'font']
};
export const OPT_LABEL = {
  dial: ['시계판', DIALS.length], abg: ['배경', ABGS.length], art: ['수묵화 그림', INK_ARTS.length],
  digi: ['디지털 모양·색·초', 17], hg: ['한글 모양', HG_STYLES.length], font: ['글씨체', FONTS.length]
};
export const themeOpts = id => THEME_OPTS[id] || ['font'];
const SAMPLE_Z = { h: 10, mi: 9, s: 32, y: 2026, m: 10, d: 23, dow: 5 };

// 1단계: 화면 모양 카드 목록
// act(id) → 카드를 눌렀을 때의 data 속성, curMode = 지금 쓰는 화면
export function themeGridHtml(curMode, act, esc) {
  return `<div class="th-grid">${PLAYER_STYLES.map(s => {
    const opts = themeOpts(s.id);
    return `<button class="th ${s.id === curMode ? 'on' : ''}" ${act(s.id)}>
      ${s.id === curMode ? '<span class="th-use">사용 중</span>' : ''}
      <span class="mini pv-${s.id}"></span>
      <b>${esc(s.name)}</b><span class="th-d">${esc(s.desc)}</span>
      <span class="th-tags">${opts.map(k => `<span class="th-tag ${k === 'font' ? 'gray' : ''}">${OPT_LABEL[k][0]} ${OPT_LABEL[k][1]}</span>`).join('')}</span>
      <span class="th-go">옵션 고르기 →</span></button>`;
  }).join('')}</div>`;
}

// 2단계 위쪽: 돌아가기 · 이름 · [이 화면으로 쓰기]
export function themeHeadHtml(theme, curMode, backAttr, useAttr, esc) {
  const s = PLAYER_STYLES.find(x => x.id === theme) || PLAYER_STYLES[0];
  return `<div class="th-crumb">
    <button class="btn" ${backAttr}>← 화면 모양 목록</button>
    <span class="mini pv-${s.id}"></span>
    <div class="grow"><b>${esc(s.name)}</b><div class="tiny muted">${esc(s.desc)}</div></div>
    ${theme === curMode ? '<span class="th-now">✓ 지금 쓰는 화면</span>' : `<button class="btn primary" ${useAttr}>이 화면으로 쓰기</button>`}
  </div>`;
}

// 2단계 옵션 탭
export function optTabsHtml(theme, cur, tabAttr) {
  return `<div class="th-otabs">${themeOpts(theme).map(k => `<button class="${k === cur ? 'on' : ''}" ${tabAttr(k)}>${OPT_LABEL[k][0]}<span class="n">${OPT_LABEL[k][1]}</span></button>`).join('')}</div>`;
}

// 2단계 옵션 내용 — o: 지금 값들, attr(k, v): 고르는 버튼의 data 속성
export function optPanelHtml(k, o, attr, esc) {
  if (k === 'dial') return `<div class="dial-grid">${DIALS.map(d => `<button class="${(o.dial || 'classic') === d.id ? 'on' : ''}" ${attr('dial', d.id)}><span class="dial-mini">${clockSvg(SAMPLE_Z, d.id)}</span><b>${esc(d.name)}</b><span class="muted tiny">${esc(d.desc)}</span></button>`).join('')}</div>`;
  if (k === 'abg') return `<div class="sw-grid">${ABGS.map(b => `<button class="${(o.abg || 'plain') === b.id ? 'on' : ''}" ${attr('abg', b.id)}><span class="sw abg-${b.id}"></span><span class="tiny">${esc(b.name)}</span></button>`).join('')}</div>`;
  if (k === 'art') return `<div class="art-grid">${INK_ARTS.map(a => `<button class="${(o.art || 'auto') === a.id ? 'on' : ''}" ${attr('art', a.id)}>${a.id === 'auto' ? '<span class="art-mini auto">↻</span>' : `<span class="art-mini">${inkArt(a.id)}</span>`}<span class="tiny">${esc(a.name)}</span></button>`).join('')}</div>`;
  if (k === 'digi') return digiPickerHtml(o, attr, esc);
  if (k === 'hg') return `<div class="hg-pick">${HG_STYLES.map(x => `<button class="${(o.hg || 'gold') === x.id ? 'on' : ''}" ${attr('hg', x.id)}><b>${esc(x.name)}</b><span class="muted tiny">${esc(x.desc)}</span></button>`).join('')}</div>
    <div class="tiny muted">한글 시계는 글씨체에 따라 느낌이 많이 달라져요. [글씨체] 탭에서 함께 골라 보세요.</div>`;
  return `<div class="font-grid">${FONTS.map(f => { loadFont(f.id); return `<button class="${(o.font || 'noto') === f.id ? 'on' : ''}" ${attr('font', f.id)}><span class="fs" style="font-family:${f.css.replace(/"/g, "'")}">열 시 구 분</span><span class="muted tiny">${esc(f.name)}</span></button>`; }).join('')}</div>`;
}

// ── 화면 모양 자동 바꾸기 (재생기 설정 · 관리자 [기기] 함께 씀) ─────────
export const cycleWay = o => !(Number(o.cycle) > 0) ? 'fixed' : (Array.isArray(o.cycleSet) && o.cycleSet.length ? 'pick' : 'all');
const MIN_LABEL = { 5: '5분', 10: '10분', 15: '15분', 30: '30분', 60: '1시간' };
// 고른 버튼 → 기기 문서에 쓸 값
export function cyclePatch(o, kind, v, base) {
  const min = Number(o.cycle) > 0 ? Number(o.cycle) : 15;
  const set = Array.isArray(o.cycleSet) ? o.cycleSet.slice() : [];
  if (kind === 'way') {
    if (v === 'fixed') return { cycle: 0 };
    if (v === 'all') return { cycle: min, cycleSet: [] };
    return { cycle: min, cycleSet: set.length ? set : [base] };
  }
  if (kind === 'min') return { cycle: Number(v) };
  if (kind === 'ord') return { cycleOrd: v === 'rand' ? 'rand' : 'seq' };
  if (kind === 'set') {
    const i = set.indexOf(v);
    if (i >= 0) { if (set.length <= 1) return null; set.splice(i, 1); } else set.push(v);
    return { cycleSet: PLAYER_STYLES.map(x => x.id).filter(id => set.includes(id)) };
  }
  return null;
}
// attr(kind, v) → 버튼의 data 속성 · base = 고정일 때 보여 줄 화면(지금 고른 화면)
export function cycleHtml(o, base, attr, esc) {
  const way = cycleWay(o), min = Number(o.cycle) || 0, ord = o.cycleOrd === 'rand' ? 'rand' : 'seq';
  const set = Array.isArray(o.cycleSet) ? o.cycleSet : [];
  const nameOf = id => (PLAYER_STYLES.find(x => x.id === id) || { name: id }).name;
  const ways = [['fixed', '고정', '지금 화면 그대로'], ['all', '모든 화면', '모든 모양을 돌아가며'], ['pick', '고른 화면만', '내가 고른 모양만 돌아가며']];
  let html = `<div class="cy-ways">${ways.map(([v, t, d]) => `<button class="cy-way ${way === v ? 'on' : ''}" ${attr('way', v)}><b>${t}</b><span>${d}</span></button>`).join('')}</div>`;
  if (way !== 'fixed') {
    html += `<div class="cy-row"><span class="cy-lab">바꾸는 간격</span><div class="chips wrap">${CYCLE_MINS.filter(m => m > 0).map(m => `<button class="chip ${min === m ? 'on' : ''}" ${attr('min', m)}>${MIN_LABEL[m]}마다</button>`).join('')}</div></div>
      <div class="cy-row"><span class="cy-lab">순서</span><div class="chips wrap"><button class="chip ${ord === 'seq' ? 'on' : ''}" ${attr('ord', 'seq')}>차례로</button><button class="chip ${ord === 'rand' ? 'on' : ''}" ${attr('ord', 'rand')}>무작위</button></div></div>`;
  }
  if (way === 'pick') {
    html += `<div class="cy-row top"><span class="cy-lab">돌릴 화면 <b class="cy-n">${set.length}개</b></span>
      <div class="cy-pick">${PLAYER_STYLES.map(x => `<button class="cy-th ${set.includes(x.id) ? 'on' : ''}" ${attr('set', x.id)} aria-pressed="${set.includes(x.id)}"><span class="mini pv-${x.id}"></span><span class="cy-chk">✓</span><span class="cy-nm">${esc(x.name)}</span></button>`).join('')}</div></div>
      ${set.length < 2 ? '<div class="tiny cy-warn">2개 이상 골라야 바뀌어요. 지금은 고른 화면 하나만 보여요.</div>' : ''}`;
  }
  if (way !== 'fixed' && cycleList(base, o).length >= 2) {
    const now = Date.now(), step = min * 60000, k0 = Math.floor(now / step);
    const t = ms => { const d = new Date(ms); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
    html += `<div class="cy-next"><span class="cy-lab">이렇게 바뀌어요</span>${[0, 1, 2, 3].map(i => `<span class="cy-step ${i === 0 ? 'now' : ''}"><i>${i === 0 ? '지금' : t((k0 + i) * step)}</i>${esc(nameOf(cycleMode(base, o, (k0 + i) * step + 1)))}</span>`).join('<span class="cy-arr">→</span>')}</div>`;
  }
  html += `<div class="tiny muted">${way === 'fixed' ? '고른 화면 모양이 계속 그대로 있어요.' : '같은 학교의 재생기들은 같은 시각에 함께 바뀌어요. 수업 없을 때 화면 보호가 켜져 있으면 그 시간엔 화면 보호가 먼저예요.'}</div>`;
  return html;
}

// ── 하루 화면 시간표 (재생기 설정 · 관리자 [기기] 함께 씀) ─────────
const HOUR_NAME = h => h === 24 ? '밤 12시' : h === 25 ? '새벽 1시' : h < 12 ? (h < 7 ? `새벽 ${h}시` : `아침 ${h}시`) : `밤 ${h - 12}시`;
// 24시간 막대: first/last = 오늘 첫 종·마지막 종(분), 없으면 null
export function dayBarHtml(o, first, last, nowMin) {
  const base = new Date(2026, 0, 5).getTime();          // 날짜는 상관없음 — 분만 씀
  const bells = first == null ? [] : [{ at: base + first * 60000 }, { at: base + last * 60000 }];
  const segs = [];
  for (let m = 0; m < 1440; m += 5) {
    const z = screenZone(o, bells, base + m * 60000 + 1, m / 60);
    if (segs.length && segs[segs.length - 1].z === z) segs[segs.length - 1].b = m + 5; else segs.push({ z, a: m, b: m + 5 });
  }
  const NAME = { day: '일과 화면', clock: '시계 화면', saver: '화면 보호' };
  return `<div class="st-bar">${segs.map(x => `<span class="st-${x.z}" style="width:${((x.b - x.a) / 14.4).toFixed(3)}%" title="${NAME[x.z]} ${String(Math.floor(x.a / 60)).padStart(2, '0')}:${String(x.a % 60).padStart(2, '0')}~">${x.b - x.a >= 150 ? NAME[x.z] : ''}</span>`).join('')}${nowMin != null ? `<i class="st-now" style="left:${(nowMin / 14.4).toFixed(2)}%"></i>` : ''}</div>
    <div class="st-ticks">${[0, 6, 12, 18, 24].map(hh => `<span style="left:${hh / 24 * 100}%">${String(hh).padStart(2, '0')}</span>`).join('')}</div>
    <div class="st-legend"><span><i class="st-saver"></i>화면 보호</span><span><i class="st-clock"></i>시계 화면</span><span><i class="st-day"></i>일과 화면</span></div>`;
}
// attr(k, v) → 버튼의 data 속성 · info = { first, last, nowMin, dayNote }
export function screenTimeHtml(o, attr, esc, info = {}) {
  const saver = SAVERS.includes(o.saver) ? o.saver : 'clock';
  const nf = NIGHT_FROM.includes(o.nightFrom) ? o.nightFrom : 24, nt = NIGHT_TO.includes(o.nightTo) ? o.nightTo : 5;
  const ways = [['clock', '시계 화면 + 밤에만 화면 보호', '일과가 끝나면 시계 화면, 늦은 밤에만 검은 화면'], ['night', '일과 밖은 모두 화면 보호', '예전 방식'], ['off', '항상 고른 화면', '화면 보호 없이']];
  let html = `<div class="cy-ways st-ways">${ways.map(([v, t, d]) => `<button class="cy-way ${saver === v ? 'on' : ''}" ${attr('saver', v)}><b>${t}</b><span>${d}</span></button>`).join('')}</div>`;
  html += `<div class="st-preview"><div class="cy-lab">${esc(info.dayNote || '오늘 하루')}</div>${dayBarHtml({ ...o, saver, nightFrom: nf, nightTo: nt }, info.first ?? null, info.last ?? null, info.nowMin ?? null)}</div>`;
  if (saver === 'clock') {
    html += `<div class="cy-row"><span class="cy-lab">화면 보호 시작</span><div class="chips wrap">${NIGHT_FROM.map(x => `<button class="chip ${nf === x ? 'on' : ''}" ${attr('nightFrom', x)}>${HOUR_NAME(x)}</button>`).join('')}</div></div>
      <div class="cy-row"><span class="cy-lab">화면 보호 끝</span><div class="chips wrap">${NIGHT_TO.map(x => `<button class="chip ${nt === x ? 'on' : ''}" ${attr('nightTo', x)}>${HOUR_NAME(x)}</button>`).join('')}</div></div>
      <div class="cy-row"><span class="cy-lab">종 없는 날</span><div class="chips wrap"><button class="chip ${o.offDay !== 'saver' ? 'on' : ''}" ${attr('offDay', 'clock')}>시계 화면 (밤엔 화면 보호)</button><button class="chip ${o.offDay === 'saver' ? 'on' : ''}" ${attr('offDay', 'saver')}>하루 종일 화면 보호</button></div></div>
      <div class="tiny muted">일과 화면 = 첫 종 30분 전 ~ 마지막 종 15분 뒤 (고른 화면·자동 바꾸기 그대로). 주말·방학처럼 종이 없는 날도 같은 시각에 화면 보호가 켜져요.</div>`;
  } else if (saver === 'night') html += '<div class="tiny muted">첫 종 30분 전 ~ 마지막 종 15분 뒤가 아니면, 그리고 종이 없는 날은 검은 화면에 작은 시계가 떠다녀요.</div>';
  return html;
}
// 시계 화면 꾸미기: 배경 그림 · 시계판 · 밤 은은하게
export function clockScreenHtml(o, attr, esc, imgBase = 'img/bg/') {
  const cbg = CLOCK_BGS.some(b => b.id === o.cbg) ? o.cbg : 'auto', cd = DIALS.some(d => d.id === o.cdial) ? o.cdial : 'classic';
  return `<div class="cy-row top"><span class="cy-lab">배경 그림</span>
      <div class="cs-pick">${CLOCK_BGS.map(b => `<button class="cs-bgbtn ${cbg === b.id ? 'on' : ''}" ${attr('cbg', b.id)}>
        <span class="cs-thumb ${b.id === 'auto' ? 'auto' : ''} ${b.id === 'plain' ? 'plain' : ''}">${b.id === 'auto' ? ['morning', 'yard', 'dusk', 'night'].map(x => `<i style="background-image:url(${imgBase}${x}-s.webp)"></i>`).join('') : b.id === 'plain' ? '' : `<i style="background-image:url(${imgBase}${b.id}-s.webp)"></i>`}</span>
        <b>${esc(b.name)}</b><span class="tiny muted">${esc(b.desc)}</span></button>`).join('')}</div></div>
    <div class="cy-row top"><span class="cy-lab">시계판</span>
      <div class="dial-grid cs-dials">${DIALS.map(d => `<button class="${cd === d.id ? 'on' : ''}" ${attr('cdial', d.id)}><span class="dial-mini">${clockSvg(SAMPLE_Z, d.id)}</span><b>${esc(d.name)}</b></button>`).join('')}</div></div>
    <div class="cy-row"><span class="cy-lab">밤 9시 이후</span><div class="chips wrap"><button class="chip ${o.cdim !== false ? 'on' : ''}" ${attr('cdim', 'on')}>은은하게 (밝기 낮춤)</button><button class="chip ${o.cdim === false ? 'on' : ''}" ${attr('cdim', 'off')}>그대로</button></div></div>`;
}
// 고른 버튼 → 기기 문서에 쓸 값
export function screenPatch(k, v) {
  if (k === 'saver') return SAVERS.includes(v) ? { saver: v } : null;
  if (k === 'nightFrom' || k === 'nightTo') return { [k]: Number(v) };
  if (k === 'offDay') return { offDay: v === 'saver' ? 'saver' : 'clock' };
  if (k === 'cbg') return CLOCK_BGS.some(b => b.id === v) ? { cbg: v } : null;
  if (k === 'cdial') return DIALS.some(d => d.id === v) ? { cdial: v } : null;
  if (k === 'cdim') return { cdim: v !== 'off' };
  return null;
}
