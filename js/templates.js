// 업종별 샘플 일과표. 공간을 만들 때 고르거나, 일과표 탭에서 "샘플에서 가져오기"로 불러옵니다.

import { pad } from './core.js';

function t(min) { return `${pad(Math.floor(min / 60) % 24)}:${pad(min % 60)}`; }
function m(hhmm) { const [h, mi] = hhmm.split(':').map(Number); return h * 60 + mi; }

// 수업형 일과표 만들기
function lessons({ first, count, len, brk, lunchAfter = 0, lunchLen = 0, lunchLabel = '점심시간', lunchSay = '점심시간입니다.', prefix = '', startSound = 'b:westminster', endSound = 'b:dingdong', extra = [] }) {
  const bells = [];
  let cur = m(first);
  for (let i = 1; i <= count; i++) {
    bells.push({ time: t(cur), label: `${prefix}${i}교시 시작`, soundId: startSound });
    cur += len;
    if (i === lunchAfter) {
      bells.push({ time: t(cur), label: `${prefix}${i}교시 끝 · ${lunchLabel}`, soundId: endSound, say: lunchSay });
      cur += lunchLen;
    } else {
      bells.push({ time: t(cur), label: `${prefix}${i}교시 끝`, soundId: endSound });
      cur += brk;
    }
  }
  return [...bells, ...extra].sort((a, b) => m(a.time) - m(b.time));
}

export const TEMPLATES = [
  {
    id: 'elem', category: 'school', name: '초등학교 (40분 수업)',
    bells: lessons({
      first: '09:00', count: 6, len: 40, brk: 10, lunchAfter: 4, lunchLen: 60,
      extra: [
        { time: '08:40', label: '등교 안내', soundId: 'b:up3', say: '좋은 아침입니다.' },
        { time: '14:50', label: '하교', soundId: 'b:down3', say: '오늘 하루도 수고했어요.' }
      ]
    })
  },
  {
    id: 'elem-short', category: 'school', name: '초등학교 단축 (35분 수업)',
    bells: lessons({ first: '09:00', count: 4, len: 35, brk: 10, lunchAfter: 4, lunchLen: 50 })
  },
  {
    id: 'middle', category: 'school', name: '중학교 (45분 수업)',
    bells: lessons({
      first: '08:50', count: 7, len: 45, brk: 10, lunchAfter: 4, lunchLen: 50,
      extra: [{ time: '08:30', label: '조회', soundId: 'b:up3' }]
    })
  },
  {
    id: 'high', category: 'school', name: '고등학교 (50분 수업)',
    bells: lessons({
      first: '08:40', count: 7, len: 50, brk: 10, lunchAfter: 4, lunchLen: 50,
      extra: [{ time: '08:20', label: '조회', soundId: 'b:up3' }]
    })
  },
  {
    id: 'exam', category: 'school', name: '시험 일과표 (3교시)',
    bells: [
      { time: '08:50', label: '예비령 · 시험지 배부', soundId: 'b:up3', say: '시험 시작 10분 전입니다.' },
      { time: '09:00', label: '1교시 시험 시작', soundId: 'b:westminster' },
      { time: '09:40', label: '종료 10분 전', soundId: 'b:dingdong', say: '시험 종료 10분 전입니다.' },
      { time: '09:50', label: '1교시 시험 끝', soundId: 'b:westminster' },
      { time: '10:10', label: '2교시 시험 시작', soundId: 'b:westminster' },
      { time: '10:50', label: '종료 10분 전', soundId: 'b:dingdong', say: '시험 종료 10분 전입니다.' },
      { time: '11:00', label: '2교시 시험 끝', soundId: 'b:westminster' },
      { time: '11:20', label: '3교시 시험 시작', soundId: 'b:westminster' },
      { time: '12:00', label: '종료 10분 전', soundId: 'b:dingdong', say: '시험 종료 10분 전입니다.' },
      { time: '12:10', label: '3교시 시험 끝', soundId: 'b:westminster' }
    ]
  },
  {
    id: 'academy', category: 'academy', name: '학원 (50분 수업 · 오후)',
    bells: lessons({
      first: '15:00', count: 3, len: 50, brk: 10, lunchAfter: 3, lunchLen: 50, lunchLabel: '저녁 식사', lunchSay: '저녁 시간입니다.',
      startSound: 'b:glock_up', endSound: 'b:dingdong',
      extra: [
        { time: '18:40', label: '4교시 시작', soundId: 'b:glock_up' },
        { time: '19:30', label: '4교시 끝', soundId: 'b:dingdong' },
        { time: '19:40', label: '5교시 시작', soundId: 'b:glock_up' },
        { time: '20:30', label: '5교시 끝 · 귀가', soundId: 'b:down3', say: '오늘도 수고했어요. 조심히 가세요.' }
      ]
    })
  },
  {
    id: 'academy-weekend', category: 'academy', name: '학원 주말 (80분 수업)',
    bells: lessons({ first: '10:00', count: 4, len: 80, brk: 10, lunchAfter: 2, lunchLen: 60, startSound: 'b:glock_up', endSound: 'b:dingdong' })
  },
  {
    id: 'company', category: 'company', name: '회사 (9시 출근 · 6시 퇴근)',
    bells: [
      { time: '08:55', label: '업무 시작 5분 전', soundId: 'b:up3' },
      { time: '09:00', label: '업무 시작', soundId: 'b:westminster', say: '좋은 아침입니다. 업무를 시작합니다.' },
      { time: '10:30', label: '휴식', soundId: 'b:dingdong' },
      { time: '12:00', label: '점심시간', soundId: 'b:up3', say: '점심시간입니다.' },
      { time: '13:00', label: '오후 업무 시작', soundId: 'b:westminster' },
      { time: '15:00', label: '스트레칭', soundId: 'b:glock_up', say: '잠시 일어나서 스트레칭 해볼까요.' },
      { time: '18:00', label: '퇴근', soundId: 'b:down3', say: '오늘도 수고하셨습니다.' }
    ]
  },
  {
    id: 'factory', category: 'company', name: '공장·매장 (교대 휴식)',
    bells: [
      { time: '08:00', label: '작업 시작', soundId: 'b:buzzer' },
      { time: '10:00', label: '휴식 10분', soundId: 'b:dingdong' },
      { time: '10:10', label: '작업 재개', soundId: 'b:buzzer' },
      { time: '12:00', label: '점심시간', soundId: 'b:up3' },
      { time: '13:00', label: '오후 작업 시작', soundId: 'b:buzzer' },
      { time: '15:00', label: '휴식 10분', soundId: 'b:dingdong' },
      { time: '15:10', label: '작업 재개', soundId: 'b:buzzer' },
      { time: '17:00', label: '작업 종료', soundId: 'b:down3' }
    ]
  },
  {
    id: 'church', category: 'church', name: '수련회·캠프 (하루 일정)',
    bells: [
      { time: '07:00', label: '기상', soundId: 'b:glock_up', say: '좋은 아침입니다. 일어날 시간이에요.' },
      { time: '07:30', label: '아침 모임', soundId: 'b:up3' },
      { time: '08:30', label: '아침 식사', soundId: 'b:dingdong' },
      { time: '10:00', label: '오전 모임', soundId: 'b:westminster' },
      { time: '12:30', label: '점심 식사', soundId: 'b:dingdong' },
      { time: '14:00', label: '오후 활동', soundId: 'b:westminster' },
      { time: '18:00', label: '저녁 식사', soundId: 'b:dingdong' },
      { time: '19:30', label: '저녁 모임', soundId: 'b:westminster' },
      { time: '22:30', label: '취침', soundId: 'b:down3', say: '오늘 하루 수고했어요. 잘 자요.' }
    ]
  }
];

export const TEMPLATE_GROUPS = [
  { category: 'school', label: '학교' },
  { category: 'academy', label: '학원' },
  { category: 'company', label: '회사·공장' },
  { category: 'church', label: '교회·수련회' }
];

// 공간을 만들 때 기본으로 넣을 일과표 묶음과 요일 패턴
export function starterFor(type, schoolLevel) {
  if (type === 'school') {
    const main = schoolLevel || 'elem';
    const ids = [main, main === 'elem' ? 'elem-short' : null, 'exam'].filter(Boolean);
    return { ids, weekday: main, friday: main };
  }
  if (type === 'academy') return { ids: ['academy', 'academy-weekend'], weekday: 'academy', friday: 'academy', saturday: 'academy-weekend' };
  if (type === 'company') return { ids: ['company'], weekday: 'company', friday: 'company' };
  if (type === 'church') return { ids: ['church'], weekday: null, friday: null };
  return { ids: ['company'], weekday: 'company', friday: 'company' };
}

export function templateById(id) { return TEMPLATES.find(x => x.id === id); }
