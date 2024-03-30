import fs from "fs";

// Read input from input.json
const inputFilePath = "input.json";
const input = JSON.parse(fs.readFileSync(inputFilePath, "utf8"));

// Transform input to desired output format
const output = input.map(item => ({
	id: item.id.toString(),
	rarity: item.rarity,
	name: item.description
}));

// Write output to output.json
const outputFilePath = "output.json";
fs.writeFileSync(outputFilePath, output.map(record => JSON.stringify(record)).join(",\n") + "\n");

console.log(`Output written to ${outputFilePath}`);
