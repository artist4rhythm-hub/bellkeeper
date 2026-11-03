// 벨키퍼 화면 모양(테마)별 옵션 — 재생기 설정과 관리자 [기기] 화면이 함께 써요
import { PLAYER_STYLES, DIALS, ABGS, INK_ARTS, FONTS, loadFont } from './core.js';
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
