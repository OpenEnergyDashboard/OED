const promisify = require('es6-promisify');
const Reading = require('./../models/Reading');
const readCsv = require('./readCSV');
const Meter = require('./../models/Meter');

/**
 * Reads CSV file passed to input all the Metasys readings into database.
 * @param fileName the filename to read
 */
async function readMetasysData(filename) {
	const readingArr = [];
	let i = 1;
	const rows = await readCsv('./../legacy_data/' + filename);
	for (const row of rows) {
		//timestamp
		const timestamp = row[0].toLocaleString();
		const time = new Date(timestamp);

		//meterReading
		let meterReading = row[3];
		meterReading = meterReading.replace('kWh', '');
		meterReading = parseInt(meterReading);

		//meterInformation
		const meter = await Meter.getByName(filename.replace('.csv', ''));

		/* We have hourly trend and monthly trend for Metasys data. We just read hourly trend.
		 * So, we skip one line as we go through the data
		 */
		if ((i % 2 != 0)) {
			const reading = new Reading(meter.id, meterReading, time);
			readingArr.push(reading);
		}
		i++;
	}
	try {
		Reading.insertAll(readingArr);
	} catch (err) {
		console.error(err);
	}
}
module.exports = readMetasysData;
