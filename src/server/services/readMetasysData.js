const Reading = require('./../models/Reading');
const readCsv = require('./readCSV');
const Meter = require('./../models/Meter');
const moment = require('moment');
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
	console.log(meter);
	let q = 0;
	for (const row of rows) {
		q = q + 1;
		if (q % 1000 === 0) {
			console.log(q);
		}
		if (row[0] === '') {
			continue;
		}
		//start timestamp and end timestamp. End timestamp is start timestamp + 1 hour.
		// 9/25/16 11:30
		const end_timestamp = moment(row[0], 'MM/DD/YY HH:mm');
		let start_timestamp = moment(end_timestamp).subtract(30, 'minutes');
		//meterReading
		let meterReading = row[3];
		meterReading = meterReading.replace(' kW', '');
		meterReading = Math.round(parseFloat(meterReading));


		/* We have hourly trend and monthly trend for Metasys data. We just read hourly trend.
		 * So, we skip one line as we go through the data
		 */
//		if ((i % 2 != 0)) {
			const reading = new Reading(meter.id, meterReading, start_timestamp.toDate(), end_timestamp.toDate());
			readingArr.push(reading);
//		}
//		i++;
	}
	try {
		console.log("About to insert");
		//inserting all the data from an array into database and catching error when it occurs.
		Reading.insertAll(readingArr).then(() => console.log("Done"));
	} catch (err) {
		console.error(err);
	}
}
module.exports = readMetasysData;
