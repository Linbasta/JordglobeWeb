import { auth } from './firebase'

const KEY_PREFIX = 'jordglobe_username_'

export function getCachedUsername(): string | null {
    const uid = auth.currentUser?.uid
    if (!uid) return null
    return localStorage.getItem(KEY_PREFIX + uid)
}

export function setCachedUsername(username: string): void {
    const uid = auth.currentUser?.uid
    if (!uid) return
    localStorage.setItem(KEY_PREFIX + uid, username)
}
