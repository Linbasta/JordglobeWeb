/**
 * Quiz Debug Manager
 *
 * Manages the debug panel lifecycle independently from quiz execution.
 * Can be created/destroyed without affecting the quiz runner.
 */

import type { DebugState } from './quiz-types'
import { formatStep } from './quiz-debug'
import { debugJumpToStep, debugStepForward, debugStepBackward } from './quiz-runner'

/**
 * Manages the debug panel UI element and its updates
 */
export class QuizDebugManager {
    private panel: HTMLElement
    private stepListEl: HTMLElement
    private stateDisplayEl: HTMLElement

    constructor() {
        // Create panel
        this.panel = document.createElement('div')
        this.panel.id = 'quiz-debugger'
        this.panel.style.cssText = `
            position: fixed;
            right: 10px;
            top: 10px;
            width: 400px;
            max-height: 80vh;
            background: rgba(0, 0, 0, 0.9);
            color: #0f0;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            padding: 10px;
            border: 1px solid #0f0;
            border-radius: 4px;
            z-index: 10000;
            overflow: hidden;
            display: none;
            flex-direction: column;
        `

        // Header
        const header = document.createElement('h3')
        header.textContent = 'Quiz Debugger'
        header.style.cssText = 'margin: 0 0 10px 0; font-size: 14px; color: #0ff;'
        this.panel.appendChild(header)

        // Step list (scrollable)
        this.stepListEl = document.createElement('div')
        this.stepListEl.style.cssText = `
            flex: 1;
            overflow-y: auto;
            margin-bottom: 10px;
            padding: 5px;
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid #0f0;
        `
        this.panel.appendChild(this.stepListEl)

        // Controls
        const controls = document.createElement('div')
        controls.style.cssText = 'display: flex; gap: 5px; margin-bottom: 10px;'

        const btnBack = this.createButton('◀ Back', () => debugStepBackward())
        const btnNext = this.createButton('▶ Next', () => debugStepForward())
        const btnReset = this.createButton('⏮ Reset', () => debugJumpToStep(0))

        controls.appendChild(btnBack)
        controls.appendChild(btnNext)
        controls.appendChild(btnReset)
        this.panel.appendChild(controls)

        // State display
        this.stateDisplayEl = document.createElement('pre')
        this.stateDisplayEl.style.cssText = `
            margin: 0;
            padding: 5px;
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid #0f0;
            font-size: 10px;
            color: #fff;
        `
        this.panel.appendChild(this.stateDisplayEl)

        // Append to document
        document.body.appendChild(this.panel)
    }

    /**
     * Show the debug panel
     */
    show(): void {
        this.panel.style.display = 'flex'
    }

    /**
     * Hide the debug panel
     */
    hide(): void {
        this.panel.style.display = 'none'
    }

    /**
     * Toggle panel visibility
     */
    toggle(): void {
        this.panel.style.display = this.panel.style.display === 'none' ? 'flex' : 'none'
    }

    /**
     * Update the panel with current debug state
     * Call this every frame when the panel is visible
     */
    update(state: DebugState): void {
        // Update step list
        this.stepListEl.innerHTML = ''
        state.steps.forEach((step, i) => {
            const stepEl = document.createElement('div')
            stepEl.style.cssText = `
                padding: 2px 4px;
                margin: 1px 0;
                cursor: pointer;
                background: ${i === state.pc ? 'rgba(0, 255, 0, 0.2)' : 'transparent'};
                color: ${i === state.pc ? '#0ff' : '#0f0'};
            `

            const prefix = i === state.pc ? '▶' : (i < state.pc ? '✓' : ' ')
            stepEl.textContent = `${prefix} ${i}: ${formatStep(step)}`

            // Click to jump
            stepEl.addEventListener('click', () => {
                debugJumpToStep(i)
            })

            this.stepListEl.appendChild(stepEl)
        })

        // Auto-scroll to current step
        const activeEl = this.stepListEl.children[state.pc]
        if (activeEl) {
            activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        }

        // Update state display
        this.stateDisplayEl.textContent = `PC: ${state.pc}/${state.steps.length}
Score: ${state.score}/${state.questions.length}
Waiting: ${state.waiting}
Pending: ${state.pendingAnswer ? JSON.stringify(state.pendingAnswer) : 'null'}`
    }

    /**
     * Dispose the debug panel and remove from DOM
     */
    dispose(): void {
        this.panel.remove()
    }

    // ========================================================================
    // Private Helpers
    // ========================================================================

    private createButton(text: string, onClick: () => void): HTMLButtonElement {
        const btn = document.createElement('button')
        btn.textContent = text
        btn.style.cssText = `
            flex: 1;
            padding: 5px;
            background: #0f0;
            color: #000;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            font-weight: bold;
        `
        btn.addEventListener('click', onClick)
        btn.addEventListener('mouseenter', () => {
            btn.style.background = '#0ff'
        })
        btn.addEventListener('mouseleave', () => {
            btn.style.background = '#0f0'
        })
        return btn
    }
}
