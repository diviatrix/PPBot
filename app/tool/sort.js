const fs = require('fs');

// Read input from input.json
const inputFilePath = 'input.json';
const input = JSON.parse(fs.readFileSync(inputFilePath, 'utf8'));

// Sort by rarity in ascending order
const sortedOutput = input.sort((a, b) => a.rarity.localeCompare(b.rarity));

// Write output to output.json (shortened format)
const outputFilePath = 'output.json';
fs.writeFileSync(outputFilePath, sortedOutput.map(record => JSON.stringify(record)).join(',\n') + '\n');

console.log(`Output written to ${outputFilePath}`);