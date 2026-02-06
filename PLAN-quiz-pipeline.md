# Plan: Procedural Quiz Pipeline

Replace the callback-driven `CountryQuizGame` class with a flat step-array pipeline,
then cascade simplifications through the controller and state layers.

## Current Pain Points

1. **CountryQuizGame** is a class with 4 callbacks (`onQuestionChanged`, `onCorrectAnswer`,
   `onWrongAnswer`, `onGameComplete`). The animation sequencing in `handleWrongAnswer` is a
   deeply nested async chain (~70 lines of awaits, Promise.all, and setTimeout).

2. **BaseGameController** is an abstract class with template method hooks (`onGlobeReady`,
   `onPinPlaced`, `setupAdditionalUI`, etc.). PartyGameController is 54 lines that mostly
   just logs and forwards. SoloGameController wraps quiz logic in yet more callbacks.

3. **GlobeState** has subscribers, dirty tracking, and change logging for what amounts to
   pushing a few floats to the GPU each frame.

---

## Phase 1: Quiz Data + Flow Generation

**Goal:** Define questions as plain data, generate a flat step array from them.

### 1a. Create `src/shared/quiz/quizTypes.ts`

```ts
// --- Question types (pure data) ---

export type CountryQuestion = {
    type: "country"
    countryISO2: string       // e.g. "SE"
    prompt: string            // e.g. "Where is Sweden?"
}

export type LocationQuestion = {
    type: "location"
    lat: number
    lng: number
    prompt: string            // e.g. "Where is this city?"
}

export type AlternativeQuestion = {
    type: "alternative"
    prompt: string
    options: string[]
    correctIndex: number
}

export type Question = CountryQuestion | LocationQuestion | AlternativeQuestion

// --- Step types (the "bytecode") ---

export type Step =
    | { op: "disable_non_game_countries" }
    | { op: "animate_camera"; lat: number; lng: number; duration: number }
    | { op: "highlight_country"; countryIndex: number }
    | { op: "show_question"; questionIndex: number }
    | { op: "wait_pin_placement" }
    | { op: "wait_alternative_answer" }
    | { op: "check_country_answer"; questionIndex: number }
    | { op: "animate_correct"; countryIndex: number }
    | { op: "animate_wrong_reveal"; wrongCountryIndex: number; correctCountryIndex: number }
    | { op: "animate_wrong_shake"; wrongCountryIndex: number }
    | { op: "show_result"; questionIndex: number; wasCorrect: boolean }
    | { op: "pause"; duration: number }
    | { op: "game_complete" }
```

Note: The step list can't be fully pre-generated because `animate_wrong_reveal` vs
`animate_wrong_shake` depends on which country the user clicks. Two approaches:

**Option A — Split into "pre-answer" and "post-answer" generation:**
- Pre-generate steps up to `wait_pin_placement`
- After user answers, generate the response steps (correct/wrong animations)
- Append them and continue

**Option B — Steps include branch points:**
- `check_country_answer` is a step that evaluates the answer and *injects* follow-up
  steps into the array at the current position

**Recommendation: Option A.** It keeps the step array truly flat. The runner calls
`generatePostAnswerSteps(question, userAnswer)` and splices them in.

### 1b. Create `src/shared/quiz/quizFlow.ts`

```ts
import type { Question, Step } from './quizTypes'

/** Generate the intro steps + per-question pre-answer steps */
export function generateQuizSteps(questions: Question[]): Step[] {
    const steps: Step[] = []
    steps.push({ op: "disable_non_game_countries" })

    for (let i = 0; i < questions.length; i++) {
        steps.push({ op: "show_question", questionIndex: i })

        const q = questions[i]
        if (q.type === "country" || q.type === "location") {
            steps.push({ op: "wait_pin_placement" })
        } else {
            steps.push({ op: "wait_alternative_answer" })
        }
        // Post-answer steps will be spliced in by the runner
    }

    steps.push({ op: "game_complete" })
    return steps
}

/** Generate steps after user answers a country question */
export function generateCountryAnswerSteps(
    correct: boolean,
    correctCountryIndex: number,
    clickedCountryIndex: number,
    revealOnWrong: boolean
): Step[] {
    if (correct) {
        return [
            { op: "animate_correct", countryIndex: correctCountryIndex },
        ]
    }

    if (revealOnWrong) {
        return [
            { op: "animate_wrong_reveal",
              wrongCountryIndex: clickedCountryIndex,
              correctCountryIndex },
        ]
    }

    return [
        { op: "animate_wrong_shake", wrongCountryIndex: clickedCountryIndex },
    ]
}
```

### 1c. Create `src/shared/quiz/quizRunner.ts`

Module-level state, plain functions, explicit tick:

```ts
import type { Question, Step } from './quizTypes'
import { generateQuizSteps, generateCountryAnswerSteps } from './quizFlow'

// --- Module state ---
let steps: Step[] = []
let questions: Question[] = []
let pc = 0                    // program counter
let stepStartTime = 0
let waiting = false           // true when blocked on user input
let score = 0
let done = false

// --- Input buffer (set by caller before tick) ---
let pendingAnswer: { countryIndex: number } | { optionIndex: number } | null = null

export function startQuiz(qs: Question[]) {
    questions = qs
    steps = generateQuizSteps(qs)
    pc = 0
    stepStartTime = 0
    waiting = false
    score = 0
    done = false
    pendingAnswer = null
}

export function submitCountryAnswer(countryIndex: number) {
    pendingAnswer = { countryIndex }
}

export function submitAlternativeAnswer(optionIndex: number) {
    pendingAnswer = { optionIndex }
}

export function getScore() { return score }
export function getTotal() { return questions.length }
export function isDone() { return done }
export function isWaiting() { return waiting }
export function getCurrentStep() { return pc < steps.length ? steps[pc] : null }
export function getQuestion(index: number) { return questions[index] }

/** Tick the quiz forward. Returns true while active. */
export function tickQuiz(now: number, globe: EarthGlobeAPI): boolean {
    if (done || pc >= steps.length) return false

    const s = steps[pc]
    const elapsed = now - stepStartTime

    switch (s.op) {
        case "disable_non_game_countries":
            // ... disable countries, advance immediately
            advance(now)
            break

        case "show_question":
            // Caller reads getCurrentStep() to update UI
            advance(now)
            break

        case "wait_pin_placement":
            waiting = true
            if (pendingAnswer && 'countryIndex' in pendingAnswer) {
                waiting = false
                // Resolve answer, splice in post-answer steps
                const qi = findCurrentQuestionIndex()
                const q = questions[qi]
                // ... check answer, generate post-answer steps, splice
                pendingAnswer = null
                advance(now)
            }
            break

        case "animate_correct":
            // Kick off animation on first frame, wait for completion
            // ...
            break

        case "pause":
            if (elapsed >= s.duration) advance(now)
            break

        case "game_complete":
            done = true
            break
    }

    return true
}

function advance(now: number) {
    pc++
    stepStartTime = now
}
```

### Key decisions:
- The runner does NOT own animations. It calls into `globe.animateCountryAltitude()` etc.
  and tracks completion via elapsed time or promise.
- UI reads state from the runner (`getCurrentStep()`, `getQuestion()`, `getScore()`)
  instead of registering callbacks.
- The caller (solo main.ts or party main.ts) calls `tickQuiz()` each frame.

---

## Phase 2: Wire the Runner Into the Game Loop

**Goal:** Replace `CountryQuizGame` usage in `SoloGameController` with the new runner.

### 2a. Update `src/solo/main.ts`

The entry point currently creates a `SoloGameController` which internally creates a
`CountryQuizGame`. Replace with:

```ts
// In the frame loop:
if (tickQuiz(performance.now(), globe)) {
    // Quiz is active — read current step to drive UI
    const step = getCurrentStep()
    // Update question text, show/hide UI, etc.
}
```

### 2b. PinManager stays as-is for now

PinManager is already module-level functions. The only change: instead of registering a
callback via `onPinPlaced()`, the caller reads the pin result and calls
`submitCountryAnswer(countryIndex)`.

Concretely — in the pin placement handler:
```ts
onPinPlaced((country, latLon) => {
    if (country && isWaiting()) {
        submitCountryAnswer(country.countryIndex)
    }
})
```

This is still a callback from PinManager, but it just writes a value instead of kicking
off a chain of async operations. The quiz runner picks it up on the next tick.

### 2c. Remove CountryQuizGame.ts

Once the runner handles all quiz logic, delete:
- `src/shared/games/CountryQuizGame.ts`

The animation functions in `CountryAnimations.ts` stay — they're just plain async
functions that the runner calls.

---

## Phase 3: Flatten the Controller Hierarchy

**Goal:** Replace `BaseGameController` abstract class with plain init functions.

### 3a. Extract init logic into `src/shared/initGlobe.ts`

```ts
/** Initialize globe, pin manager, and GUI. Returns when ready. */
export async function initGlobe(canvasId: string): Promise<{
    globe: EarthGlobe
    advancedTexture: AdvancedDynamicTexture
    pinUI: PinUI
}> {
    // Create globe
    // Wait for ready
    // Init PinManager
    // Create GUI
    // Hide loading screen
    // return { globe, advancedTexture, pinUI }
}
```

### 3b. Simplify solo/main.ts

```ts
const { globe, advancedTexture, pinUI } = await initGlobe('renderCanvas')

// Setup quiz
startQuiz(questions)

// Frame loop — already managed by Babylon's render loop
scene.onBeforeRenderObservable.add(() => {
    const now = performance.now()
    tickQuiz(now, globe)

    // Read quiz state, update UI
    const step = getCurrentStep()
    if (step?.op === "show_question") {
        labelUI.show(getQuestion(step.questionIndex).prompt)
    }
})

// Wire pin placement
onPinPlaced((country, latLon) => {
    if (country && isWaiting()) {
        submitCountryAnswer(country.countryIndex)
    }
})
```

### 3c. Simplify party/client/main.ts

Same pattern — `initGlobe()` + wire WebSocket messages to `submitCountryAnswer()`.

### 3d. Delete:
- `src/shared/controllers/BaseGameController.ts`
- `src/solo/SoloGameController.ts`
- `src/party/client/PartyGameController.ts`

---

## Phase 4: Simplify GlobeState

**Goal:** Remove the reactive machinery. The quiz runner and frame loop read/write state
directly.

### 4a. What GlobeState actually does that matters:

1. Runs country altitude/blend animations each frame (the `updateAnimations` method)
2. Stores hover/selection state

The subscriber system, dirty tracking, and change logging are unused overhead.

### 4b. Options:

**Option A — Gut GlobeState down to just the animation ticker:**

Keep `GlobeState.sync()` but remove:
- `subscribe()` / `listeners` / `notifyListeners()`
- `dirty` set and all dirty tracking
- `changeLog` and `logChange()`
- All getters/setters — just make fields public or use the globe API directly

**Option B — Move animation ticking into the globe itself:**

The `CountryAnimator` in `earth-globe/` already exists. GlobeState's animation code
duplicates it. Consolidate into one place (probably `CountryAnimator`) and delete
`GlobeState` entirely.

**Recommendation: Option B**, but do it last since it touches the rendering layer.
Phase 4 can be deferred — it's cleanup, not architecture.

---

## Execution Order

| Phase | What | Depends On | Risk |
|-------|------|------------|------|
| **1** | Quiz types + flow + runner | Nothing | Low — new files, no existing code changes |
| **2** | Wire runner into game loop | Phase 1 | Medium — replaces CountryQuizGame |
| **3** | Flatten controllers | Phase 2 | Medium — changes entry points |
| **4** | Simplify GlobeState | Phase 3 | Low — cleanup |

Do phases 1-2 first and verify the quiz works. Then 3. Phase 4 is optional cleanup.

---

## What Stays Unchanged

- `earth-globe/` — rendering layer, untouched
- `CountryAnimations.ts` — plain async functions, already good
- `cameraUtils.ts` — plain functions, already good
- `PinManager.ts` — module-level singleton, already good (just change how we consume it)
- `ArcDrawer` — used by the runner for wrong-answer arcs, stays as-is
- `server/` — multiplayer server, untouched

---

## Async Animation Question

The current animations are `async` functions that resolve when done (`animateCorrect`,
`frameCountry`, etc.). The tick-based runner needs to know when they finish.

Two approaches:

**A. Keep async, track with a promise:**
```ts
let activeAnimation: Promise<void> | null = null

case "animate_correct":
    if (!activeAnimation) {
        activeAnimation = animateCorrect(globe, s.countryIndex)
        activeAnimation.then(() => { activeAnimation = null; advance(now) })
    }
    break
```

**B. Poll-based — check if animation is still running:**
```ts
case "animate_correct":
    if (elapsed === 0) {
        animateCorrect(globe, s.countryIndex)  // fire and forget
    }
    if (elapsed >= CORRECT_ANIMATION_DURATION) {
        advance(now)
    }
    break
```

**Recommendation: A** for now. The existing animation functions already return promises
and the durations are baked into them. Switching to poll-based would require exposing
duration constants or refactoring the animation layer, which is Phase 4 territory.

The promise approach is a small compromise — the runner isn't purely frame-driven for
animation steps — but it avoids duplicating timing logic.
