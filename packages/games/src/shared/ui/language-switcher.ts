import { getAvailableLocales, getLocale, setLocale } from '../i18n/i18n'

const CONTAINER_ID = 'jg-lang-switcher'
const STYLE_ID = 'jg-lang-switcher-styles'

export function mountLanguageSwitcher(): void {
    const locales = getAvailableLocales()
    if (locales.length < 2) return
    if (document.getElementById(CONTAINER_ID)) return

    ensureStyles()

    const active = getLocale()

    const container = document.createElement('div')
    container.id = CONTAINER_ID
    container.className = 'jg-ls-container'

    const button = document.createElement('button')
    button.className = 'jg-ls-button'
    button.textContent = `${active.toUpperCase()} ▾`

    const menu = document.createElement('div')
    menu.className = 'jg-ls-menu'
    menu.style.display = 'none'

    for (const loc of locales) {
        const item = document.createElement('button')
        item.className = 'jg-ls-item' + (loc.code === active ? ' active' : '')
        item.textContent = loc.label
        item.addEventListener('click', (e) => {
            e.stopPropagation()
            if (loc.code !== active) setLocale(loc.code)
        })
        menu.appendChild(item)
    }

    button.addEventListener('click', (e) => {
        e.stopPropagation()
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none'
    })

    document.addEventListener('click', () => {
        menu.style.display = 'none'
    })

    container.appendChild(button)
    container.appendChild(menu)
    document.body.appendChild(container)
}

function ensureStyles(): void {
    if (document.getElementById(STYLE_ID)) return
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = `
        .jg-ls-container { position:fixed; top:12px; right:12px; z-index:150; font-family:Arial,sans-serif; }
        .jg-ls-button { padding:8px 14px; background:rgba(15,39,68,0.9); border:1px solid rgba(255,255,255,0.25); border-radius:8px; color:#fff; font-size:13px; font-weight:bold; cursor:pointer; transition:background 0.15s; }
        .jg-ls-button:hover { background:rgba(26,58,92,0.95); }
        .jg-ls-menu { position:absolute; top:100%; right:0; margin-top:4px; background:rgba(15,39,68,0.95); border:1px solid rgba(255,255,255,0.25); border-radius:8px; padding:4px; min-width:140px; box-shadow:0 4px 12px rgba(0,0,0,0.3); }
        .jg-ls-item { display:block; width:100%; padding:8px 12px; background:transparent; border:none; color:#fff; font-size:13px; text-align:left; cursor:pointer; border-radius:4px; font-family:Arial,sans-serif; }
        .jg-ls-item:hover { background:rgba(255,255,255,0.1); }
        .jg-ls-item.active { color:#7cf6ff; font-weight:bold; }
        @media (orientation: portrait) {
            .jg-ls-container { display:none; }
        }
    `
    document.head.appendChild(style)
}
