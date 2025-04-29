// generateProblemsFromSettings.js
// Utility to generate a problem set based on user StartScreen settings
import { problemGenerators } from './problemBank.js';

/**
 * settings: {
 *   mathTypes: [
 *     { type: 'addition', min, max },
 *     { type: 'subtraction', min, max },
 *     { type: 'multiplication', tables },
 *     { type: 'division', min, max }
 *   ],
 *   difficulty: string,
 *   avatar: string
 * }
 * options: {
 *   numProblems: number (default 10)
 * }
 */
export default function generateProblemsFromSettings(settings, options = {}) {
  const numProblems = options.numProblems || 10;
  const problems = [];
  const { mathTypes } = settings;
  if (!Array.isArray(mathTypes) || mathTypes.length === 0) return problems;

  // Evenly distribute problems across selected types
  for (let i = 0; i < numProblems; i++) {
    const typeIdx = i % mathTypes.length;
    const typeSettings = mathTypes[typeIdx];
    const { type, ...params } = typeSettings;
    const generator = problemGenerators[type];
    if (typeof generator !== 'function') continue;
    // Defensive: avoid accidental duplicate IDs
    let problem;
    let tries = 0;
    do {
      problem = generator(params);
      tries++;
    } while (problems.find(p => p.id === problem.id) && tries < 10);
    problems.push(problem);
  }
  return problems;
}
