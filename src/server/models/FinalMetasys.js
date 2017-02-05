const promisify = require('es6-promisify');
const Reading = require('./Reading');
const readCsv = require('../controllers/readCSV');
/**
 * Returns a promise to read the given CSV file into an array of arrays.
 * @param fileName the filename to read
 * @return {Promise.<array.<array>>}
 */

// what is this returning??
var array = [];
var i = 1;
readCsv('PowerMon1.csv')
	.then(rows => {
		for (const row of rows) {

			//timestamp
			var timestamp = row[0];
			timestamp = timestamp.toString();
			var time = new Date(timestamp);

			//meterReading
			var meterReading = row[3];
			meterReading = meterReading.replace('kWh', '');

			meterReading = parseInt(meterReading);
			console.log(meterReading);
			if ((i % 2 != 0)) {
				var reading = new Reading(14, meterReading, time);
				array.push(reading);
			}
			i++;

		}
		console.log(array);
		return array;

		// console.log(array);

	})
	//Error showing.Please check.
	.then(array => Reading.insertAll(array))
	.catch(console.error);








