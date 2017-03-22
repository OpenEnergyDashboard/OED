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
	//getting filename
	const fileNameArray = filePath.split("/");
	const fileName = fileNameArray.pop();
	//list of readings
	const rows = await readCsv(filePath);
	const rows = await readCsv(filePath);
	//meterInformation
	const meter	= await Meter.getByName(fileName.replace('.csv', ''));
	let i = 0;

	for (const row of rows) {
		//timestamp. end time stamp
		const timestamp = row[0].toLocaleString();
		const start_timestamp = new Date(timestamp);
		let end_timestamp = new Date(timestamp);
		end_timestamp.setHours(end_timestamp.getHours()+1);

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
		Reading.insertAll(readingArr);
	} catch (err) {
		console.error(err);
	}
}
module.exports = readMetasysData;
