
const Reading = require('./../models/Reading');
const readCsv = require('./readCSV');
const Meter = require('./../models/Meter');

/**
 * Reads CSV file passed to input all the Metasys readings into database.
 * @param filePath the filePath to read
 */
async function readMetasysData(filePath) {
	const readingArr = [];
	let i = 1;
	// getting filename
	const fileNameArray = filePath.split('/');
	const fileName = fileNameArray.pop();
	// list of readings
	const rows = await readCsv(filePath);
	// meterInformation
	const meter	= await Meter.getByName(fileName.replace('.csv', ''));

	for (const row of rows) {
		// timestamp. end time stamp
		const timestamp = row[0].toLocaleString();
		const startTimestamp = new Date(timestamp);
		const endTimestamp = new Date(timestamp);
		endTimestamp.setHours(endTimestamp.getHours() + 1);


		// meterReading
		let meterReading = row[3];
		meterReading = meterReading.replace('kWh', '');
		meterReading = parseInt(meterReading);

		/* We have hourly trend and monthly trend for Metasys data. We just read hourly trend.
		 * So, we skip one line as we go through the data
		 */
		if (i % 2 !== 0) {
			const reading = new Reading(meter.id, meterReading, startTimestamp, endTimestamp);
			readingArr.push(reading);
		}
		i++;
	}
	try {
		// inserting all the data from an array into database and catching error when it occurs.
		Reading.insertAll(readingArr);
	} catch (err) {
		console.error(err);
	}
}
module.exports = readMetasysData;
