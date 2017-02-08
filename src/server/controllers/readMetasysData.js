const promisify = require('es6-promisify');
const Reading = require('./../models/Reading');
const readCsv = require('readCSV');
const meter = require('./../models/Meter');
/**
 * Reads CSV file passed to input all the Metasys readings into database.
 * @param fileName the filename to read
 */
function readMetasysData(filename) {
	const array = [];
	let i = 1;
	return readCsv(filename)
		.then(rows => {
			for (const row of rows) {

				//timestamp
				let timestamp = row[0];
				timestamp = timestamp.toLocaleString();
				const time = new Date(timestamp);

				//meterReading
				let meterReading = row[3];
				meterReading = meterReading.replace('kWh', '');
				meterReading = parseInt(meterReading);

				//meterID
				let meterID = meter.getByName(filename.replace('.csv',''));
				console.log(meterID);

				/* We have hourly trend and monthly trend for Metasys data. We just read hourly trend.
				 * So, we skip one line as we go through the data
				 */
				if ((i % 2 != 0)) {
					const reading = new Reading(meterID, meterReading, time);
					array.push(reading);
				}
				i++;
			}
			return array;
		})
		.then(Reading.insertAll)
		.then(console.log('done inserting'))
		.catch(console.error);
}
module.exports = readMetasysData;



