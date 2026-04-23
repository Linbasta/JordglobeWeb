/**
 * Login Modal — FirebaseUI sign-in + account creation (username selection).
 *
 * Flow:
 * 1. FirebaseUI handles Firebase auth (email, Google, Apple)
 * 2. Call userLogin mutation — if true, account exists → done
 * 3. If null — show username input, call userCreate → done
 */

import { t } from '../i18n/i18n'
import { auth, firebaseConfig } from '../firebase'
import { config } from '../../config'

let backdrop: HTMLDivElement | null = null
let uiInstance: any = null // firebaseui.auth.AuthUI
let compatInitialized = false

export interface LoginModalConfig {
    onSuccess: () => void
    onCancel: () => void
}

// ── GraphQL helpers ──

async function graphql(query: string, variables: Record<string, unknown>): Promise<any> {
    const user = auth.currentUser
    if (!user) throw new Error('Not authenticated')
    const idToken = await user.getIdToken()
    const res = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
            'X-Client-Version': '1.0.61',
        },
        body: JSON.stringify({ query, variables }),
    })
    const json = await res.json()
    if (json.errors?.length) {
        const err = json.errors[0]
        const e = new Error(err.message) as any
        e.code = err.extensions?.code ?? 'UNKNOWN'
        throw e
    }
    return json.data
}

async function checkAccount(): Promise<boolean> {
    const data = await graphql(
        `mutation UserLogin($playerUserId: String!) { userLogin(playerUserId: $playerUserId) }`,
        { playerUserId: auth.currentUser!.uid },
    )
    return data.userLogin === true
}

async function createAccount(username: string): Promise<void> {
    const language = navigator.language.split('-')[0] || 'en'
    await graphql(
        `mutation UserCreate($playerUserId: String!, $language: String!, $username: String!) {
            userCreate(playerUserId: $playerUserId, language: $language, username: $username)
        }`,
        { playerUserId: auth.currentUser!.uid, language, username },
    )
}

// ── Username validation ──

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,20}$/

function validateUsername(value: string): string | null {
    if (value.length < 3) return t('login.usernameTooShort')
    if (value.length > 20) return t('login.usernameTooLong')
    if (!USERNAME_RE.test(value)) return t('login.usernameInvalid')
    return null
}

// ── Modal ──

export async function showLoginModal(modalConfig: LoginModalConfig): Promise<void> {
    hideLoginModal()

    const [firebase, firebaseui] = await Promise.all([
        import('firebase/compat/app').then(m => m.default),
        import('firebaseui'),
        import('firebase/compat/auth'),
        import('firebaseui/dist/firebaseui.css'),
    ])

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
            .lm-username-section { display:none; }
            .lm-username-input { width:100%;padding:10px 14px;margin-bottom:6px;border:1px solid rgba(255,255,255,0.25);border-radius:8px;background:rgba(0,0,0,0.3);color:#fff;font-size:15px;font-family:Arial,sans-serif;box-sizing:border-box; }
            .lm-username-input:focus { outline:none;border-color:#2a7fff; }
            .lm-username-hint { font-size:12px;color:#7eb8e0;margin-bottom:12px;font-family:Arial,sans-serif; }
            .lm-username-error { font-size:13px;color:#ff6b6b;margin-bottom:8px;min-height:1.2em;font-family:Arial,sans-serif; }
            .lm-username-submit { padding:10px 28px;background:#2a7fff;border:none;border-radius:8px;color:#fff;font-size:15px;font-weight:bold;cursor:pointer;font-family:Arial,sans-serif;transition:background 0.15s; }
            .lm-username-submit:hover { background:#3d8fff; }
            .lm-username-submit:disabled { opacity:0.5;cursor:not-allowed; }
            .lm-spinner { display:inline-block;width:20px;height:20px;border:2px solid rgba(255,255,255,0.2);border-top-color:#fff;border-radius:50%;animation:lm-spin 0.6s linear infinite;vertical-align:middle;margin-left:8px; }
            @keyframes lm-spin { to { transform:rotate(360deg); } }
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
        <div class="lm-username-section">
            <div class="lm-title">${t('login.chooseUsername')}</div>
            <input class="lm-username-input" type="text" placeholder="${t('login.usernamePlaceholder')}" maxlength="20" />
            <div class="lm-username-hint">${t('login.usernameHint')}</div>
            <div class="lm-username-error"></div>
            <button class="lm-username-submit" type="button">${t('login.createAccount')}</button>
        </div>
        <button class="lm-cancel">${t('login.cancel')}</button>
    `

    const firebaseuiEl = card.querySelector('.lm-firebaseui') as HTMLElement
    const usernameSection = card.querySelector('.lm-username-section') as HTMLElement
    const usernameInput = card.querySelector('.lm-username-input') as HTMLInputElement
    const usernameError = card.querySelector('.lm-username-error') as HTMLElement
    const usernameSubmit = card.querySelector('.lm-username-submit') as HTMLButtonElement
    const cancelBtn = card.querySelector('.lm-cancel') as HTMLButtonElement

    cancelBtn.addEventListener('click', () => {
        hideLoginModal()
        modalConfig.onCancel()
    })

    // After Firebase auth succeeds, check if account exists
    async function onFirebaseAuthDone() {
        // Hide FirebaseUI, show a loading state
        firebaseuiEl.style.display = 'none'
        const subtitle = card.querySelector('.lm-subtitle') as HTMLElement
        subtitle.innerHTML = `<span class="lm-spinner"></span>`

        try {
            const exists = await checkAccount()
            if (exists) {
                hideLoginModal()
                modalConfig.onSuccess()
            } else {
                // Show username selection
                subtitle.textContent = ''
                usernameSection.style.display = 'block'
                usernameInput.focus()
            }
        } catch (e: any) {
            console.warn('Account check failed:', e)
            subtitle.textContent = e.message
        }
    }

    // Username input validation
    usernameInput.addEventListener('input', () => {
        const val = usernameInput.value
        if (!val) {
            usernameError.textContent = ''
        } else {
            const err = validateUsername(val)
            usernameError.textContent = err ?? ''
        }
    })

    // Username submit
    usernameSubmit.addEventListener('click', async () => {
        const username = usernameInput.value.trim()
        const err = validateUsername(username)
        if (err) {
            usernameError.textContent = err
            return
        }

        usernameSubmit.disabled = true
        usernameSubmit.innerHTML = `${t('login.createAccount')}<span class="lm-spinner"></span>`
        usernameError.textContent = ''

        try {
            await createAccount(username)
            hideLoginModal()
            modalConfig.onSuccess()
        } catch (e: any) {
            usernameSubmit.disabled = false
            usernameSubmit.textContent = t('login.createAccount')
            if (e.code === 'UsernameTakenError') {
                usernameError.textContent = t('login.usernameTaken')
            } else if (e.code === 'InvalidUsernameError') {
                usernameError.textContent = e.message
            } else {
                usernameError.textContent = e.message
            }
        }
    })

    backdrop.appendChild(card)
    document.body.appendChild(backdrop)

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
                onFirebaseAuthDone()
                return false
            },
            signInFailure(error: any) {
                console.warn('Login modal sign-in error:', error.message)
            },
        },
    }

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
