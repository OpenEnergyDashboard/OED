/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { CSVPipelineError } = require('./CustomErrors');
const { success, failure } = require('./success');
const loadCsvInput = require('../pipeline-in-progress/loadCsvInput');
const { TimeSortTypesJS, BooleanTypesJS } = require('./validateCsvUploadParams');
const Meter = require('../../models/Meter');
const { log } = require('../../log');
const moment = require('moment');

/**
 * Middleware that uploads readings via the pipeline. This should be the final stage of the CSV Pipeline.
 * @param {express.Request} req 
 * @param {express.Response} res 
 * @param {string} filepath Path to readings csv file
 * @param conn 
 * @returns 
 */
async function uploadReadings(req, res, filepath, conn) {
	// TODO update parameter is not currently used
	const { meterName, createMeter, headerRow } = req.body; // extract query parameters
	// headerRow has no value in the DB for a meter so always use the value passed.
	const hasHeaderRow = (headerRow === 'true');
	let meterCreated = false;
	let meter = await Meter.getByName(meterName, conn)
		.catch(async err => {
			// Meter#getByNames throws an error when no meter is found. We need the catch clause to account for this error.
			if (createMeter !== 'true') {
				// If createMeter is not set to true, we do not know what to do with the readings so we error out.
				throw new CSVPipelineError(
					`User Error: Meter with name '${meterName}' not found. createMeter needs to be set true in order to automatically create meter.`,
					err.message
				);
			} else {
				// If createMeter is true, we will create the meter for the user.
				// The meter type cannot be null. We use MAMAC as a default.
				const tempMeter = new Meter(undefined, meterName, undefined, false, false, Meter.type.MAMAC, undefined, undefined, meterName,
					'created via reading upload on ' + moment().format());
				await tempMeter.insert(conn);
				meterCreated = true;
				log.info('Creating meter ' + tempMeter.name);
				return await Meter.getByName(tempMeter.name, conn); // Get meter from DB after insert because some defaults are set within the DB.
			}
		});
	if (!meterCreated && createMeter === 'true') {
		log.warn('The create meter was set but the meter already existed for meter ' + meter.name);
	}

	// Handle other parameter defaults
	let { timeSort, duplications, cumulative, cumulativeReset, cumulativeResetStart, cumulativeResetEnd,
		lengthGap, lengthVariation, endOnly } = req.body;
	let readingTimeSort;
	let readingRepetition;
	let readingsCumulative;
	let readingsReset;
	let readingResetStart;
	let readingResetEnd;
	let readingGap;
	let readingLengthVariation;
	let readingEndOnly;
	// For the parameters, they either have one of the desired values or a "empty" value.
	// An empty value means use the value from the DB meter or, in the unlikely event it is not set,
	// then use the default value. For values coming from the web page:
	//   In the case of timeSort, cumulative, cumulativeReset & endOnly empty is the enum 'meter' value.
	//   For other parameters it is an empty string.
	// For parameters coming from a curl command, the values will be undefined.
	// For this reason both possibilities are tested (the web page one and the curl one) to know if the
	// meter or default value should be used.
	// TODO: We made the assumption that in the DB, the cumulative and cumulativeReset columns (and maybe other boolean ones)
	// is either true or false.
	// On further inspection, these values can be null. At the moment, we are not sure what this means for the pipeline.
	// As a quick fix, we will assume that null, means false.

	if (duplications === undefined || duplications === '') {
		if (meter.readingVariation === null) {
			// This probably should not happen with a new DB but keep just in case.
			// No variation allowed.
			readingRepetition = 1;
		} else {
			readingRepetition = meter.readingDuplication;
		}
	} else {
		// Convert string that is a real number to a value.
		// Note the variable changes from string to real number.
		readingRepetition = parseInt(duplications, 10);
	}

	if (timeSort === undefined || timeSort === TimeSortTypesJS.meter) {
		if (meter.timeSort === null) {
			// This probably should not happen with a new DB but keep just in case.
			// No variation allowed.
			readingTimeSort = TimeSortTypesJS.increasing;
		} else {
			readingTimeSort = TimeSortTypesJS[meter.timeSort];
		}
	} else {
		readingTimeSort = timeSort;
	}

	if (cumulative === undefined || cumulative === BooleanTypesJS.meter) {
		if (meter.cumulative === null) {
			// This probably should not happen with a new DB but keep just in case.
			// No variation allowed.
			readingCumulative = BooleanTypesJS.false;
		} else {
			readingCumulative = BooleanTypesJS[meter.cumulative];
		}
	} else {
		readingCumulative = cumulative;
	}
	const areReadingsCumulative = (readingCumulative === 'true');

	if (cumulativeReset === undefined || cumulativeReset === BooleanTypesJS.meter) {
		if (meter.cumulativeReset === null) {
			// This probably should not happen with a new DB but keep just in case.
			// No variation allowed.
			readingsReset = BooleanTypesJS.false;
		} else {
			readingsReset = BooleanTypesJS[meter.cumulativeReset];
		}
	} else {
		readingsReset = cumulativeReset;
	}
	const doReadingsReset = (readingsReset === 'true');

	if (cumulativeResetStart === undefined || cumulativeResetStart === '') {
		if (meter.cumulativeResetStart === null) {
			// This probably should not happen with a new DB but keep just in case.
			readingResetStart = '0:00:00';
		} else {
			readingResetStart = meter.cumulativeResetStart;
		}
	} else {
		readingResetStart = cumulativeResetStart;
	}

	if (cumulativeResetEnd === undefined || cumulativeResetEnd === '') {
		if (meter.cumulativeResetEnd === null) {
			// This probably should not happen with a new DB but keep just in case.
			readingResetEnd = '23:59:59.999999';
		} else {
			readingResetEnd = meter.cumulativeResetEnd;
		}
	} else {
		readingResetEnd = cumulativeResetEnd;
	}

	if (lengthGap === undefined || lengthGap === '') {
		if (meter.readingGap === null) {
			// This probably should not happen with a new DB but keep just in case.
			// No variation allowed.
			readingGap = 0;
		} else {
			readingGap = meter.readingGap;
		}
	} else {
		// Convert string that is a real number to a value.
		// Note the variable changes from string to real number.
		readingGap = parseFloat(lengthGap);
	}

	if (lengthVariation === undefined || lengthVariation === '') {
		if (meter.readingVariation === null) {
			// This probably should not happen with a new DB but keep just in case.
			// No variation allowed.
			readingLengthVariation = 0;
		} else {
			readingLengthVariation = meter.readingVariation;
		}
	} else {
		// Convert string that is a real number to a value.
		// Note the variable changes from string to real number.
		readingLengthVariation = parseFloat(lengthVariation);
	}

	if (endOnly === undefined || endOnly === BooleanTypesJS.meter) {
		if (meter.endOnlyTime === null) {
			// This probably should not happen with a new DB but keep just in case.
			// No variation allowed.
			readingEndOnly = BooleanTypesJS.false;
		} else {
			readingEndOnly = BooleanTypesJS[meter.endOnlyTime];
		}
	} else {
		readingEndOnly = endOnly;
	}
	const areReadingsEndOnly = (readingEndOnly === 'true');

	const mapRowToModel = row => { return row; }; // STUB function to satisfy the parameter of loadCsvInput.
	let { isAllReadingsOk, msgTotal } = await loadCsvInput(
		filepath,
		meter.id,
		mapRowToModel,
		readingTimeSort,
		readingRepetition,
		areReadingsCumulative,
		doReadingsReset,
		readingResetStart,
		readingResetEnd,
		readingGap,
		readingLengthVariation,
		areReadingsEndOnly,
		hasHeaderRow,
		undefined,
		conn
	); // load csv data
	// TODO: If unsuccessful upload then an error will be thrown. We need to catch this error.
	//fs.unlink(filepath).catch(err => log.error(`Failed to remove the file ${filepath}.`, err));
	let message;
	if (isAllReadingsOk) {
		message = '<h2>It looks like the insert of the readings was a success.</h2>'
		if (msgTotal !== '') {
			message += '<h3>However, note that the processing of the readings returned these warning(s):</h3>' + msgTotal;
		}
		success(req, res, message);
	} else {
		message = '<h2>It looks like the insert of the readings had issues with some or all of the readings where' +
			' the processing of the readings returned these warning(s)/error(s):</h2>' + msgTotal;
		failure(req, res, message);
	}
	return;
}

module.exports = uploadReadings;