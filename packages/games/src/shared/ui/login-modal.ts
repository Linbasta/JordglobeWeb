/**
 * Login Modal — FirebaseUI-powered sign-in overlay.
 * Reusable from any context (leaderboard, settings, etc.).
 */

import { t } from '../i18n/i18n'
import { firebaseConfig } from '../firebase'

let backdrop: HTMLDivElement | null = null
let uiInstance: any = null // firebaseui.auth.AuthUI
let compatInitialized = false

export interface LoginModalConfig {
    onSuccess: () => void
    onCancel: () => void
}

export async function showLoginModal(config: LoginModalConfig): Promise<void> {
    hideLoginModal()

    const [firebase, firebaseui] = await Promise.all([
        import('firebase/compat/app').then(m => m.default),
        import('firebaseui'),
        import('firebase/compat/auth'),
        import('firebaseui/dist/firebaseui.css'),
    ])

    // Initialize the compat app once (modular and compat SDKs have separate registries)
    if (!compatInitialized) {
        firebase.initializeApp(firebaseConfig)
        compatInitialized = true
    }
    const compatAuth = firebase.app().auth()

    const styleId = 'login-modal-styles'
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style')
        style.id = styleId
        style.textContent = `
            .lm-backdrop { position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:400;opacity:0;transition:opacity 0.3s ease-in-out; }
            .lm-card { width:380px;max-width:calc(100vw - 32px);background:linear-gradient(180deg,#1a3a5c 0%,#0f2744 100%);border-radius:16px;padding:28px 24px;text-align:center;position:relative;box-shadow:0 8px 32px rgba(0,0,0,0.5);transform:scale(0.9);opacity:0;transition:transform 0.3s ease-out,opacity 0.3s ease-out; }
            .lm-title { font-size:20px;font-weight:bold;color:#fff;margin-bottom:8px;font-family:Arial,sans-serif; }
            .lm-subtitle { font-size:14px;color:#a0c4e0;margin-bottom:20px;font-family:Arial,sans-serif; }
            .lm-cancel { display:inline-block;margin-top:16px;padding:8px 20px;background:transparent;border:1px solid rgba(255,255,255,0.3);border-radius:8px;color:#a0c4e0;font-size:14px;cursor:pointer;font-family:Arial,sans-serif;transition:background 0.15s; }
            .lm-cancel:hover { background:rgba(255,255,255,0.1); }
            .lm-firebaseui { margin:0 auto; }
        `
        document.head.appendChild(style)
    }

    backdrop = document.createElement('div')
    backdrop.className = 'lm-backdrop'

    const card = document.createElement('div')
    card.className = 'lm-card'

    card.innerHTML = `
        <div class="lm-title">${t('login.prompt')}</div>
        <div class="lm-subtitle"></div>
        <div class="lm-firebaseui" id="login-modal-firebaseui"></div>
        <button class="lm-cancel">${t('login.cancel')}</button>
    `

    const cancelBtn = card.querySelector('.lm-cancel') as HTMLButtonElement
    cancelBtn.addEventListener('click', () => {
        hideLoginModal()
        config.onCancel()
    })

    backdrop.appendChild(card)
    document.body.appendChild(backdrop)

    // Animate in
    requestAnimationFrame(() => {
        backdrop!.style.opacity = '1'
        card.style.transform = 'scale(1)'
        card.style.opacity = '1'
    })

    // FirebaseUI config
    const uiConfig = {
        signInOptions: [
            {
                provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
                requireDisplayName: false,
            },
            firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            { provider: 'apple.com' },
        ],
        signInFlow: 'popup',
        callbacks: {
            signInSuccessWithAuthResult() {
                hideLoginModal()
                config.onSuccess()
                return false
            },
            signInFailure(error: any) {
                console.warn('Login modal sign-in error:', error.message)
            },
        },
    }

    // Reuse existing AuthUI instance or create a new one
    uiInstance = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(compatAuth)
    uiInstance.start('#login-modal-firebaseui', uiConfig)
}

export function hideLoginModal(): void {
    if (uiInstance) {
        uiInstance.reset()
    }
    if (backdrop) {
        backdrop.remove()
        backdrop = null
    }
}
