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

/**
 * Returns a promise to read a given CSV file from the server.
 * @param buffer fileName and the file to read
 * @returns {Promise.<array, <array>>}
 */
async function readCSVFromString(buffer) {
	const bufferContent = buffer.toString('utf8');
	return await parseCsv(bufferContent);
}

exports.readCSV = readCSV;
exports.readCSVFromString = readCSVFromString;
