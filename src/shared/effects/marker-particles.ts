/**
 * Marker Particles - Correct-answer celebration burst
 *
 * Fire-and-forget particle burst at a world position on the globe.
 * Uses Babylon.js ParticleSystem with a procedural circle texture.
 */

import { Scene } from '@babylonjs/core/scene'
import { Vector3, Color4 } from '@babylonjs/core/Maths/math'
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'

// Lazily-created shared circle texture (one per scene)
let cachedTexture: Texture | null = null
let cachedScene: Scene | null = null

function getCircleTexture(scene: Scene): Texture {
    if (cachedTexture && cachedScene === scene) return cachedTexture

    // 32x32 white circle with soft edges, encoded as a data URL
    const size = 32
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    const center = size / 2
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.6, 'rgba(255,255,255,0.8)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)

    cachedTexture = new Texture(canvas.toDataURL(), scene, false, false)
    cachedScene = scene
    return cachedTexture
}

/** Tunable parameters for the particle burst */
export interface BurstOptions {
    count?: number
    lifetimeMin?: number
    lifetimeMax?: number
    emitDurationMs?: number
    minEmitPower?: number
    maxEmitPower?: number
    spread?: number
    sizeMin?: number
    sizeMax?: number
    sizePeak?: number
    gravity?: number
}

// Defaults
const DEFAULTS: Required<BurstOptions> = {
    count: 10,
    lifetimeMin: 0.05,
    lifetimeMax: 0.44,
    emitDurationMs: 20,
    minEmitPower: 0.04,
    maxEmitPower: 0.25,
    spread: 1,
    sizeMin: 0.0002,
    sizeMax: 0.05,
    sizePeak: 0.0282,
    gravity: 1.05,
}

/**
 * Spawn a short-lived celebratory particle burst at a world position.
 * Fully fire-and-forget — no cleanup needed by the caller.
 */
export function burstAtPosition(scene: Scene, position: Vector3, opts?: BurstOptions): void {
    const o = { ...DEFAULTS, ...opts }

    const ps = new ParticleSystem('markerBurst', o.count, scene)

    ps.particleTexture = getCircleTexture(scene)

    // Emit from the exact marker world position (point emitter)
    ps.emitter = position.clone()
    ps.minEmitBox = Vector3.Zero()
    ps.maxEmitBox = Vector3.Zero()

    // Direction: outward along the surface normal (position is on a unit sphere)
    const normal = position.normalizeToNew()

    // Cone along surface normal
    const sp = o.spread
    ps.direction1 = normal.add(new Vector3(-sp, -sp, -sp))
    ps.direction2 = normal.add(new Vector3(sp, sp, sp))

    // Speed
    ps.minEmitPower = o.minEmitPower
    ps.maxEmitPower = o.maxEmitPower

    // Lifetime
    ps.minLifeTime = o.lifetimeMin
    ps.maxLifeTime = o.lifetimeMax

    // Size
    ps.minSize = o.sizeMin
    ps.maxSize = o.sizeMax
    ps.addSizeGradient(0, o.sizeMin, o.sizeMin * 2)
    ps.addSizeGradient(0.3, o.sizePeak * 0.6, o.sizePeak)
    ps.addSizeGradient(1.0, o.sizeMin * 0.5, o.sizeMin)

    // Colors: green/gold celebration
    ps.addColorGradient(0, new Color4(0.2, 0.9, 0.3, 1.0), new Color4(1.0, 0.85, 0.1, 1.0))
    ps.addColorGradient(0.5, new Color4(0.3, 1.0, 0.4, 0.9), new Color4(1.0, 0.9, 0.2, 0.9))
    ps.addColorGradient(1.0, new Color4(0.2, 0.8, 0.3, 0.0), new Color4(0.9, 0.8, 0.1, 0.0))

    // Gravity along normal
    ps.gravity = normal.scale(o.gravity)

    // Emit all at once (burst mode)
    ps.emitRate = o.count / (o.emitDurationMs / 1000)
    ps.targetStopDuration = o.emitDurationMs / 1000

    // Blending
    ps.blendMode = ParticleSystem.BLENDMODE_ADD

    ps.start()

    // Dispose after all particles have died (don't dispose the shared texture)
    const disposeDelay = o.emitDurationMs + o.lifetimeMax * 1000 + 200
    setTimeout(() => {
        try { ps.dispose(false) } catch { /* already disposed */ }
    }, disposeDelay)
}

/**
 * Red/orange particle burst for wrong answers.
 * Same mechanics as burstAtPosition but with error-colored gradient.
 */
export function wrongBurstAtPosition(scene: Scene, position: Vector3, opts?: BurstOptions): void {
    const o = { ...DEFAULTS, ...opts }

    const ps = new ParticleSystem('markerWrongBurst', o.count, scene)

    ps.particleTexture = getCircleTexture(scene)

    ps.emitter = position.clone()
    ps.minEmitBox = Vector3.Zero()
    ps.maxEmitBox = Vector3.Zero()

    const normal = position.normalizeToNew()

    const sp = o.spread
    ps.direction1 = normal.add(new Vector3(-sp, -sp, -sp))
    ps.direction2 = normal.add(new Vector3(sp, sp, sp))

    ps.minEmitPower = o.minEmitPower
    ps.maxEmitPower = o.maxEmitPower

    ps.minLifeTime = o.lifetimeMin
    ps.maxLifeTime = o.lifetimeMax

    ps.minSize = o.sizeMin
    ps.maxSize = o.sizeMax
    ps.addSizeGradient(0, o.sizeMin, o.sizeMin * 2)
    ps.addSizeGradient(0.3, o.sizePeak * 0.6, o.sizePeak)
    ps.addSizeGradient(1.0, o.sizeMin * 0.5, o.sizeMin)

    // Colors: red/orange wrong-answer
    ps.addColorGradient(0, new Color4(1.0, 0.2, 0.1, 1.0), new Color4(1.0, 0.5, 0.1, 1.0))
    ps.addColorGradient(0.5, new Color4(1.0, 0.3, 0.15, 0.9), new Color4(1.0, 0.6, 0.15, 0.9))
    ps.addColorGradient(1.0, new Color4(0.9, 0.15, 0.1, 0.0), new Color4(0.9, 0.5, 0.1, 0.0))

    ps.gravity = normal.scale(o.gravity)

    ps.emitRate = o.count / (o.emitDurationMs / 1000)
    ps.targetStopDuration = o.emitDurationMs / 1000

    ps.blendMode = ParticleSystem.BLENDMODE_ADD

    ps.start()

    const disposeDelay = o.emitDurationMs + o.lifetimeMax * 1000 + 200
    setTimeout(() => {
        try { ps.dispose(false) } catch { /* already disposed */ }
    }, disposeDelay)
}
