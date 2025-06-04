/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const loadArrayInput = require('../pipeline-in-progress/loadArrayInput');
const eGaugeRequestor = require('../../models/eGauge/eGaugeRequestor');

/**
 * Acquires eGauge readings for the OED meter and stores them in the database.
 * @param {*} meter meter associated with these eGauge readings.
 * @param {*} conn database connection
 */
async function readEgaugeData(meter, conn) {
	// Set up an eGauge object to get the readings.
	const requestor = new eGaugeRequestor(meter);
	// Get the readings.
	await requestor.login();
	await requestor.setRegisterId();
	const meterReadings = await requestor.getMeterReadings();
	await requestor.logout()

	// Store the readings in the database.
	await loadArrayInput(dataRows = meterReadings,
		meterID = meter.id,
		mapRowToModel = row => {
			const readRate = row[0];
			const startTimestamp = row[1];
			const endTimestamp = row[2];
			return [readRate, startTimestamp, endTimestamp];
		},
		// eGauge has decreasing timestamp order and is cumulative without reset.
		timeSort = 'decreasing',
		readingRepetition = 1,
		isCumulative = true,
		cumulativeReset = false,
		// No cumulative reset so dummy times.
		cumulativeResetStart = '0:00:00',
		cumulativeResetEnd = '0:00:00',
		// Every reading should be adjacent (no gap)
		readingGap = 0,
		// Every reading should be the same length
		readingLengthVariation = 0,
		isEndOnly = false, //true
		shouldUpdate = false,
		conditionSet = {
			minVal: meter.minVal,
			maxVal: meter.maxVal,
			minDate: meter.minDate,
			maxDate: meter.maxDate,
			threshold: readingGap,
			maxError: meter.maxError,
			disableChecks: meter.disableChecks
		},
		conn = conn,
		// eGauge uses Unix timestamps and deals with DST.
		honorDst = true,
		relaxedParsing = false,
		useMeterZone = false
	);
}

module.exports = readEgaugeData;
