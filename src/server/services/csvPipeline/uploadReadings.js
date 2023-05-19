/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { CSVPipelineError } = require('./CustomErrors');
const { loadCsvInput } = require('../pipeline-in-progress/loadCsvInput');
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
	const { meterName, createMeter, headerRow, update, honorDst, relaxedParsing } = req.body; // extract query parameters
	// The next few have no value in the DB for a meter so always use the value passed.
	const hasHeaderRow = (headerRow === 'true');
	const shouldUpdate = (update === 'true');
	let shouldHonorDst = (honorDst === 'true');
	let shouldRelaxedParsing = (relaxedParsing === 'true');
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
				// The meter type is unknown so set to other. Most parameters take on default values.
				const tempMeter = new Meter(
					undefined, // id
					meterName, // name
					undefined, // URL
					false, // enabled
					false, // displayable
					Meter.type.OTHER, // type 
					undefined, // timezone
					undefined, // gps
					meterName, // identifier
					'created via reading upload on ' + moment().format(), // note
					undefined, //area
					undefined, // cumulative
					undefined, // cumulativeReset
					undefined, // cumulativeResetStart
					undefined, // cumulativeResetEnd
					undefined, // readingGap
					undefined, // readingVariation
					undefined, // readingDuplication
					undefined, // timeSort
					undefined, // endOnlyTime
					undefined, // reading
					undefined, // startTimestamp
					undefined, // endTimestamp
					undefined, // previousEnd
					undefined, // unit
					undefined, // default graphic unit
					undefined, // area unit
					undefined // reading frequency
				)
				await tempMeter.insert(conn);
				meterCreated = true;
				log.info('Creating meter ' + tempMeter.name);
				return await Meter.getByName(tempMeter.name, conn); // Get meter from DB after insert because some defaults are set within the DB.
			}
		});
	if (!meterCreated && createMeter === BooleanTypesJS.true) {
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
			readingsCumulative = BooleanTypesJS.false;
		} else {
			readingsCumulative = BooleanTypesJS[meter.cumulative];
		}
	} else {
		readingsCumulative = cumulative;
	}
	const areReadingsCumulative = (readingsCumulative === BooleanTypesJS.true);

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
	const doReadingsReset = (readingsReset === BooleanTypesJS.true);

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
	const areReadingsEndOnly = (readingEndOnly === BooleanTypesJS.true);

	const mapRowToModel = row => { return row; }; // STUB function to satisfy the parameter of loadCsvInput.
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
		undefined,
		conn,
		shouldHonorDst,
		shouldRelaxedParsing
	); // load csv data
}

module.exports = uploadReadings;