// 벨키퍼 홈 화면 — 로그인·로그아웃, 종소리 들어보기
import * as F from './fb.js';
import { escapeHtml as h } from './core.js';
import { BUILTIN_SOUNDS, playBell, stopAll, unlockAudio } from './sounds.js';

// 예전 공유 링크(index.html?share=…)는 관리자 화면으로 넘겨줌
const share = new URLSearchParams(location.search).get('share');
if (share) location.replace('app.html?share=' + encodeURIComponent(share));

const PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
const PICK = ['b:westminster', 'b:dingdong', 'b:airport', 'b:church', 'b:handbell', 'b:windchime', 'b:elise_box', 'b:brahms', 'b:joy', 'b:canon', 'b:phone', 'b:notify_bright', 'b:buzzer', 'b:bowl'];
const chips = document.getElementById('sound-chips');
chips.innerHTML = PICK.map(id => BUILTIN_SOUNDS.find(s => s.id === id)).filter(Boolean)
  .map(s => `<button class="chip" data-sound="${s.id}">${PLAY}${h(s.name)}</button>`).join('')
  + '<button class="chip" data-sound="stop">■ 멈추기</button>';

function inApp() { return /KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line\//i.test(navigator.userAgent); }

async function login() {
  if (inApp()) { alert('카카오톡 같은 앱 안의 브라우저에서는 구글 로그인이 막혀요. 오른쪽 위 메뉴에서 "다른 브라우저로 열기"를 눌러주세요.'); return; }
  const provider = new F.GoogleAuthProvider();
  try {
    await F.signInWithPopup(F.auth, provider);
    location.href = 'app.html';
  } catch (e) {
    if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')) {
      location.href = 'app.html?login=1';
    } else if (e && e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
      alert('로그인하지 못했어요. 잠시 뒤 다시 시도해주세요.');
      console.error(e);
    }
  }
}

function renderAccount(user) {
  const nav = document.getElementById('nav-account');
  const cta = document.getElementById('hero-cta');
  if (user && !user.isAnonymous) {
    const name = user.displayName || user.email || '';
    nav.innerHTML = `<span class="small muted ellipsis" style="max-width:40vw">${h(user.email || '')}</span>
      <a class="btn primary" href="app.html">관리자 화면</a>
      <button class="btn" data-home="logout">로그아웃</button>`;
    cta.innerHTML = `<a class="btn gold" href="app.html">${h(name)}님, 관리자 화면 열기</a>
      <a class="btn" href="play.html">이 기기를 재생기로 쓰기</a>`;
  } else {
    nav.innerHTML = `<button class="btn primary" data-home="login">로그인</button>`;
    cta.innerHTML = `<button class="btn gold" data-home="login">Google 계정으로 시작하기</button>
      <a class="btn" href="play.html">이 기기를 재생기로 쓰기</a>`;
  }
}

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-home],[data-sound]');
  if (!b) return;
  if (b.dataset.home === 'login') return login();
  if (b.dataset.home === 'logout') { await F.signOut(F.auth); return; }
  if (b.dataset.sound) {
    await unlockAudio();
    if (b.dataset.sound === 'stop') return stopAll();
    playBell({ soundId: b.dataset.sound, volume: 90 });
  }
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
if (F.configured) F.onAuthStateChanged(F.auth, renderAccount);
