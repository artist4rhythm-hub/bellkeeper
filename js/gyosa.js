// 교사 선교사 「완성 시간표」 공유 링크 → 벨키퍼 일과표 만들기
// 공유 링크(share-timetable.html?id=st_…)는 로그인 없이 읽을 수 있고,
// 교사 선교사에서 새로 게시하면 같은 링크의 내용이 저절로 최신이 돼요.
import { autoColorId } from './core.js';

const DA = { project: 'daniel-amatz', key: 'AIzaSyCtgr79jKqkec6HwqkxYNxSubWAhfEkM7g' };
export const GY_DAYS = ['월', '화', '수', '목', '금'];
export const GY_DOW = { 월: 1, 화: 2, 수: 3, 목: 4, 금: 5 };
const GRADE_ORDER = ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년', '7학년', '8학년', '9학년', '10학년', '11학년', '12학년', '4세', '5세', '6세', '7세'];

const pad = n => String(n).padStart(2, '0');
export const hmOf = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const parseHM = s => { const m = String(s || '').match(/(\d{1,2}):(\d{2})/); return m ? (+m[1]) * 60 + (+m[2]) : 8 * 60 + 40; };

// 링크·아이디 어느 쪽을 넣어도 아이디만 뽑기
export function parseShareId(input) {
  const s = String(input || '').trim();
  const m = s.match(/[?&]id=([A-Za-z0-9_-]+)/) || s.match(/^(st_[A-Za-z0-9_-]+)$/);
  return m ? m[1] : '';
}

// Firestore REST 값 → 보통 값
function fsVal(v) {
  if (!v || typeof v !== 'object') return null;
  if ('nullValue' in v) return null;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('stringValue' in v) return v.stringValue;
  if ('timestampValue' in v) return Date.parse(v.timestampValue);
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fsVal);
  if ('mapValue' in v) return fsFields(v.mapValue.fields || {});
  if ('referenceValue' in v) return v.referenceValue;
  if ('geoPointValue' in v) return v.geoPointValue;
  return null;
}
function fsFields(f) { const o = {}; for (const k of Object.keys(f || {})) o[k] = fsVal(f[k]); return o; }
export const fromFirestoreDoc = d => fsFields((d && d.fields) || {});

export async function fetchShare(shareId, fetcher = fetch) {
  const url = `https://firestore.googleapis.com/v1/projects/${DA.project}/databases/(default)/documents/sharedTimetables/${encodeURIComponent(shareId)}?key=${DA.key}`;
  const r = await fetcher(url);
  if (r.status === 404) throw Object.assign(new Error('그 링크의 시간표를 찾지 못했어요. 링크를 다시 확인해 주세요.'), { code: 'notfound' });
  if (!r.ok) throw Object.assign(new Error('시간표를 읽지 못했어요. 잠시 뒤 다시 해 주세요.'), { code: 'http' + r.status });
  const d = fromFirestoreDoc(await r.json());
  if (d.active === false || !d.snapshot) throw Object.assign(new Error('지금 이 링크로 게시된 시간표가 없어요. 교사 선교사에서 게시를 확인해 주세요.'), { code: 'off' });
  return d;
}

// ── 게시본 읽기 ─────────────────────────────
function frameOf(snap) { return (snap.frames || []).find(x => x.id === snap.frameId) || (snap.frames || [])[0] || null; }
export function gradesOf(snap) {
  const f = frameOf(snap); if (!f) return [];
  const set = new Set([...Object.keys((snap.gradeDept || {})[f.id] || {}), ...Object.keys((snap.place2 || {})[snap.frameId] || {})]);
  const idx = g => { const i = GRADE_ORDER.indexOf(g); return i < 0 ? 999 : i; };
  return [...set].filter(Boolean).sort((a, b) => idx(a) - idx(b) || a.localeCompare(b, 'ko'));
}
export function deptOf(snap, grade) {
  const f = frameOf(snap); if (!f || !f.snapshot) return null;
  const id = ((snap.gradeDept || {})[f.id] || {})[grade] || '';
  return (f.snapshot.departments || []).find(d => d.id === id) || null;
}
export function departmentsOf(snap) {
  const f = frameOf(snap);
  const used = new Set(gradesOf(snap).map(g => (deptOf(snap, g) || {}).id).filter(Boolean));
  return ((f && f.snapshot && f.snapshot.departments) || []).filter(d => used.has(d.id));
}
// 시간표 틀의 칸 (부서·요일)
function frameBlocks(snap, dept, day) {
  const f = frameOf(snap); if (!f || !f.snapshot || !dept) return [];
  const bt = {}; (f.snapshot.blockTypes || []).forEach(b => { bt[b.id] = b; });
  const wk = f.snapshot.weekArrangements || {};
  const arr = (wk[day] && wk[day][dept.id]) || (f.snapshot.arrangements && f.snapshot.arrangements[dept.id]) || null;
  if (!arr || !arr.length) return [];
  let cur = parseHM(dept.start || '08:40');
  const out = [];
  for (const it of arr) {
    const b = bt[it.typeId]; if (!b) continue;
    const dur = Number(it.durOverride != null ? it.durOverride : b.dur) || 0;
    if (dur <= 0) continue;
    out.push({ startMin: cur, endMin: cur + dur, name: String(b.name || '').trim(), kind: b.countsAsClass ? 'class' : (b.isRest ? 'rest' : 'named') });
    cur += dur;
  }
  return out;
}
// 이 학년이 그날 실제로 배치된 수업 카드
function gradeCards(snap, grade, day) {
  const list = (((snap.place2 || {})[snap.frameId] || {})[grade] || {})[day] || [];
  const out = [];
  for (const c of list) {
    const les = (snap.lessons || []).find(l => l.id === c.lessonId); if (!les) continue;
    if ((les.grades || []).length && !les.grades.includes(grade)) continue;
    const s = Number(c.startMin), d = Number(c.durMin);
    if (!Number.isFinite(s) || !(d > 0)) continue;
    out.push({ startMin: s, endMin: s + d, name: String(les.subject || les.name || '').trim(), kind: les.kind === 'break' ? 'named' : 'class' });
  }
  return out.sort((a, b) => a.startMin - b.startMin);
}

// 하루 흐름: 틀의 칸 + 실제 수업 카드를 합쳐 「무엇이 언제 시작하고 끝나는지」
export function dayPlan(snap, grade, day) {
  const dept = deptOf(snap, grade);
  const blocks = frameBlocks(snap, dept, day);
  const cards = gradeCards(snap, grade, day);
  if (!blocks.length && !cards.length) return [];
  if (!cards.length) return blocks.map(b => ({ ...b }));
  // 수업 카드가 있으면: 마지막 카드 뒤로 이어지는 조회·종례 같은 칸까지만 (그 뒤는 그 학년 하교 후)
  let end = Math.max(...cards.map(c => c.endMin));
  for (const b of blocks) if (b.startMin === end && b.kind === 'named') end = b.endMin;
  let start = Math.min(...cards.map(c => c.startMin));
  for (const b of [...blocks].reverse()) if (b.endMin === start && b.kind === 'named') start = b.startMin;
  const inCard = t => cards.some(c => t > c.startMin && t < c.endMin);
  const times = new Set();
  for (const b of blocks) for (const t of [b.startMin, b.endMin]) if (t >= start && t <= end && !inCard(t)) times.add(t);
  for (const c of cards) { times.add(c.startMin); times.add(c.endMin); }
  const ts = [...times].sort((a, b) => a - b);
  const segs = [];
  for (let i = 0; i < ts.length - 1; i++) {
    const a = ts[i], z = ts[i + 1], mid = (a + z) / 2;
    const c = cards.find(x => mid > x.startMin && mid < x.endMin);
    const b = blocks.find(x => mid > x.startMin && mid < x.endMin);
    const src = c || b;
    if (!src) continue;                      // 빈 시간 (그 학년 공강·하교 뒤)
    const kind = c ? c.kind : (b.kind === 'class' ? 'free' : b.kind);   // 카드 없는 수업 칸 = 공강
    const prev = segs[segs.length - 1];
    if (prev && prev.endMin === a && prev.src === src) { prev.endMin = z; continue; }
    segs.push({ startMin: a, endMin: z, name: src.name, kind, src });
  }
  // 공강(카드 없는 수업 칸)도 학교 전체는 수업 중이라 종은 그대로 울려요
  return segs.map(({ src, ...s }) => ({ ...s, kind: s.kind === 'free' ? 'class' : s.kind }));
}

// ── 기준 일과표(템플릿)에서 종소리 설정 고르기 ─────────────
const NAMED_KEYS = ['점심', '조회', '종례', '청소', '채플', '예배', '하교', '간식', '방과', '아침', '기도', '경건', '독서'];
const norm = s => String(s || '').replace(/\s+/g, '');
function kindOfBell(b) {
  const c = (b.color && b.color !== 'auto') ? b.color : autoColorId(b.label);
  if (/하교|종례|마침/.test(b.label || '')) return 'final';
  if (c === 'start' && !/조회|등교|입실/.test(b.label || '')) return 'start';
  if (c === 'end') return 'end';
  return 'named';
}
export function templateInfo(bells) {
  const list = [...(bells || [])].sort((a, b) => String(a.time).localeCompare(String(b.time)));
  return {
    start: list.filter(b => kindOfBell(b) === 'start'),
    end: list.filter(b => kindOfBell(b) === 'end'),
    final: list.filter(b => kindOfBell(b) === 'final'),
    named: list.filter(b => kindOfBell(b) === 'named')
  };
}
function findNamed(T, name) {
  const n = norm(name);
  if (!n) return null;
  const all = [...T.named, ...T.final];
  return all.find(b => norm(b.label).includes(n) || n.includes(norm(b.label)))
    || all.find(b => NAMED_KEYS.some(k => n.includes(k) && norm(b.label).includes(k))) || null;
}
const DEFAULT_BELL = { soundId: 'b:westminster', volume: 100, maxSec: 0, say: '' };
function fromTpl(tpl, time, label, k) {
  const b = { ...(tpl || DEFAULT_BELL) };
  delete b.idx; delete b.key; delete b.at; delete b._open;
  b.time = hmOf(time);
  const num = s => String(s || '').replace(/\d+\s*교시/g, `${k}교시`);
  b.label = (tpl && tpl.label && /\d+\s*교시/.test(tpl.label) && k) ? num(tpl.label) : label;
  if (k && b.say && /\d+\s*교시/.test(b.say)) { const ns = num(b.say); if (ns !== b.say) { b.say = ns; delete b.sayId; } }
  return b;
}
const pick = (arr, k) => arr.length ? arr[Math.min(k, arr.length) - 1] : null;

// 하루 흐름 → 종 목록
export function bellsFromPlan(plan, tplBells) {
  const T = templateInfo(tplBells);
  const out = [];
  let k = 0, lastClassNo = 0;
  const add = (time, b, why) => { if (!out.some(x => x.time === b.time)) out.push(Object.assign(b, { _why: why })); };
  plan.forEach((s, i) => {
    const prev = plan[i - 1];
    // 이어지지 않는 빈틈: 앞 수업이 끝난 시각에 끝 종
    if (prev && prev.endMin < s.startMin && prev.kind === 'class') add(prev.endMin, fromTpl(pick(T.end, lastClassNo), prev.endMin, `${lastClassNo}교시 끝`, lastClassNo), 'end');
    const prevClassEnds = prev && prev.endMin === s.startMin && prev.kind === 'class';
    if (s.kind === 'class') {
      k += 1; lastClassNo = k;
      add(s.startMin, fromTpl(pick(T.start, k), s.startMin, `${k}교시 시작`, k), 'start');
    } else if (s.kind === 'named') {
      const nb = findNamed(T, s.name);
      if (nb) add(s.startMin, fromTpl(nb, s.startMin, nb.label || s.name, 0), 'named');
      else if (prevClassEnds) add(s.startMin, fromTpl(pick(T.end, lastClassNo), s.startMin, `${lastClassNo}교시 끝`, lastClassNo), 'end');
      else add(s.startMin, fromTpl(pick(T.start, 1) || null, s.startMin, s.name || '안내', 0), 'named');
    } else if (prevClassEnds) {
      add(s.startMin, fromTpl(pick(T.end, lastClassNo), s.startMin, `${lastClassNo}교시 끝`, lastClassNo), 'end');
    }
  });
  const last = plan[plan.length - 1];
  if (last) {
    const fin = T.final[0];
    if (fin) add(last.endMin, fromTpl(fin, last.endMin, fin.label || '하교', 0), 'final');
    else if (last.kind === 'class') add(last.endMin, fromTpl(pick(T.end, lastClassNo), last.endMin, `${lastClassNo}교시 끝`, lastClassNo), 'end');
  }
  return out.sort((a, b) => a.time.localeCompare(b.time));
}

// 학년 하나 → 요일별 종, 같은 요일끼리 묶기
export function gradeWeek(snap, grade, tplBells) {
  const days = {};
  for (const d of GY_DAYS) { const plan = dayPlan(snap, grade, d); days[d] = { plan, bells: plan.length ? bellsFromPlan(plan, tplBells) : [] }; }
  const pats = [];
  for (const d of GY_DAYS) {
    const sig = JSON.stringify(days[d].bells.map(({ _why, ...b }) => b));
    const p = pats.find(x => x.sig === sig);
    if (p) p.days.push(d); else pats.push({ sig, days: [d], bells: days[d].bells });
  }
  return { days, patterns: pats };
}
export function daysLabel(ds) {
  const s = ds.join('');
  if (s === '월화수목금') return '월~금';
  if (s === '월화수목') return '월~목';
  if (s === '화수목금') return '화~금';
  if (s === '화수목') return '화~목';
  return ds.join('·');
}
