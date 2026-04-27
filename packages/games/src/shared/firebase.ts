import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { clearLocalUserData } from './local-user-data';

export const firebaseConfig = {
    apiKey: 'AIzaSyDkYOnZ1lUM0d8zcYh_NquDCwsSnsjOfHY',
    authDomain: 'geotest-319417.firebaseapp.com',
    databaseURL: 'https://geotest-319417-default-rtdb.europe-west1.firebasedatabase.app',
    projectId: 'geotest-319417',
    storageBucket: 'geotest-319417.appspot.com',
    messagingSenderId: '572898739586',
    appId: '1:572898739586:web:4cf0ac19a74a1e6b72bb9b',
    measurementId: 'G-HFQQ54DL8H',
};

export const app = initializeApp(firebaseConfig);

// App Check — only in production, and only if a reCAPTCHA site key is configured.
// To enable: register the web app in Firebase Console → App Check with reCAPTCHA v3,
// then set RECAPTCHA_SITE_KEY below.
const RECAPTCHA_SITE_KEY = '';
if (RECAPTCHA_SITE_KEY && location.hostname !== 'localhost') {
    initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true,
    });
}

export const db = getFirestore(app, 'webversion');
export const auth = getAuth(app);

// Resolves once Firebase has determined the initial auth state (user may be null).
// Callers must `await authReady` before checking auth.currentUser.
export const authReady = new Promise<void>((resolve) => {
    const unsub = onAuthStateChanged(auth, () => {
        unsub();
        resolve();
    });
});

// Clear user-tied localStorage on sign-out (or on switching accounts). The
// initial null→user transition on page load does not trigger; only transitions
// from a known uid to a different uid (or to null) do.
let lastKnownUid: string | null = null;
onAuthStateChanged(auth, (user) => {
    const newUid = user?.uid ?? null;
    if (lastKnownUid !== null && newUid !== lastKnownUid) {
        clearLocalUserData();
    }
    lastKnownUid = newUid;
});

/** True if the current user is signed in with a real provider (not anonymous). */
export function isRealUser(): boolean {
    const u = auth.currentUser;
    return u !== null && !u.isAnonymous;
}
