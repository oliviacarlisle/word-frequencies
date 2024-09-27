/* 
 * Combine duplicates by adding their counts.
 * 
 * Sort the output by count in descending order.
 * 
 * Additionally, exclude all words that are not allowed guesses in Wordle.
*/

import { createReadStream, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

import { words } from './wordleGuesses';

const inputFile = './data/concatenated';
const outputFile = './out/processed';

function combineDuplicates(arr: [string, number, number][]) {

  const words: { [key: string]: [number, number] } = {};

  for (const line of arr) {
    const w = line[0];
    const year = line[1];
    const count = line[2];

    if (!words[w]) {
      words[w] = [year, count];
    } else {
      words[w][0] = Math.max(words[w][0], year);
      words[w][1] += count;
    }
  }

  return Object.entries(words).sort((a, b) => b[1][1] - a[1][1]);
}

async function readLines(inputFilePath: string) {

  const allLines: [string, number, number][] = [];

  console.log(`Starting processing file ${inputFilePath}...`);
  // Create a readable stream from the input file
  const fileStream = createReadStream(inputFilePath);

  // Create an interface for reading lines from the file stream
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity // Handles both \n and \r\n newlines
  });

  // Handle the backpressure by waiting for the write stream to drain
  for await (const line of rl) {
    // If the write buffer is full, wait until it drains
    const arr = line.split(',');
    const word: string = arr[0];
    const year: number = parseInt(arr[1]);
    const count: number = parseInt(arr[2]);
    
    allLines.push([word, year, count]);
  }

  allLines.sort((a, b) => b[2] - a[2]);

  return allLines;
}

async function main() {
  const arr = await readLines(inputFile);

  console.log(`${inputFile} read successfully`);

  const allowedGuesses = new Set(words);

  const processed: [string, number][] = combineDuplicates(arr)
    .filter(e => allowedGuesses.has(e[0]))
    .map(e => [e[0], e[1][1]]);
  
  console.log(processed.slice(100, 110))

  const logTransform = processed.map(e => [e[0], (Math.log(e[1]) * 1000).toFixed(0)]);

  console.log(logTransform.slice(100, 110))

  // write to output file
  // Convert the array of arrays into a string where each inner array is a line
  const fileContent: string = processed
    .map(innerArray => innerArray.join(',')) // Convert each inner array to a comma-separated string
    .join('\n'); // Join each line with a newline character

  writeFileSync(outputFile, fileContent, 'utf8');

  const fileContentLog: string = logTransform
    .map(innerArray => innerArray.join(',')) // Convert each inner array to a comma-separated string
    .join('\n'); // Join each line with a newline character

    writeFileSync(`${outputFile}-log`, fileContentLog, 'utf8');

  console.log('File written successfully!');
}

main();
