/**
 * Confetti effect — canvas-based particle system with 3D-like flutter
 *
 * Two "cannons" fire from behind the bottom corners of a card element.
 * Canvas and static particle properties are pre-instantiated at module load
 * so startConfetti() is essentially free.
 */

// ── Config ──
const COLORS = ['#22BEFF', '#7CF6FF', '#22FF40']
const PARTICLES_PER_CANNON = 18
const DEFAULT_BURST_COUNT = 2
const MAX_BURST_COUNT = 10
const BURST_INTERVAL = 150
const GRAVITY = 0.7
const DECAY = 0.97
const WOBBLE_AMPLITUDE = 2.5
const WOBBLE_FREQUENCY = 0.14

// ── Pre-allocated canvas (created once, reused) ──
const canvas = document.createElement('canvas')
canvas.style.cssText = 'position:absolute;inset:0;pointer-events:none;display:none;will-change:transform;'
const ctx = canvas.getContext('2d', { alpha: true })!

// ── State ──
let rafId = 0
let burstTimers: number[] = []
let particleCount = 0

// Rain state (portrait mode — continuous spawn inside tick loop)
let rainActive = false
let rainEndTime = 0
let rainWidth = 0
let rainRate = 0  // particles per frame

// Enough for cannon mode (2 × 10 × 18 = 360) or rain mode (30 waves × 36 ≈ 1080)
const MAX_PARTICLES = 1200

// Dynamic arrays (reset each launch)
const px = new Float32Array(MAX_PARTICLES)
const py = new Float32Array(MAX_PARTICLES)
const pvx = new Float32Array(MAX_PARTICLES)
const pvy = new Float32Array(MAX_PARTICLES)
const ptilt = new Float32Array(MAX_PARTICLES)
const pwobblePhase = new Float32Array(MAX_PARTICLES)
// Static arrays (randomized once at module load)
const ptiltSpeed = new Float32Array(MAX_PARTICLES)
const pwobbleSpeed = new Float32Array(MAX_PARTICLES)
const pw = new Float32Array(MAX_PARTICLES)
const ph = new Float32Array(MAX_PARTICLES)
const pshape = new Uint8Array(MAX_PARTICLES)
const pcolorIdx = new Uint8Array(MAX_PARTICLES)

// Pre-randomize static properties
for (let i = 0; i < MAX_PARTICLES; i++) {
    const s = Math.floor(Math.random() * 3)
    pshape[i] = s
    if (s === 2) {
        pw[i] = 2 + Math.random() * 3
        ph[i] = 14 + Math.random() * 12
    } else {
        pw[i] = 8 + Math.random() * 8
        ph[i] = 5 + Math.random() * 5
    }
    ptiltSpeed[i] = 0.03 + Math.random() * 0.08
    if (Math.random() > 0.5) ptiltSpeed[i] *= -1
    pwobbleSpeed[i] = WOBBLE_FREQUENCY * (0.7 + Math.random() * 0.6)
    pcolorIdx[i] = Math.floor(Math.random() * COLORS.length)
}

/** Spawn particles from a single cannon point */
function spawnCannon(originX: number, originY: number, aimAngle: number, spread: number): void {
    const base = particleCount
    const count = Math.min(PARTICLES_PER_CANNON, MAX_PARTICLES - base)
    if (count <= 0) return

    for (let i = 0; i < count; i++) {
        const idx = base + i
        px[idx] = originX + (Math.random() - 0.5) * 10
        py[idx] = originY + (Math.random() - 0.5) * 10

        const angle = aimAngle + (Math.random() - 0.5) * spread
        const speed = 14 + Math.random() * 14
        pvx[idx] = Math.cos(angle) * speed
        pvy[idx] = Math.sin(angle) * speed

        ptilt[idx] = Math.random() * Math.PI * 2
        pwobblePhase[idx] = Math.random() * Math.PI * 2
    }

    particleCount = base + count
}

/** Spawn both cannons from the bottom corners of the card rect */
function spawnBothCannons(cardRect: DOMRect): void {
    const bottomY = cardRect.bottom - cardRect.height * 0.3
    spawnCannon(cardRect.left, bottomY, -Math.PI * 0.65, 0.8)
    spawnCannon(cardRect.right, bottomY, -Math.PI * 0.35, 0.8)
}

/** Spawn a few rain particles at the top of the screen (called every frame during rain) */
function spawnRainParticles(count: number, screenWidth: number): void {
    for (let i = 0; i < count; i++) {
        if (particleCount >= MAX_PARTICLES) return
        const idx = particleCount++
        px[idx] = Math.random() * screenWidth
        py[idx] = -10 - Math.random() * 30

        pvx[idx] = (Math.random() - 0.5) * 2
        pvy[idx] = 1 + Math.random() * 2

        ptilt[idx] = Math.random() * Math.PI * 2
        pwobblePhase[idx] = Math.random() * Math.PI * 2
    }
}

function tick(): void {
    // Continuous rain spawning
    if (rainActive && performance.now() < rainEndTime) {
        spawnRainParticles(rainRate, rainWidth)
    } else {
        rainActive = false
    }

    const cw = canvas.width
    const ch = canvas.height
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, cw, ch)

    let alive = false

    for (let i = 0; i < particleCount; i++) {
        pvy[i] += GRAVITY
        pvx[i] *= DECAY
        pvy[i] *= DECAY
        px[i] += pvx[i] + Math.sin(pwobblePhase[i]) * WOBBLE_AMPLITUDE
        py[i] += pvy[i]
        ptilt[i] += ptiltSpeed[i]
        pwobblePhase[i] += pwobbleSpeed[i]

        // Skip particles that left the screen
        if (py[i] > ch + 30 || py[i] < -50 || px[i] < -50 || px[i] > cw + 50) continue
        alive = true

        const tiltScale = Math.abs(Math.cos(ptilt[i]))
        const drawW = Math.max(1, pw[i] * tiltScale)

        const r = ptilt[i] * 0.4
        const cos = Math.cos(r)
        const sin = Math.sin(r)
        ctx.setTransform(cos, sin, -sin, cos, px[i], py[i])
        ctx.fillStyle = COLORS[pcolorIdx[i]]
        ctx.fillRect(-drawW / 2, -ph[i] / 2, drawW, ph[i])
    }

    if (alive || rainActive) {
        rafId = requestAnimationFrame(tick)
    }
}

/**
 * Start confetti from two cannons behind a card element.
 * @param parent - full-screen container to append canvas to
 * @param card - the card element; cannons fire from its bottom corners
 * @param bursts - number of burst waves (default 2, max 6)
 */
export function startConfetti(parent: HTMLElement, card?: HTMLElement, bursts?: number): void {
    stopConfetti()

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    canvas.style.display = 'block'
    parent.appendChild(canvas)

    const cardRect = card
        ? card.getBoundingClientRect()
        : new DOMRect(
            (canvas.width - 320) / 2,
            (canvas.height - 400) / 2,
            320,
            400
        )

    const isPortrait = window.innerHeight > window.innerWidth
    const burstCount = Math.min(bursts ?? DEFAULT_BURST_COUNT, MAX_BURST_COUNT)

    if (isPortrait) {
        // Rain mode: continuous spawn for a duration, more bursts = longer + denser
        rainActive = true
        rainWidth = canvas.width
        rainRate = Math.max(1, Math.round(burstCount / 2))  // 1-5 particles per frame
        rainEndTime = performance.now() + 1500 + burstCount * 400  // 2.3s to 5.5s
    } else {
        // Cannon mode: timed volleys from card corners
        for (let b = 0; b < burstCount; b++) {
            if (b === 0) {
                spawnBothCannons(cardRect)
            } else {
                const timer = window.setTimeout(() => {
                    spawnBothCannons(cardRect)
                }, b * BURST_INTERVAL)
                burstTimers.push(timer)
            }
        }
    }

    rafId = requestAnimationFrame(tick)
}

export function stopConfetti(): void {
    cancelAnimationFrame(rafId)
    for (const t of burstTimers) clearTimeout(t)
    rafId = 0
    burstTimers = []
    particleCount = 0
    rainActive = false
    canvas.style.display = 'none'
    if (canvas.parentElement) canvas.parentElement.removeChild(canvas)
}
