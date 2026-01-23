// Test State/Blend System - Run in browser console at http://localhost:3000/country-game
//
// State values:
//   STATE_NORMAL = 0.0    (no effect)
//   STATE_DISABLED = 0.25 (dark gray)
//   STATE_CLEARED = 0.50  (light gray/white tint)
//
// Blend values:
//   0.0 = full state effect (gray)
//   1.0 = normal appearance (colored)

const globe = soloGame.getGlobe();

// Test 1: Set country 10 to DISABLED state (dark gray)
globe.setCountryState(10, 0.25);
globe.setCountryBlend(10, 0.0);
console.log('Country 10: DISABLED state (dark gray)');

// Test 2: Set country 20 to CLEARED state (light gray/white tint)
globe.setCountryState(20, 0.50);
globe.setCountryBlend(20, 0.0);
console.log('Country 20: CLEARED state (light gray)');

// Test 3: Partial blend (50% effect)
globe.setCountryState(30, 0.25);
globe.setCountryBlend(30, 0.5);
console.log('Country 30: DISABLED with 50% blend (partially gray)');

// Test 4: Animate blend from normal to full state effect
globe.setCountryState(40, 0.50);
globe.setCountryBlend(40, 1.0);  // Start normal
globe.animateCountryBlend(40, 0.0, 1000);  // Animate to gray over 1 second
console.log('Country 40: Animating to CLEARED state over 1 second');

// Reset a country back to normal
function resetCountry(index) {
    globe.setCountryState(index, 0.0);
    globe.setCountryBlend(index, 1.0);
    console.log(`Country ${index} reset to normal`);
}

// Reset all test countries
function resetAll() {
    [10, 20, 30, 40].forEach(resetCountry);
}

console.log('');
console.log('Run resetAll() to reset all test countries');
console.log('Run resetCountry(index) to reset a specific country');
