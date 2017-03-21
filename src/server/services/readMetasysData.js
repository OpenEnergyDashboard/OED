git aconst Reading = require('./../models/Reading');
const readCsv = require('./readCSV');
const Meter = require('./../models/Meter');

/**
 * Reads CSV file passed to input all the Metasys readings into database.
 * @param filePath the filePath to read
 */
async function readMetasysData(filePath) {
	const readingArr = [];
	let i = 1;
	//getting filename
	const fileNameArray = filePath.split("/");
	const fileName = fileNameArray.pop();
	//list of readings
	const rows = await readCsv(filePath);
	//meterInformation
	const meter	= await Meter.getByName(fileName.replace('.csv', ''));

	for (const row of rows) {

		//start timestamp and end timestamp. End timestamp is start timestamp + 1 hour.
		const start_timestamp = new Date(row[0]);
		let end_timestamp = new Date(start_timestamp);
		start_timestamp.setHours(end_timestamp.getHours()-1);

		//meterReading
		let meterReading = row[3];
		meterReading = meterReading.replace('kWh', '');
		meterReading = parseInt(meterReading);

		/* We have hourly trend and monthly trend for Metasys data. We just read hourly trend.
		 * So, we skip one line as we go through the data
		 */
		if ((i % 2 != 0)) {
			const reading = new Reading(meter.id, meterReading, start_timestamp, end_timestamp);
			readingArr.push(reading);
		}
		i++;
	}
	try {
		//inserting all the data from an array into database and catching error when it occurs.
		Reading.insertAll(readingArr);
	} catch (err) {
		console.error(err);
	}
}
module.exports = readMetasysData;
