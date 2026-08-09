"use strict";
/**
 * Analysis of card effects, bonuses, and scoring from species data
 * This will help design the effects engine architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
const cardDefinitions_1 = require("./cardDefinitions");
// Analyze all unique effect patterns
const effectPatterns = new Set();
const bonusPatterns = new Set();
const pointsPatterns = new Set();
Object.values(cardDefinitions_1.SPECIES_DATA).forEach(species => {
    if (species.effect)
        effectPatterns.add(species.effect);
    if (species.bonus)
        bonusPatterns.add(species.bonus);
    if (species.points)
        pointsPatterns.add(species.points);
});
console.log('📊 Card Mechanics Analysis\n');
console.log(`🎯 Effects (${effectPatterns.size} unique):`);
Array.from(effectPatterns).slice(0, 10).forEach(effect => {
    console.log(`  - "${effect}"`);
});
if (effectPatterns.size > 10) {
    console.log(`  ... and ${effectPatterns.size - 10} more`);
}
console.log(`\n⭐ Bonuses (${bonusPatterns.size} unique):`);
Array.from(bonusPatterns).slice(0, 10).forEach(bonus => {
    console.log(`  - "${bonus}"`);
});
if (bonusPatterns.size > 10) {
    console.log(`  ... and ${bonusPatterns.size - 10} more`);
}
console.log(`\n🏆 Scoring (${pointsPatterns.size} unique):`);
Array.from(pointsPatterns).slice(0, 10).forEach(points => {
    console.log(`  - "${points}"`);
});
if (pointsPatterns.size > 10) {
    console.log(`  ... and ${pointsPatterns.size - 10} more`);
}
// Categorize effect types
console.log('\n\n📋 Effect Categories:');
const drawEffects = Array.from(effectPatterns).filter(e => e.includes('Receive') || e.includes('card'));
console.log(`\n  Draw Cards (${drawEffects.length}):`);
drawEffects.slice(0, 3).forEach(e => console.log(`    - ${e}`));
const playFreeEffects = Array.from(effectPatterns).filter(e => e.includes('Play') && e.includes('free'));
console.log(`\n  Play Free Cards (${playFreeEffects.length}):`);
playFreeEffects.slice(0, 3).forEach(e => console.log(`    - ${e}`));
const caveEffects = Array.from(effectPatterns).filter(e => e.includes('cave'));
console.log(`\n  Cave Effects (${caveEffects.length}):`);
caveEffects.slice(0, 3).forEach(e => console.log(`    - ${e}`));
const turnEffects = Array.from(effectPatterns).filter(e => e.includes('another turn'));
console.log(`\n  Extra Turn (${turnEffects.length}):`);
turnEffects.slice(0, 3).forEach(e => console.log(`    - ${e}`));
console.log('\n\n📋 Scoring Categories:');
const fixedPoints = Array.from(pointsPatterns).filter(p => p.match(/^Gain \d+ points?$/));
console.log(`\n  Fixed Points (${fixedPoints.length}):`);
fixedPoints.slice(0, 3).forEach(p => console.log(`    - ${p}`));
const perCardPoints = Array.from(pointsPatterns).filter(p => p.includes('for each') || p.includes('per'));
console.log(`\n  Per Card/Symbol (${perCardPoints.length}):`);
perCardPoints.slice(0, 3).forEach(p => console.log(`    - ${p}`));
const conditionalPoints = Array.from(pointsPatterns).filter(p => p.includes('if ') || p.includes('at least'));
console.log(`\n  Conditional (${conditionalPoints.length}):`);
conditionalPoints.slice(0, 3).forEach(p => console.log(`    - ${p}`));
const accordingToPoints = Array.from(pointsPatterns).filter(p => p.includes('according to'));
console.log(`\n  Variable (according to) (${accordingToPoints.length}):`);
accordingToPoints.forEach(p => console.log(`    - ${p}`));
