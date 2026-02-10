import { defineConfig } from '@playwright/test'

export default defineConfig({
    testDir: 'tests/e2e',
    timeout: 30_000,
    use: {
        baseURL: 'http://localhost:4817',
        // WebGL needs real GPU or SwiftShader in headless mode
        launchOptions: {
            args: [
                '--use-gl=angle',
                '--use-angle=swiftshader',
                '--ignore-gpu-blocklist',
            ],
        },
    },
    projects: [
        { name: 'chromium', use: { browserName: 'chromium' } },
    ],
    // Assumes `npm run dev` is already running on port 4817.
    // Remove webServer entirely to avoid conflicts.
})
