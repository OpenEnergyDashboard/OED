/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const util = require('util');
const axios = require('axios');
const csv = require('csv');
const moment = require('moment');
const Reading = require('../models/Reading');
const loadArrayInput = require('./pipeline-in-progress/loadArrayInput');

const parseCsv = util.promisify(csv.parse);

function parseTimestamp(raw, line) {
	raw = raw.trim();
	const timestampRegExp = /^\d{2}:\d{2}:\d{2} \d{1,2}\/\d{1,2}\/\d{1,2}$/;
	if (!timestampRegExp.test(raw)) {
		throw new Error(`CSV line ${line}: Raw timestamp ${raw} does not pass regex validation`);
	}
	// moment cannot be set to strict mode since it fails. However, the expected format is given so
	// it should do a good test.
	// MAMAC meters do not send a timezone so we parse the string directly and it is interpreted
	// as UTC which is what we want and parseZone does not shift the time.
	const ts = moment.parseZone(raw, 'HH:mm:ss MM/DD/YY')
	// This check should be done in pipeline but leave here for now/historical reasons. Note in pipeline check if
	// format() value is Invalid date.
	if (!ts.isValid()) {
		throw new Error(`CSV line ${line}: Raw timestamp ${raw} does not parse to a valid moment object`);
	}
	return ts;
}

/**
 * Returns a promise containing all the readings currently stored on the given meter's hardware.
 * The promise will reject if the meter doesn't have an IP address.
 * @param meter meter to update readings with
 * @param conn DB connection to use
 * @returns {Promise.<array.<Reading>>}
 */
async function readMamacData(meter, conn) {
	// First get a promise that's just the meter itself (or an error if it doesn't have an IP address)
	if (!meter.url) {
		throw new Error(`${meter} doesn't have an IP address to read data from`);
	}
	if (!meter.id) {
		throw new Error(`${meter} doesn't have an id to associate readings with`);
	}
	const rawReadings = await axios.get(`http://${meter.url}/int2.csv`);
	const parsedReadings = await parseCsv(rawReadings.data);
	// Hold the end and start date/timestamp for each reading as processed.
	let endTs;
	let startTs;
	let meterReadings = parsedReadings.map((raw, index) => {
		let line = index + 1;
		const reading = Number(raw[0]);
		// This is now checked in the pipeline but leave here for now/historical reasons.
		if (isNaN(reading)) {
			const e = Error(`CSV line ${line}: Meter reading ${reading} parses to NaN for meter named ${meter.name} with id ${meter.id}`);
			e.options = { ipAddress: meter.url };
			throw e;
		}
		try {
			// Mamac meters return all previous readings for 60 days. As a result, the next time you
			// get data the value stored on the meter is much later than the first value in the new
			// batch. Since the first value can be different depending on how long since the last
			// acquisition, it is tricky to get the meter value right. As a result, we assume every
			// reading is one hour long and we are getting the end time value. This allows the code
			// to calculate the start time for each point. This has always worked but does mean we
			// cannot use the new end time only option in the pipeline. An alternative was to modify
			// the pipeline to deal with this but decided not to do that.
			// Mamac timestamps look like 11:00:00 7/31/16 so Moment handle by default.
			startTs = parseTimestamp(raw[1], line).subtract(1, 'hours');
			endTs = parseTimestamp(raw[1], line);
		} catch (re) {
			const e = Error(re.message);
			e.options = { ipAddress: meter.url };
			throw e;
		}
		return [reading, startTs, endTs]
	});
	// Insert readings that were okay for this meter.
	// The pipeline does it one meter at a time.
	// Ignoring that loadArrayInput returns values
	// since this is only called by an automated process at this time.
	// Issues from the pipeline will be logged by called functions.
	await loadArrayInput(dataRows = meterReadings,
		meterID = meter.id,
		mapRowToModel = row => {
			const readRate = row[0];
			const startTimestamp = row[1];
			const endTimestamp = row[2];
			return [readRate, startTimestamp, endTimestamp];
		},
		timeSort = 'increasing',
		readingRepetition = 1,
		isCumulative = false,
		cumulativeReset = false,
		// No cumulative reset so dummy times.
		cumulativeResetStart = '0:00:00',
		cumulativeResetEnd = '0:00:00',
		// Every reading should be adjacent (no gap)
		readingGap = 0,
		// Every reading should be the same length
		readingLengthVariation = 0,
		isEndOnly = false,
		// Previous Mamac values should not change.
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
		honorDst = false,
		relaxedParsing = false,
		useMeterZone = false
	);
}

module.exports = readMamacData;
