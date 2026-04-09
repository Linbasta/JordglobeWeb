import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
    apiKey: 'AIzaSyDkYOnZ1lUM0d8zcYh_NquDCwsSnsjOfHY',
    authDomain: 'geotest-319417.firebaseapp.com',
    databaseURL: 'https://geotest-319417-default-rtdb.europe-west1.firebasedatabase.app',
    projectId: 'geotest-319417',
    storageBucket: 'geotest-319417.appspot.com',
    messagingSenderId: '572898739586',
    appId: '1:572898739586:web:4cf0ac19a74a1e6b72bb9b',
    measurementId: 'G-HFQQ54DL8H',
};

const app = initializeApp(firebaseConfig);

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

// Sign in anonymously on load. Firestore rules require request.auth != null,
// so callers must `await authReady` before any read/write.
export const authReady = new Promise<void>((resolve) => {
    onAuthStateChanged(auth, (user) => {
        if (user) resolve();
    });
    signInAnonymously(auth).catch((err) => {
        console.error('Anonymous sign-in failed:', err);
    });
});
