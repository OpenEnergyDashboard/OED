/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { CSVPipelineError } = require('./CustomErrors');
const { loadCsvInput } = require('../pipeline-in-progress/loadCsvInput');
const { normalizeBoolean, MeterTimeSortTypesJS } = require('./validateCsvUploadParams');
const Meter = require('../../models/Meter');

/**
 * Middleware that uploads readings via the pipeline. This should be the final stage of the CSV Pipeline.
 * @param {express.Request} req 
 * @param {express.Response} res 
 * @param {string} filepath Path to readings csv file
 * @param conn 
 * @returns 
 */
async function uploadReadings(req, res, filepath, conn) {
	const { meterIdentifier, meterName, headerRow, update, honorDst, relaxedParsing, useMeterZone } = req.body; // extract query parameters
	// The next few have no value in the DB for a meter so always use the value passed.
	const hasHeaderRow = normalizeBoolean(headerRow);
	const shouldUpdate = normalizeBoolean(update);
	let shouldHonorDst = normalizeBoolean(honorDst);
	let shouldRelaxedParsing = normalizeBoolean(relaxedParsing);
	let shouldUseMeterZone = normalizeBoolean(useMeterZone);
	// TODO:
	// Allowing for backwards compatibility if any users are still using the 'meterName' parameter instead of
	// the 'meterIdentifier' parameter to login. Developers need to decide in the future if we should deprecate
	// using 'meterName' or continue to allow this backwards compatibility
	let meter;
	try {
		if (meterIdentifier) {
			meter = await Meter.getByIdentifier(meterIdentifier, conn);
		} else {
			meter = await Meter.getByName(meterName, conn);
		}
	} catch (error) {
		// If Meter does not exist, we do not know what to do with the readings so we error out.
		let errorMessage = meterIdentifier
		? `User Error: Meter with identifier '${meterIdentifier}' not found.`
		: `User Error: Meter with name '${meterName}' not found.`;

		throw new CSVPipelineError(
			errorMessage,
			error.message
		);
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
	// For the parameters, they either have one of the desired values or an "empty" value.
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

	if (timeSort === undefined) {
		if (meter.timeSort === null) {
			// This probably should not happen with a new DB but keep just in case.
			// No variation allowed.
			readingTimeSort = MeterTimeSortTypesJS.increasing;
		} else {
			readingTimeSort = MeterTimeSortTypesJS[meter.timeSort];
		}
	} else {
		readingTimeSort = timeSort;
	}

	if (cumulative === undefined) {
		if (meter.cumulative === null) {
			// This probably should not happen with a new DB but keep just in case.
			// No variation allowed.
			readingsCumulative = false;
		} else {
			readingsCumulative = meter.cumulative;
		}
	} else {
		readingsCumulative = normalizeBoolean(cumulative);
	}
	const areReadingsCumulative = readingsCumulative;

	if (cumulativeReset === undefined) {
		if (meter.cumulativeReset === null) {
			// This probably should not happen with a new DB but keep just in case.
			// No variation allowed.
			readingsReset = false;
		} else {
			readingsReset = meter.cumulativeReset;
		}
	} else {
		readingsReset = normalizeBoolean(cumulativeReset);
	}
	const doReadingsReset = readingsReset;

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

	if (endOnly === undefined) {
		if (meter.endOnlyTime === null) {
			// This probably should not happen with a new DB but keep just in case.
			// No variation allowed.
			readingEndOnly = false;
		} else {
			readingEndOnly = meter.endOnlyTime;
		}
	} else {
		readingEndOnly = normalizeBoolean(endOnly);
	}
	const areReadingsEndOnly = readingEndOnly;

	const mapRowToModel = row => { return row; }; // STUB function to satisfy the parameter of loadCsvInput.

	const conditionSet = {
		minVal: meter.minVal,
		maxVal: meter.maxVal,
		minDate: meter.minDate,
		maxDate: meter.maxDate,
		threshold: meter.readingGap,
		maxError: meter.maxError,
		disableChecks: meter.disableChecks
	}

	return await loadCsvInput(
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
		shouldUpdate,
		conditionSet,
		conn,
		shouldHonorDst,
		shouldRelaxedParsing,
		shouldUseMeterZone
	); // load csv data
}

module.exports = uploadReadings;
