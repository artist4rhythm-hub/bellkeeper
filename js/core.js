// 벨키퍼 공통 로직 — 관리자 화면과 재생기가 함께 씁니다.
// 시간대 계산, 규칙 우선순위, 하루 종 목록 계산.

export const APP_VERSION = '1.1.0';

export const SPACE_TYPES = [
  { id: 'school', label: '학교' },
  { id: 'academy', label: '학원' },
  { id: 'company', label: '회사' },
  { id: 'church', label: '교회·선교단체' },
  { id: 'etc', label: '기타' }
];

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
    return ruleMillis(b) - ruleMillis(a);
  });
}

function ruleCovers(r, key) {
  if (r.kind === 'day') return r.date === key;
  return r.start && r.end && r.start <= key && key <= r.end;
}

// 날짜 하나에 어떤 일과표가 적용되는지
// 반환: { rule, ttId }  (ttId가 ''이면 종 없음, rule이 null이면 규칙 없음)
export function resolveDay(key, rules) {
  const dow = dowOfKey(key);
  for (const r of sortRules(rules)) {
    if (!ruleCovers(r, key)) continue;
    if (r.kind === 'day') return { rule: r, ttId: r.ttId || '' };
    const days = r.days || {};
    const v = days[String(dow)];
    // 특정 주간에서 비워 둔 요일은 아래 규칙(기간)을 따름
    if (r.kind === 'week' && (v === undefined || v === null || v === '_inherit')) continue;
    return { rule: r, ttId: v || '' };
  }
  return { rule: null, ttId: '' };
}

// 날짜 하나의 종 목록 (시각순, ms 포함)
export function bellsForDay(key, rules, timetables, tz) {
  const res = resolveDay(key, rules);
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
export function upcomingBells(nowMs, rules, timetables, tz, days = 7) {
  const start = todayKey(nowMs, tz);
  const out = [];
  for (let i = 0; i < days; i++) {
    const key = addDays(start, i);
    const day = bellsForDay(key, rules, timetables, tz);
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
      return o;
    })
    .sort((a, b) => timeToSec(a.time) - timeToSec(b.time))
    .slice(0, 100);
}
