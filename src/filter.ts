/* 
 * Filter raw Google Ngram data to extract the 1-grams that:
 * - have only 5 characters 
 * - contain only [a-zA-Z] characters
 * - have a count >= 10
 * 
 * Additionally, normalize all words to lowercase.
 * 
 * The output files will contain duplicates since the original data 
 * is case-sensitive.
*/

import { createReadStream, createWriteStream } from 'node:fs';
import { createInterface } from 'node:readline';

const PREFIX_IN = './data/';
const PREFIX_OUT = './out/';

const inputFiles = [];

for (let i = 0; i < 24; i++) {
  const fileNum = Number(i).toString().padStart(2, '0');
  inputFiles.push(`1-000${fileNum}-of-00024`);
}

async function readAndWriteLineByLine(inputFilePath: string, outputFilePath: string) {

  console.log(`Starting processing file ${inputFilePath}...`);
  // Create a readable stream from the input file
  const fileStream = createReadStream(inputFilePath);

  // Create a writable stream for the output file
  const writeStream = createWriteStream(outputFilePath);

  // Create an interface for reading lines from the file stream
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity // Handles both \n and \r\n newlines
  });

  // Handle the backpressure by waiting for the write stream to drain
  for await (const line of rl) {
    // If the write buffer is full, wait until it drains
    const arr = line.split('\t');
    const word = arr[0].split('_')[0].toLowerCase();
    const data = arr[arr.length - 1].split(',').slice(0, 2);
    const year = parseInt(data[0]);
    const count = parseInt(data[1]);

    if (word.length === 5 && /^[a-zA-Z]+$/.test(word) && count >= 10) {
      const lcWord = word.toLowerCase();
      const formattedData = `${year},${count}`;
      if (!writeStream.write(`${lcWord},${formattedData}\n`)) {
        await new Promise((resolve) => writeStream.once('drain', resolve));
      }
    }
  }

  // Close the write stream once all lines are written
  writeStream.end();

  console.log(`${inputFilePath} processed successfully`);

}

for (const inputFile of inputFiles) {
  readAndWriteLineByLine(`${PREFIX_IN}${inputFile}`, `${PREFIX_OUT}${inputFile}`)
    .catch(console.error);
}
