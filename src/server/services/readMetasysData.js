const Reading = require('./../models/Reading');
const readCsv = require('./readCSV');
const Meter = require('./../models/Meter');
const moment = require('moment');
/**
 * Reads CSV file passed to input all the Metasys readings into database.
 * @param filePath the filePath to read
 */
async function readMetasysData(filePath, readingInterval, readingRepetition, cumulativeIndicator,conn) {
	//arrays to store readings and rows
	const readingArray = [];
	const rowArray = [];

	//getting filename
	const fileNameArray = filePath.split("/");
	const fileName = fileNameArray.pop();

	//list of readings
	const rows = await readCsv(filePath);

	//meterInformation
	const meter = await Meter.getByName(fileName.replace('.csv', ''));

	//Initialize timestamps and other variables
	let start_timestamp = moment(0);
	let end_timestamp = moment(0);
	let index = 0;
	let meterReading, meterReading1, meterReading2 = 0;

	for (const row of rows) {
		rowArray.push(row);
		// To read data where same reading is repeated. Like E-mon D-mon meters
		if (index != 0 && Math.abs((index - readingRepetition) % readingRepetition) == 0) {
			//set start_timestamp and end_timestamp
			start_timestamp = moment(rowArray[index][0], 'MM/DD/YY HH:mm');
			end_timestamp = moment(rowArray[index - readingRepetition][0], 'MM/DD/YY HH:mm');
			//meterReading for cumulative readings
			if (cumulativeIndicator == true) {
				//meterReading1
				meterReading1 = rowArray[index - readingRepetition][3];
				meterReading1 = meterReading1.replace(' kW', '');
				meterReading1 = Math.round(parseFloat(meterReading1));

				//meterReading2
				meterReading2 = rowArray[index][3];
				meterReading2 = meterReading2.replace(' kW', '');
				meterReading2 = Math.round(parseFloat(meterReading2));
				meterReading = meterReading1 - meterReading2;
			}
			//for data points
			else {
				//meterReading
				meterReading = rowArray[index - readingRepetition][3];
				meterReading = meterReading.replace(' kW', '');
				meterReading = Math.round(parseFloat(meterReading));
				console.log(meterReading);
			}
			//To handle cumulative readings that resets at midnight
			if(meterReading < 0){
				meterReading = meterReading1;
			}
			//push into reading Array
			const reading = new Reading(meter.id, meterReading, start_timestamp.toDate(), end_timestamp.toDate());
			readingArray.push(reading);
		}
		index = index + 1;
	}

	/*Deal with the last reading*/
	// Timestamp for last reading
	const lastRow = await rowArray.pop();
	end_timestamp = moment(lastRow[0], 'MM/DD/YY HH:mm');
	start_timestamp = moment(end_timestamp).subtract(readingInterval, 'minutes');
	//meterReadingForLastReading
	let meterReadingEnd = lastRow[3].replace(' kW', '');
	meterReadingEnd = Math.round(parseFloat(meterReadingEnd));
	//pushing last reading into array
	const reading = new Reading(meter.id,meterReadingEnd,start_timestamp.toDate(),end_timestamp.toDate());
	readingArray.push(reading);

	// //Insert into database
	try {
		console.log("About to insert");
		//inserting all the data from an array into database and catching error when it occurs.
		Reading.insertAll(readingArray,conn).then(() => console.log("Done"));
	} catch (err) {
		console.error(err);
	}
}
module.exports = readMetasysData;
