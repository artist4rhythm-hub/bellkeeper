// Firebase 연결 (관리자·재생기 공통)
import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  signInAnonymously, onAuthStateChanged, signOut
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, orderBy, limit, serverTimestamp, Timestamp, writeBatch
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
  getStorage, ref as sRef, uploadBytesResumable, getDownloadURL, deleteObject
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

export const configured = !String(firebaseConfig.apiKey || '').includes('여기에');

// 재생기 화면은 이름이 다른 앱으로 띄워서, 같은 브라우저에서 관리자 로그인과 섞이지 않게 합니다.
export const app = initializeApp(firebaseConfig, (typeof window !== 'undefined' && window.BK_APP_NAME) || '[DEFAULT]');
export const auth = getAuth(app);

let _db;
try {
  _db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
} catch (e) {
  _db = initializeFirestore(app, {});
}
export const db = _db;
export const storage = getStorage(app);

export {
  GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signInAnonymously,
  onAuthStateChanged, signOut,
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, orderBy, limit, serverTimestamp, Timestamp, writeBatch,
  sRef, uploadBytesResumable, getDownloadURL, deleteObject
};

// 서버 시각과 이 기기 시계의 차이(ms) — 기기 시계가 틀려도 정확하게 울리도록
// 기기 문서에 서버 시각을 기록하고 되읽어서 계산합니다.
export async function measureServerOffset(docRef) {
  const t0 = Date.now();
  await setDoc(docRef, { lastSeen: serverTimestamp() }, { merge: true });
  const snap = await getDoc(docRef);
  const t1 = Date.now();
  const ts = snap.get('lastSeen');
  if (!ts || typeof ts.toMillis !== 'function') return null;
  // 서버 기록 시점 ≈ 쓰기 왕복의 중간
  return { offset: ts.toMillis() - (t0 + (t1 - t0) / 4), rtt: t1 - t0 };
}
