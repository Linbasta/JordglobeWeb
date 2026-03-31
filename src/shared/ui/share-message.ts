/**
 * Wordle-style share message generator for quiz results
 */

export function generateShareMessage(
    title: string,
    score: number,
    total: number,
    elapsedMs: number,
    results: boolean[],
    url: string,
    emoji?: string,
): string {
    const totalSeconds = Math.floor(elapsedMs / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`

    const squares = results.map(r => r ? '🟩' : '🟥').join('')

    const emojiSuffix = emoji ? ` ${emoji}` : ''

    return `🌍 ${title}${emojiSuffix}\n${score}/${total} ⏱️ ${timeStr}\n\n${squares}\n\nCan you beat my score?\n${url}`
}
