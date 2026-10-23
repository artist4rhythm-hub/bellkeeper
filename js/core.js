// 벨키퍼 공통 로직 — 관리자 화면과 재생기가 함께 씁니다.
// 시간대 계산, 규칙 우선순위, 하루 종 목록 계산.

export const APP_VERSION = '1.10.1';

export const SPACE_TYPES = [
  { id: 'school', label: '학교' },
  { id: 'academy', label: '학원' },
  { id: 'company', label: '회사' },
  { id: 'church', label: '교회·선교단체' },
  { id: 'etc', label: '기타' }
];

export const PLAYER_STYLES = [
  { id: 'light', name: 'A 시계형', desc: '밝은 화면에 큰 시계와 다음 종' },
  { id: 'dark', name: 'B 카운트다운', desc: '어두운 화면, 남은 시간을 원으로' },
  { id: 'board', name: 'C 일정판', desc: '오늘 종 전체 목록 · 교무실 TV용' },
  { id: 'big', name: 'D 큰 시계', desc: '멀리서도 보이는 아주 큰 시계' },
  { id: 'period', name: 'E 교시 진행', desc: '지금 교시와 남은 시간 막대' },
  { id: 'analog', name: 'F 아날로그', desc: '바늘 시계 + 디지털 + 큰 날짜' },
  { id: 'analog2', name: 'G 아날로그 일정', desc: '어두운 바탕 · 바늘 시계와 큰 요일' },
  { id: 'date', name: 'H 날짜 크게', desc: '요일·날짜를 아주 크게' },
  { id: 'flip', name: 'I 넘김 시계', desc: '숫자 카드가 넘어가는 시계' },
  { id: 'minimal', name: 'J 화면 보호', desc: '검은 화면에 작은 시계가 떠다님' },
  { id: 'analog3', name: 'K 큰 아날로그', desc: '화면 가득 바늘 시계 + 양옆 날짜·다음 종' },
  { id: 'ink', name: 'L 수묵화', desc: '흑백 수묵화 + 색 시계 · 8점' },
  { id: 'digital', name: 'M 디지털', desc: 'LED·닉시관·LCD 등 8가지' },
  { id: 'hangul', name: 'N 한글 시계', desc: '시각에 맞는 한글 글자가 켜짐' }
];
// 아날로그 시계판 디자인 (그림은 faces.js)
export const DIALS = [
  { id: 'classic', name: '기본', desc: '숫자 1~12' },
  { id: 'school', name: '교실 시계', desc: '분 숫자 · 빨간 초침' },
  { id: 'roman', name: '로마 숫자', desc: 'I · II · III' },
  { id: 'minimal', name: '미니멀', desc: '숫자 없이 막대' },
  { id: 'railway', name: '기차역', desc: '굵은 막대 · 또렷하게' },
  { id: 'antique', name: '앤티크', desc: '무늬 판 · 파란 바늘' },
  { id: 'pocket', name: '회중시계', desc: '작은 초침판' },
  { id: 'sector', name: '빈티지 섹터', desc: '두 겹 판' },
  { id: 'h24', name: '24시 표시', desc: '13~24 함께' },
  { id: 'navy', name: '네이비', desc: '남색 판 · 주황 초침' },
  { id: 'gold', name: '골드', desc: '어두운 판에 금색' },
  { id: 'marble', name: '대리석', desc: '흰 대리석 · 금색' },
  { id: 'wood', name: '원목', desc: '나뭇결 · 놋쇠 바늘' },
  { id: 'bauhaus', name: '바우하우스', desc: '원색 바늘' },
  { id: 'neon', name: '네온', desc: '빛나는 선' },
  { id: 'zodiac', name: '십이지', desc: '子丑寅卯 · 밤하늘' },
  { id: 'obang', name: '오방색', desc: '청적황백흑 테두리' },
  { id: 'chalk', name: '칠판', desc: '분필 글씨' },
  { id: 'kids', name: '알록달록', desc: '시간마다 색' },
  { id: 'glass', name: '유리', desc: '배경이 비침' }
];
// 아날로그 화면 배경 (F·K)
export const ABGS = [
  { id: 'plain', name: '기본' }, { id: 'kraft', name: '크라프트 종이' }, { id: 'wood', name: '원목 책상' }, { id: 'chalk', name: '칠판' },
  { id: 'dawn', name: '새벽 노을' }, { id: 'night', name: '밤하늘' }, { id: 'forest', name: '숲 그늘' }
];
export const INK_ARTS = [{ id: 'auto', name: '30분마다 바꾸기' }, { id: 'mountain', name: '산수' }, { id: 'bamboo', name: '대나무' }, { id: 'plum', name: '매화' }, { id: 'orchid', name: '난초' }, { id: 'pine', name: '소나무' }, { id: 'waterfall', name: '폭포' }, { id: 'reed', name: '달밤 갈대' }, { id: 'boat', name: '강 위 쪽배' }];
export const DIGIS = ['led', 'vfd', 'lcd', 'nixie', 'dot', 'thin', 'block', 'ring'];
export const HGS = ['gold', 'ink', 'tile', 'sentence'];
// 재생기 글씨체 (모두 무료 · 상업적 사용 가능)
const FA = n => `https://cdn.jsdelivr.net/gh/fonts-archive/${n}/subsets/${n}-dynamic-subset.css`;
export const FONTS = [
  { id: 'noto', name: '기본 고딕', css: "'Noto Sans KR', sans-serif", g: '' },
  { id: 'pretendard', name: '프리텐다드', css: "'Pretendard', 'Noto Sans KR', sans-serif", href: FA('Pretendard') },
  { id: 'gmarket', name: 'G마켓 산스', css: "'Gmarket Sans', 'Noto Sans KR', sans-serif", href: FA('GmarketSans') },
  { id: 'paperlogy', name: '페이퍼로지', css: "'Paperlogy', 'Noto Sans KR', sans-serif", href: FA('Paperlogy') },
  { id: 'nanumround', name: '나눔스퀘어 라운드', css: "'Nanum Square Round', 'Noto Sans KR', sans-serif", href: FA('NanumSquareRound') },
  { id: 'maruburi', name: '마루부리', css: "'Maru Buri', 'Noto Serif KR', serif", href: FA('MaruBuri') },
  { id: 'ridibatang', name: '리디바탕', css: "'RIDI Batang', 'Noto Serif KR', serif", href: FA('RIDIBatang') },
  { id: 'serif', name: '본명조', css: "'Noto Serif KR', serif", g: 'Noto+Serif+KR:wght@400;700;900' },
  { id: 'hahmlet', name: '함렛', css: "'Hahmlet', 'Noto Serif KR', serif", g: 'Hahmlet:wght@300;500;700;900' },
  { id: 'gowunbatang', name: '고운바탕', css: "'Gowun Batang', 'Noto Serif KR', serif", g: 'Gowun+Batang:wght@400;700' },
  { id: 'songmyung', name: '송명', css: "'Song Myung', 'Noto Serif KR', serif", g: 'Song+Myung' },
  { id: 'gowun', name: '고운돋움', css: "'Gowun Dodum', 'Noto Sans KR', sans-serif", g: 'Gowun+Dodum' },
  { id: 'c24danjung', name: '카페24 단정해', css: "'Cafe24 Danjunghae', 'Noto Sans KR', sans-serif", href: FA('Cafe24Danjunghae') },
  { id: 'c24simple', name: '카페24 심플해', css: "'Cafe24 Simplehae', 'Noto Sans KR', sans-serif", href: FA('Cafe24Simplehae') },
  { id: 'c24surround', name: '카페24 써라운드', css: "'Cafe24 Ssurround', 'Noto Sans KR', sans-serif", href: FA('Cafe24Ssurround') },
  { id: 'c24ohsquare', name: '카페24 오스퀘어', css: "'Cafe24 Ohsquare', 'Noto Sans KR', sans-serif", href: FA('Cafe24Ohsquare') },
  { id: 'c24night', name: '카페24 고운밤', css: "'Cafe24 Oneprettynight', 'Noto Sans KR', sans-serif", href: FA('Cafe24Oneprettynight') },
  { id: 'c24dongdong', name: '카페24 동동', css: "'Cafe24 Dongdong', 'Noto Sans KR', sans-serif", href: FA('Cafe24Dongdong') },
  { id: 'c24moya', name: '카페24 모야모야', css: "'Cafe24 Moyamoya', 'Noto Sans KR', sans-serif", href: FA('Cafe24Moyamoya') },
  { id: 'jua', name: '주아 (둥근)', css: "'Jua', 'Noto Sans KR', sans-serif", g: 'Jua' },
  { id: 'dohyeon', name: '도현 (각진)', css: "'Do Hyeon', 'Noto Sans KR', sans-serif", g: 'Do+Hyeon' },
  { id: 'blackhan', name: '검은고딕 (굵게)', css: "'Black Han Sans', 'Noto Sans KR', sans-serif", g: 'Black+Han+Sans' },
  { id: 'brush', name: '나눔붓글씨', css: "'Nanum Brush Script', 'Noto Serif KR', serif", g: 'Nanum+Brush+Script' },
  { id: 'dokdo', name: '동해독도 (붓)', css: "'East Sea Dokdo', 'Noto Serif KR', serif", g: 'East+Sea+Dokdo' },
  { id: 'gaegu', name: '개구 (손글씨)', css: "'Gaegu', 'Noto Sans KR', sans-serif", g: 'Gaegu:wght@400;700' },
  { id: 'digital', name: '디지털 숫자', css: "'Orbitron', 'Noto Sans KR', sans-serif", g: 'Orbitron:wght@500;700;900' }
];
export function loadFont(id) {
  const f = FONTS.find(x => x.id === id);
  if (!f || !(f.g || f.href) || typeof document === 'undefined') return;
  const key = 'bkfont-' + f.id;
  if (document.getElementById(key)) return;
  const l = document.createElement('link');
  l.id = key; l.rel = 'stylesheet';
  l.href = f.href || `https://fonts.googleapis.com/css2?family=${f.g}&display=swap`;
  document.head.appendChild(l);
}
export function fontCss(id) { const f = FONTS.find(x => x.id === id); return f ? f.css : FONTS[0].css; }
// 종 색 표시 (일과표에서 한눈에) — 직접 고르지 않으면 이름으로 자동
export const BELL_COLORS = [
  { id: 'start', name: '수업 시작', c: '#2F8F5B', bg: '#E3F1E8' },
  { id: 'end', name: '수업 끝', c: '#C9822B', bg: '#F8EBD7' },
  { id: 'break', name: '쉬는 시간', c: '#3C7DBF', bg: '#E2EDF8' },
  { id: 'meal', name: '점심·식사', c: '#C0567F', bg: '#F7E4EC' },
  { id: 'notice', name: '안내·행사', c: '#7A5BC4', bg: '#ECE6F8' },
  { id: 'etc', name: '기타', c: '#7C8580', bg: '#ECEDEB' }
];
export function autoColorId(label) {
  const L = String(label || '');
  if (/시작|입실|등교|조회/.test(L)) return 'start';
  if (/끝|종료|마침|하교|퇴근/.test(L)) return 'end';
  if (/점심|식사|급식|간식/.test(L)) return 'meal';
  if (/쉬는|휴식|쉼/.test(L)) return 'break';
  if (/안내|방송|예배|선포|암송|기도|행사|모임/.test(L)) return 'notice';
  return 'etc';
}
export function bellColor(b) {
  const id = (b && b.color && b.color !== 'auto') ? b.color : autoColorId(b && b.label);
  return BELL_COLORS.find(x => x.id === id) || BELL_COLORS[BELL_COLORS.length - 1];
}
export function styleName(id) { const s = PLAYER_STYLES.find(x => x.id === id); return s ? s.name : PLAYER_STYLES[0].name; }

export const DOW_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export const RULE_KINDS = {
  day: { label: '특정일', rank: 1 },
  week: { label: '특정 주간', rank: 2 },
  period: { label: '기간', rank: 3 }
};

// ── 시간대 ─────────────────────────────────────
const fmtCache = {};
function fmt(tz) {
  if (!fmtCache[tz]) {
    fmtCache[tz] = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short'
    });
  }
  return fmtCache[tz];
}
const WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

// ms(UTC) → 해당 시간대의 연·월·일·요일·시·분·초
export function zoned(ms, tz) {
  const p = {};
  for (const part of fmt(tz).formatToParts(new Date(ms))) p[part.type] = part.value;
  return {
    y: +p.year, m: +p.month, d: +p.day,
    h: +p.hour, mi: +p.minute, s: +p.second,
    dow: WD[p.weekday]
  };
}

function tzOffsetMs(ms, tz) {
  const z = zoned(ms, tz);
  return Date.UTC(z.y, z.m - 1, z.d, z.h, z.mi, z.s) - Math.floor(ms / 1000) * 1000;
}

// 해당 시간대의 날짜·시각 → ms(UTC)
export function zonedToMs(y, m, d, h, mi, s, tz) {
  const guess = Date.UTC(y, m - 1, d, h, mi, s || 0);
  let off = tzOffsetMs(guess, tz);
  let ms = guess - off;
  const off2 = tzOffsetMs(ms, tz);
  if (off2 !== off) ms = guess - off2;
  return ms;
}

export function pad(n) { return String(n).padStart(2, '0'); }
export function dateKey(y, m, d) { return `${y}-${pad(m)}-${pad(d)}`; }
export function todayKey(ms, tz) { const z = zoned(ms, tz); return dateKey(z.y, z.m, z.d); }

export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return { y, m, d };
}
// 날짜 키의 요일 (시간대와 무관)
export function dowOfKey(key) {
  const { y, m, d } = parseKey(key);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
export function addDays(key, n) {
  const { y, m, d } = parseKey(key);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return dateKey(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}
export function koreanDate(key) {
  const { m, d } = parseKey(key);
  return `${m}월 ${d}일 ${DOW_LABELS[dowOfKey(key)]}요일`;
}
export function shortDate(key) {
  const { m, d } = parseKey(key);
  return `${m}/${d}`;
}

export function timeToSec(t) {
  const [h, mi, s] = String(t || '0:0').split(':').map(Number);
  return (h || 0) * 3600 + (mi || 0) * 60 + (s || 0);
}

// ── 규칙 ─────────────────────────────────────
function ruleMillis(r) {
  const c = r.createdAt;
  if (!c) return Date.now();               // 방금 만든 규칙(서버 시각 대기 중)이 가장 최신
  if (typeof c === 'number') return c;
  if (typeof c.toMillis === 'function') return c.toMillis();
  if (c.seconds != null) return c.seconds * 1000;
  return 0;
}

// 우선순위 정렬: 특정일 → 특정 주간 → 기간, 같은 종류는 최근에 만든 것 먼저
export function sortRules(rules) {
  return [...rules].sort((a, b) => {
    const ra = (RULE_KINDS[a.kind] || { rank: 9 }).rank;
    const rb = (RULE_KINDS[b.kind] || { rank: 9 }).rank;
    if (ra !== rb) return ra - rb;
    const ta = ruleTargets(a).length ? 0 : 1, tb = ruleTargets(b).length ? 0 : 1;   // 그룹 지정 규칙이 먼저
    if (ta !== tb) return ta - tb;
    return ruleMillis(b) - ruleMillis(a);
  });
}

function ruleCovers(r, key) {
  if (r.kind === 'day') return r.date === key;
  return r.start && r.end && r.start <= key && key <= r.end;
}

// ── 재생 그룹 ─────────────────────────────────
// 그룹이 없는 재생기 = '공통'(BASE_GROUP). 규칙의 groups 가 비어 있으면 모든 그룹에 적용.
export const BASE_GROUP = '_base';
export const GROUP_COLORS = ['#2B7A8C', '#7A4E9A', '#3E7A4F', '#C0742A', '#B23A48', '#3D5A99', '#8A6D1E', '#5B6B66'];
export function ruleTargets(r) { return Array.isArray(r && r.groups) ? r.groups.filter(Boolean) : []; }
export function ruleApplies(r, gid) {
  const t = ruleTargets(r);
  return !t.length || t.includes(gid || BASE_GROUP);
}
// 재생기(또는 그룹 id)에 맞는 일정 기준 만들기
export function schedCtx(gid, groups) {
  const g = gid && gid !== BASE_GROUP ? (groups || []).find(x => x.id === gid) || null : null;
  return { group: g ? g.id : BASE_GROUP, groupDoc: g };
}

// 날짜 하나에 어떤 일과표가 적용되는지
// 반환: { rule, ttId, src }  (ttId가 ''이면 종 없음, rule이 null이면 규칙 없음)
// src: 'day' | 'week' | 'group' | 'period' | ''
// 순서: 특정일(그룹 지정 → 전체) → 특정 주간·행사(그룹 지정 → 전체) → 그룹 요일 설정 → 기간(공통)
export function resolveDay(key, rules, ctx) {
  const dow = dowOfKey(key);
  const gid = (ctx && ctx.group) || BASE_GROUP;
  const gdoc = ctx && ctx.groupDoc;
  const list = sortRules((rules || []).filter(r => ruleApplies(r, gid)));
  let groupDone = false;
  for (const r of list) {
    if (!groupDone && r.kind === 'period') {
      groupDone = true;
      const g = groupDay(gdoc, dow);
      if (g) return g;
    }
    if (!ruleCovers(r, key)) continue;
    if (r.kind === 'day') return { rule: r, ttId: r.ttId || '', src: 'day' };
    const days = r.days || {};
    const v = days[String(dow)];
    // 특정 주간에서 비워 둔 요일은 아래 규칙(그룹·기간)을 따름
    if (r.kind === 'week' && (v === undefined || v === null || v === '_inherit')) continue;
    if (r.kind === 'period' && ruleTargets(r).length && (v === undefined || v === null || v === '_inherit')) continue;
    return { rule: r, ttId: v || '', src: r.kind };
  }
  if (!groupDone) { const g = groupDay(gdoc, dow); if (g) return g; }
  return { rule: null, ttId: '', src: '' };
}
function groupDay(gdoc, dow) {
  if (!gdoc || !gdoc.days) return null;
  const v = gdoc.days[String(dow)];
  if (v === undefined || v === null || v === '_inherit') return null;
  return { rule: { kind: 'group', id: 'group:' + gdoc.id, name: gdoc.name }, ttId: v || '', src: 'group' };
}

// 날짜 하나의 종 목록 (시각순, ms 포함)
export function bellsForDay(key, rules, timetables, tz, ctx) {
  const res = resolveDay(key, rules, ctx);
  const tt = res.ttId ? timetables.find(t => t.id === res.ttId) : null;
  const { y, m, d } = parseKey(key);
  const bells = (tt && Array.isArray(tt.bells) ? tt.bells : [])
    .filter(b => b && b.time)
    .map((b, i) => {
      const sec = timeToSec(b.time);
      const h = Math.floor(sec / 3600), mi = Math.floor((sec % 3600) / 60), s = sec % 60;
      return { ...b, idx: i, key: `${key}|${b.time}|${i}`, at: zonedToMs(y, m, d, h, mi, s, tz) };
    })
    .sort((a, b) => a.at - b.at);
  return { ...res, tt, bells };
}

// 지금 이후 다음 종들 (오늘 + 앞으로 n일)
export function upcomingBells(nowMs, rules, timetables, tz, days = 7, ctx) {
  const start = todayKey(nowMs, tz);
  const out = [];
  for (let i = 0; i < days; i++) {
    const key = addDays(start, i);
    const day = bellsForDay(key, rules, timetables, tz, ctx);
    for (const b of day.bells) if (b.at > nowMs) out.push({ ...b, dateKey: key });
  }
  return out;
}

// ── 표시용 ─────────────────────────────────────
export function fmtRemain(ms) {
  if (ms < 0) ms = 0;
  const t = Math.floor(ms / 1000);
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${m}:${pad(s)}`;
}
export function fmtRemainWords(ms) {
  const t = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60);
  if (h >= 24) return `${Math.floor(h / 24)}일 후`;
  if (h > 0) return `${h}시간 ${m}분 후`;
  if (m > 0) return `${m}분 후`;
  return '곧';
}
export function fmtClock(ms, tz) {
  const z = zoned(ms, tz);
  return { hm: `${pad(z.h)}:${pad(z.mi)}`, s: pad(z.s), z };
}

export function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function randomCode(len, chars) {
  const set = chars || 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  let s = '';
  for (let i = 0; i < len; i++) s += set[arr[i] % set.length];
  return s;
}

// 저장 전 종 목록 정리
export function cleanBells(bells) {
  return (bells || [])
    .filter(b => b && /^\d{2}:\d{2}(:\d{2})?$/.test(b.time || ''))
    .map(b => {
      const o = {
        time: b.time.slice(0, 5),
        label: String(b.label || '').slice(0, 40),
        soundId: String(b.soundId || 'b:westminster').slice(0, 80)
      };
      const vol = Number(b.volume);
      o.volume = Number.isFinite(vol) ? Math.min(100, Math.max(0, Math.round(vol))) : 100;
      const ms = Number(b.maxSec);
      o.maxSec = Number.isFinite(ms) ? Math.min(3600, Math.max(0, Math.round(ms))) : 0;
      o.say = String(b.say || '').slice(0, 120);
      if (b.sayId && o.say) o.sayId = String(b.sayId).slice(0, 60);
      if (b.color && BELL_COLORS.some(x => x.id === b.color)) o.color = b.color;
      const rp = Math.round(Number(b.repeat));
      if (rp > 1) o.repeat = Math.min(5, rp);
      const sr = Math.round(Number(b.sayRepeat));
      if (sr > 1 && o.say) o.sayRepeat = Math.min(3, sr);
      if (b.bgmId && o.say) {
        o.bgmId = String(b.bgmId).slice(0, 80);
        const bv = Number(b.bgmVol);
        o.bgmVol = Number.isFinite(bv) ? Math.min(100, Math.max(5, Math.round(bv))) : 30;
      }
      return o;
    })
    .sort((a, b) => timeToSec(a.time) - timeToSec(b.time))
    .slice(0, 100);
}
