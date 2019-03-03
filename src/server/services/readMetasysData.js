/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const Reading = require('./../models/Reading');
const readCsv = require('./readCSV');
const Meter = require('./../models/Meter');
const moment = require('moment');
const path = require('path');

/**
 * Reads CSV file passed to input all the Metasys readings into database.
 * @param filePath  the filePath to read the metasys data
 * @param readingInterval  value of the reading interval. For example 60 minutes, 30 minutes.
 * @param readingRepetition value is 1 if reading is not duplicated. 2 if repeated twice and so on.
 * @param  cumulativeIndicator false if readings are not cumulative and vice-versa.
 * @param conn the database connection to use
 */
async function readMetasysData(filePath, readingInterval, readingRepetition, cumulativeIndicator, conn) {
	// arrays to store readings and rows
	const readingArray = [];
	const rowArray = [];

	// getting filename
	const fileName = path.basename(filePath);
	// list of readings
	const rows = await readCsv(filePath);

	// meterInformation
	const meter = await Meter.getByName(fileName.replace('.csv', ''), conn);

	// Initialize timestamps and other variables
	let startTimestamp = moment(0);
	let endTimestamp = moment(0);
	let index = 0;
	let meterReading = 0;
	let meterReading1 = 0;
	let meterReading2 = 0;

	for (const row of rows) {
		rowArray.push(row);
		// To read data where same reading is repeated. Like E-mon D-mon meters
		if (index !== 0 && Math.abs((index - readingRepetition) % readingRepetition) === 0) {
			// set start_timestamp and end_timestamp
			startTimestamp = moment(rowArray[index][0], 'MM/DD/YY HH:mm');
			endTimestamp = moment(rowArray[index - readingRepetition][0], 'MM/DD/YY HH:mm');
			// meterReading for cumulative readings
			if (cumulativeIndicator === true) {
				// meterReading1
				meterReading1 = rowArray[index - readingRepetition][3];
				meterReading1 = meterReading1.replace(' kW', '');
				meterReading1 = Math.round(parseFloat(meterReading1));

				// meterReading2
				meterReading2 = rowArray[index][3];
				meterReading2 = meterReading2.replace(' kW', '');
				meterReading2 = Math.round(parseFloat(meterReading2));
				meterReading = meterReading1 - meterReading2;
			} else { // for data points
				// meterReading
				meterReading = rowArray[index - readingRepetition][3];
				meterReading = meterReading.replace(' kW', '');
				meterReading = Math.round(parseFloat(meterReading));
			}
			// To handle cumulative readings that resets at midnight
			if (meterReading < 0) {
				meterReading = meterReading1;
			}
			// push into reading Array
			const newReading = new Reading(meter.id, meterReading, startTimestamp.toDate(), endTimestamp.toDate());
			readingArray.push(newReading);
		}
		index += 1;
	}

	// Deal with the last reading
	// Timestamp for last reading
	const lastRow = await rowArray.pop(conn);
	endTimestamp = moment(lastRow[0], 'MM/DD/YY HH:mm');
	startTimestamp = moment(endTimestamp).subtract(readingInterval, 'minutes');
	// meterReadingForLastReading
	let meterReadingEnd = lastRow[3].replace(' kW', '');
	meterReadingEnd = Math.round(parseFloat(meterReadingEnd));
	// pushing last reading into array
	const reading = new Reading(meter.id, meterReadingEnd, startTimestamp.toDate(), endTimestamp.toDate());
	readingArray.push(reading);
	return await Reading.insertAll(readingArray, conn);
}
module.exports = readMetasysData;

