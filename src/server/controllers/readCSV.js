const csv = require('csv');
const fs = require('fs');
const promisify = require('es6-promisify');

const readFile = promisify(fs.readFile);
const parseCsv = promisify(csv.parse);

/**
 * Returns a promise to read the given CSV file into an array of arrays.
 * @param fileName the filename to read
 * @return {Promise.<array.<array>>}
 */
async function readCSV(fileName) {
	const buffer = await readFile(fileName);
	return await parseCsv(buffer.toString());
}

module.exports = readCSV;
