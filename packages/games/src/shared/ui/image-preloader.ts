/**
 * Image Preloader — warms browser cache for upcoming quiz images.
 *
 * Call preloadQuizImages() once at quiz start with the full question list.
 * Images load in the background (up to MAX_INFLIGHT concurrently).
 * When the quiz later sets img.src to the same URL, the browser serves it
 * from its HTTP cache — no network delay.
 */

const cache = new Map<string, HTMLImageElement>()
let preloadQueue: string[] = []
let inflight = 0
const MAX_INFLIGHT = 5

function pump(): void {
    while (inflight < MAX_INFLIGHT && preloadQueue.length > 0) {
        const url = preloadQueue.shift()!
        if (cache.has(url)) continue
        inflight++
        const img = new Image()
        img.onload = img.onerror = () => { inflight--; pump() }
        img.src = url
        cache.set(url, img)
    }
}

/** Queue all image URLs from the question list. Call once at quiz start. */
export function preloadQuizImages(questions: { imageUrl?: string }[]): void {
    cache.clear()
    inflight = 0
    preloadQueue = questions
        .map(q => q.imageUrl)
        .filter((url): url is string => !!url)
    pump()
}
