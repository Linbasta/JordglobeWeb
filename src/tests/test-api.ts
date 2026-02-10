/**
 * Test API - Exposes helpers on window.__test for Playwright E2E tests.
 *
 * Provides coordinate conversion (lat/lon → screen pixels) and quiz state
 * so Playwright knows where to click and what to assert.
 */

import { Vector3, Matrix } from '@babylonjs/core/Maths/math.vector'
import type { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera'
import { latLonToSphere } from '../earth-globe/geo-math'
import type { SoloGameController } from '../solo/solo-game-controller'

export interface TestAPI {
    ready: boolean
    latLonToScreen(lat: number, lon: number): { x: number; y: number }
    rotateCameraTo(lat: number, lon: number, radius?: number): void
    getQuizState(): { active: boolean; score: number; total: number; done: boolean; waiting: boolean }
}

declare global {
    interface Window {
        __test: TestAPI
    }
}

/**
 * Wire the test API to a SoloGameController instance.
 * Call this after the controller is ready.
 */
export function exposeTestAPI(controller: SoloGameController): void {
    const globe = controller.getGlobe()
    const camera = globe.getCamera() as ArcRotateCamera
    const engine = globe.getEngine()

    window.__test = {
        ready: true,

        latLonToScreen(lat: number, lon: number): { x: number; y: number } {
            const worldPos = latLonToSphere(lat, lon, 0)

            const viewMatrix = camera.getViewMatrix()
            const projectionMatrix = camera.getProjectionMatrix()
            const transformMatrix = viewMatrix.multiply(projectionMatrix)

            const viewport = camera.viewport.toGlobal(
                engine.getRenderWidth(),
                engine.getRenderHeight()
            )

            const screenPos = Vector3.Project(
                worldPos,
                Matrix.Identity(),
                transformMatrix,
                viewport
            )

            return { x: screenPos.x, y: screenPos.y }
        },

        rotateCameraTo(lat: number, lon: number, radius?: number): void {
            const alpha = lon * (Math.PI / 180)
            const beta = Math.PI / 2 - (lat * Math.PI / 180)
            camera.alpha = alpha
            camera.beta = beta
            if (radius !== undefined) {
                camera.radius = radius
            }
        },

        getQuizState() {
            return controller.getQuizState()
        }
    }
}
