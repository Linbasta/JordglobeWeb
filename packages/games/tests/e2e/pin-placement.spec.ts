import { test, expect, type Page } from '@playwright/test'

// Approximate country centers (lat, lon)
const FRANCE = { lat: 46.6, lon: 2.2 }
const BRAZIL = { lat: -10, lon: -55 }
const JAPAN = { lat: 36, lon: 138 }

// Camera radius zoomed in close enough that countries fill the screen
const CLOSE_RADIUS = 4.0

/**
 * Wait for window.__test.ready to be true (globe loaded, quiz started)
 */
async function waitForReady(page: Page) {
    await page.waitForFunction(
        () => window.__test?.ready === true,
        { timeout: 25_000 }
    )
}

/**
 * Rotate the camera so the given lat/lon is facing the viewer,
 * zoom in to CLOSE_RADIUS, and wait two render frames for camera
 * matrices to update.
 */
async function rotateTo(page: Page, lat: number, lon: number) {
    await page.evaluate(({ lat, lon, r }) => {
        window.__test.rotateCameraTo(lat, lon, r)
    }, { lat, lon, r: CLOSE_RADIUS })
    // Wait two frames so view/projection matrices update
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))
}

/**
 * Get screen coordinates for a lat/lon via the test API.
 */
async function latLonToScreen(page: Page, lat: number, lon: number) {
    return page.evaluate(({ lat, lon }) => {
        return window.__test.latLonToScreen(lat, lon)
    }, { lat, lon })
}

/**
 * Right-click drag to place a pin at the given lat/lon.
 *
 * Sequence:
 * 1. Move mouse to canvas center
 * 2. Right-click down → enters placing mode
 * 3. Move mouse to target screen coordinates (stepped for smooth drag)
 * 4. Right-click up → places pin
 */
async function placePinAt(page: Page, lat: number, lon: number) {
    const canvas = page.locator('#renderCanvas')
    const box = await canvas.boundingBox()
    if (!box) throw new Error('Canvas not found')

    const centerX = box.x + box.width / 2
    const centerY = box.y + box.height / 2

    // Get target screen coordinates
    const target = await latLonToScreen(page, lat, lon)

    // Right-click drag sequence
    await page.mouse.move(centerX, centerY)
    await page.mouse.down({ button: 'right' })
    await page.mouse.move(target.x, target.y, { steps: 10 })
    await page.mouse.up({ button: 'right' })
}

/**
 * Wait for the quiz to finish processing an answer (animations, etc.)
 * First waits for waiting to become false (answer being processed),
 * then waits for waiting to become true again (next question) or done.
 */
async function waitForNextQuestion(page: Page) {
    // Phase 1: wait for the answer to be consumed (waiting goes false)
    await page.waitForFunction(
        () => {
            const state = window.__test.getQuizState()
            return !state.waiting || state.done
        },
        { timeout: 15_000 }
    )
    // Phase 2: wait for next question (waiting goes true again) or game done
    await page.waitForFunction(
        () => {
            const state = window.__test.getQuizState()
            return state.waiting || state.done
        },
        { timeout: 15_000 }
    )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Country Quiz E2E', () => {
    // Globe + WebGL initialization can be slow in headless
    test.setTimeout(45_000)

    test.beforeEach(async ({ page }) => {
        await page.goto('/test-e2e.html')
        await waitForReady(page)
    })

    test('globe loads and quiz starts', async ({ page }) => {
        const state = await page.evaluate(() => window.__test.getQuizState())
        expect(state.active).toBe(true)
        expect(state.total).toBe(3)
        expect(state.score).toBe(0)
        expect(state.done).toBe(false)
    })

    test('correct answer increments score', async ({ page }) => {
        // First question is France — wait for quiz to reach WaitPinPlacement
        await page.waitForFunction(
            () => window.__test.getQuizState().waiting,
            { timeout: 10_000 }
        )

        await rotateTo(page, FRANCE.lat, FRANCE.lon)
        await placePinAt(page, FRANCE.lat, FRANCE.lon)
        await waitForNextQuestion(page)

        const state = await page.evaluate(() => window.__test.getQuizState())
        expect(state.score).toBe(1)
    })

    test('wrong answer does not increment score', async ({ page }) => {
        // Wait for first question (France)
        await page.waitForFunction(
            () => window.__test.getQuizState().waiting,
            { timeout: 10_000 }
        )

        // Click Brazil (a game country, so NOT disabled) as wrong answer for France
        await rotateTo(page, BRAZIL.lat, BRAZIL.lon)
        await placePinAt(page, BRAZIL.lat, BRAZIL.lon)
        await waitForNextQuestion(page)

        const state = await page.evaluate(() => window.__test.getQuizState())
        expect(state.score).toBe(0)
    })

    test('full quiz completes with all correct answers', async ({ page }) => {
        const answers = [FRANCE, BRAZIL, JAPAN]

        for (let i = 0; i < answers.length; i++) {
            await page.waitForFunction(
                () => window.__test.getQuizState().waiting,
                { timeout: 15_000 }
            )

            const target = answers[i]
            await rotateTo(page, target.lat, target.lon)
            await placePinAt(page, target.lat, target.lon)
            await waitForNextQuestion(page)
        }

        const finalState = await page.evaluate(() => window.__test.getQuizState())
        expect(finalState.score).toBe(3)
        expect(finalState.done).toBe(true)
    })
})
