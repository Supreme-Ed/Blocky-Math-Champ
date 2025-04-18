// problemBank.js
// Defines and exports all math problems and generators (static and dynamic) for Blocky Math Champ

/**
 * Each problem should have:
 * - id: unique identifier
 * - question: string
 * - choices: array of numbers (or strings)
 * - answer: correct answer (number or string)
 * - [optional] generator: function for dynamic problems
 * - [optional] metadata for mastery/history tracking
 */

// Dynamic generator for addition problems
export function generateAdditionProblem({ min = 1, max = 10 } = {}) {
  const a = Math.floor(Math.random() * (max - min + 1)) + min;
  const b = Math.floor(Math.random() * (max - min + 1)) + min;
  const answer = a + b;
  const choices = generateChoices(answer);
  return {
    id: `add-${a}-${b}`,
    question: `${a} + ${b} = ?`,
    choices,
    answer,
    type: 'addition',
    generated: true,
  };
}

// Dynamic generator for subtraction problems
export function generateSubtractionProblem({ min = 1, max = 10 } = {}) {
  let a = Math.floor(Math.random() * (max - min + 1)) + min;
  let b = Math.floor(Math.random() * (max - min + 1)) + min;
  if (b > a) [a, b] = [b, a]; // ensure non-negative result
  const answer = a - b;
  const choices = generateChoices(answer);
  return {
    id: `sub-${a}-${b}`,
    question: `${a} - ${b} = ?`,
    choices,
    answer,
    type: 'subtraction',
    generated: true,
  };
}

// Dynamic generator for multiplication problems (tables: array of table numbers)
export function generateMultiplicationProblem({ tables = [2,3,4,5,6,7,8,9,10,11,12] } = {}) {
  const a = tables[Math.floor(Math.random() * tables.length)];
  const b = Math.floor(Math.random() * 13); // 0-12
  const answer = a * b;
  const choices = generateChoices(answer);
  return {
    id: `mul-${a}-${b}`,
    question: `${a} × ${b} = ?`,
    choices,
    answer,
    type: 'multiplication',
    generated: true,
  };
}

// Dynamic generator for division problems (tables: array of allowed divisors)
export function generateDivisionProblem({ tables = [2,3,4,5,6,7,8,9,10,11,12] } = {}) {
  const divisor = tables[Math.floor(Math.random() * tables.length)];
  // Prevent divide by zero: quotient must be at least 1
  const quotient = Math.floor(Math.random() * 12) + 1; // 1-12
  const dividend = divisor * quotient;
  const answer = quotient;
  const choices = generateChoices(answer);
  return {
    id: `div-${dividend}-${divisor}`,
    question: `${dividend} ÷ ${divisor} = ?`,
    choices,
    answer,
    type: 'division',
    generated: true,
  };
}

// Helper to generate 3 unique wrong choices (total 4 choices)
function generateChoices(answer) {
  const choices = [answer];
  while (choices.length < 4) {
    let wrong = answer + (Math.floor(Math.random() * 9) - 4); // wider range
    if (wrong === answer || choices.includes(wrong) || wrong < 0) continue;
    choices.push(wrong);
  }
  // Shuffle
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}

// Export a mapping of type to generator
export const problemGenerators = {
  addition: generateAdditionProblem,
  subtraction: generateSubtractionProblem,
  multiplication: generateMultiplicationProblem,
  division: generateDivisionProblem,
};
