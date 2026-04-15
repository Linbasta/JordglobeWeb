/**
 * Score HUD — top-right score display for quizzes
 *
 * Module-level state, plain functions (matches video-overlay.ts pattern).
 */

let container: HTMLDivElement | null = null
let scoreSpan: HTMLSpanElement | null = null
let wrongSpan: HTMLSpanElement | null = null
let totalSpan: HTMLSpanElement | null = null

// Cache to avoid setting textContent every frame
let lastScore = -1
let lastWrong = -1
let lastTotal = -1

export function createScoreHUD(): void {
    disposeScoreHUD()

    container = document.createElement('div')
    container.style.cssText =
        'position:absolute;top:10px;right:10px;' +
        'color:#333;font-family:Arial,sans-serif;font-size:16px;' +
        'background-color:rgba(255,255,255,0.9);padding:15px;' +
        'border-radius:8px;z-index:100;line-height:1.6;'

    const scoreLine = document.createElement('div')
    scoreLine.innerHTML = '<strong>Score:</strong> '
    scoreSpan = document.createElement('span')
    scoreSpan.textContent = '0'
    scoreLine.appendChild(scoreSpan)
    scoreLine.append(' / ')
    totalSpan = document.createElement('span')
    totalSpan.textContent = '0'
    scoreLine.appendChild(totalSpan)

    const wrongLine = document.createElement('div')
    wrongLine.innerHTML = '<strong>Wrong:</strong> '
    wrongSpan = document.createElement('span')
    wrongSpan.textContent = '0'
    wrongLine.appendChild(wrongSpan)

    container.appendChild(scoreLine)
    container.appendChild(wrongLine)
    document.body.appendChild(container)

    lastScore = lastWrong = lastTotal = -1
}

export function updateScoreHUD(score: number, wrong: number, total: number): void {
    if (score === lastScore && wrong === lastWrong && total === lastTotal) return
    lastScore = score
    lastWrong = wrong
    lastTotal = total
    if (scoreSpan) scoreSpan.textContent = String(score)
    if (wrongSpan) wrongSpan.textContent = String(wrong)
    if (totalSpan) totalSpan.textContent = String(total)
}

export function disposeScoreHUD(): void {
    if (container) {
        container.remove()
        container = null
    }
    scoreSpan = wrongSpan = totalSpan = null
    lastScore = lastWrong = lastTotal = -1
}
