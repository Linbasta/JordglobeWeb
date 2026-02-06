#!/usr/bin/env node
/**
 * CLI Test for Quiz Pipeline
 *
 * Tests step generation logic without browser dependencies.
 * Focuses on quizFlow.ts which has no rendering dependencies.
 */

import type { Question, Step } from '../src/shared/quiz/quizTypes'
import { generateQuizSteps, generateCountryAnswerSteps, generateAlternativeAnswerSteps } from '../src/shared/quiz/quizFlow'

// ============================================================================
// Test Data
// ============================================================================

const testQuestions: Question[] = [
    { type: 'country', countryISO2: 'SE', prompt: 'Where is Sweden?' },
    { type: 'country', countryISO2: 'NO', prompt: 'Where is Norway?' },
    { type: 'alternative', prompt: 'What is the capital of Finland?', options: ['Oslo', 'Helsinki', 'Stockholm'], correctIndex: 1 },
]

// ============================================================================
// Test Runner
// ============================================================================

function runTests() {
    console.log('=== Testing Quiz Flow Generation ===\n')

    let testsPassed = 0
    let testsFailed = 0

    // Test 1: Generate basic quiz steps
    console.log('Test 1: Generate quiz steps')
    try {
        const steps = generateQuizSteps(testQuestions)

        // Should have: disable + (show_question + wait) * 3 + game_complete
        const expectedMinSteps = 1 + (2 * 3) + 1 // = 8
        if (steps.length >= expectedMinSteps) {
            console.log(`  ✓ Generated ${steps.length} steps (expected >= ${expectedMinSteps})`)

            // Check structure
            if (steps[0].op === 'disable_non_game_countries') {
                console.log('  ✓ First step is disable_non_game_countries')
            }

            if (steps[steps.length - 1].op === 'game_complete') {
                console.log('  ✓ Last step is game_complete')
            }

            // Count wait steps
            const waitSteps = steps.filter(s => s.op === 'wait_pin_placement' || s.op === 'wait_alternative_answer')
            if (waitSteps.length === testQuestions.length) {
                console.log(`  ✓ Has ${waitSteps.length} wait steps (matches question count)`)
            }

            testsPassed++
        } else {
            console.log(`  ✗ Generated ${steps.length} steps, expected >= ${expectedMinSteps}`)
            testsFailed++
        }
    } catch (error) {
        console.log('  ✗ Failed:', error)
        testsFailed++
    }

    // Test 2: Generate correct answer steps
    console.log('\nTest 2: Generate correct answer steps')
    try {
        const steps = generateCountryAnswerSteps(true, 5, 5, false)

        if (steps.length > 0 && steps[0].op === 'animate_correct') {
            console.log(`  ✓ Generated ${steps.length} step(s) for correct answer`)
            console.log(`  Step: ${steps[0].op} { countryIndex: ${steps[0].countryIndex} }`)
            testsPassed++
        } else {
            console.log('  ✗ Incorrect step structure')
            testsFailed++
        }
    } catch (error) {
        console.log('  ✗ Failed:', error)
        testsFailed++
    }

    // Test 3: Generate wrong answer steps (shake mode)
    console.log('\nTest 3: Generate wrong answer steps (shake mode)')
    try {
        const steps = generateCountryAnswerSteps(false, 5, 3, false)

        if (steps.length > 0 && steps[0].op === 'animate_wrong_shake') {
            console.log(`  ✓ Generated ${steps.length} step(s) for wrong answer (shake)`)
            console.log(`  Step: ${steps[0].op} { wrongCountryIndex: ${steps[0].wrongCountryIndex} }`)
            testsPassed++
        } else {
            console.log('  ✗ Incorrect step structure')
            testsFailed++
        }
    } catch (error) {
        console.log('  ✗ Failed:', error)
        testsFailed++
    }

    // Test 4: Generate wrong answer steps (reveal mode)
    console.log('\nTest 4: Generate wrong answer steps (reveal mode)')
    try {
        const steps = generateCountryAnswerSteps(false, 5, 3, true)

        if (steps.length > 0 && steps[0].op === 'animate_wrong_reveal') {
            console.log(`  ✓ Generated ${steps.length} step(s) for wrong answer (reveal)`)
            console.log(`  Step: ${steps[0].op} { wrong: ${steps[0].wrongCountryIndex}, correct: ${steps[0].correctCountryIndex} }`)
            testsPassed++
        } else {
            console.log('  ✗ Incorrect step structure')
            testsFailed++
        }
    } catch (error) {
        console.log('  ✗ Failed:', error)
        testsFailed++
    }

    // Test 5: Generate alternative answer steps
    console.log('\nTest 5: Generate alternative answer steps')
    try {
        const correctSteps = generateAlternativeAnswerSteps(true, 0)
        const wrongSteps = generateAlternativeAnswerSteps(false, 0)

        if (correctSteps.length > 0 && correctSteps[0].op === 'show_result') {
            console.log(`  ✓ Generated steps for correct alternative answer`)
            console.log(`  First step: ${correctSteps[0].op} { wasCorrect: ${correctSteps[0].wasCorrect} }`)
        }

        if (wrongSteps.length > 0 && wrongSteps[0].op === 'show_result') {
            console.log(`  ✓ Generated steps for wrong alternative answer`)
            console.log(`  First step: ${wrongSteps[0].op} { wasCorrect: ${wrongSteps[0].wasCorrect} }`)
        }

        testsPassed++
    } catch (error) {
        console.log('  ✗ Failed:', error)
        testsFailed++
    }

    // Test 6: Verify step types are correct
    console.log('\nTest 6: Verify step types')
    try {
        const steps = generateQuizSteps(testQuestions)

        // Check that each step has the required fields
        let valid = true
        for (const step of steps) {
            if (!step.op) {
                console.log(`  ✗ Step missing 'op' field`)
                valid = false
                break
            }
        }

        if (valid) {
            console.log('  ✓ All steps have valid structure')
            testsPassed++
        } else {
            testsFailed++
        }
    } catch (error) {
        console.log('  ✗ Failed:', error)
        testsFailed++
    }

    // Test 7: Mixed question types
    console.log('\nTest 7: Mixed question types')
    try {
        const steps = generateQuizSteps(testQuestions)

        const pinWaits = steps.filter(s => s.op === 'wait_pin_placement').length
        const altWaits = steps.filter(s => s.op === 'wait_alternative_answer').length

        const expectedPinWaits = testQuestions.filter(q => q.type === 'country' || q.type === 'location').length
        const expectedAltWaits = testQuestions.filter(q => q.type === 'alternative').length

        if (pinWaits === expectedPinWaits && altWaits === expectedAltWaits) {
            console.log(`  ✓ Correct wait types: ${pinWaits} pin, ${altWaits} alternative`)
            testsPassed++
        } else {
            console.log(`  ✗ Wrong wait counts: got ${pinWaits}/${altWaits}, expected ${expectedPinWaits}/${expectedAltWaits}`)
            testsFailed++
        }
    } catch (error) {
        console.log('  ✗ Failed:', error)
        testsFailed++
    }

    // Summary
    console.log('\n=================================')
    console.log(`Tests passed: ${testsPassed}`)
    console.log(`Tests failed: ${testsFailed}`)
    console.log('=================================')

    if (testsFailed > 0) {
        console.log('\n❌ Some tests failed')
        process.exit(1)
    } else {
        console.log('\n✅ All tests passed!')
        console.log('\nNote: This tests step generation logic only.')
        console.log('Full runner integration requires browser environment.')
        process.exit(0)
    }
}

// Run tests
try {
    runTests()
} catch (error) {
    console.error('\n💥 Unexpected error:', error)
    process.exit(1)
}
