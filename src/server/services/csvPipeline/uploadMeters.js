/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { CSVPipelineError } = require('./CustomErrors');
const Meter = require('../../models/Meter');
const readCsv = require('../pipeline-in-progress/readCsv');
const Unit = require('../../models/Unit');
const { normalizeBoolean } = require('./validateCsvUploadParams');
const { HTTP_CODES } = require('../../util/httpCodes');

/**
 * Middleware that uploads meters via the pipeline. This should be the final stage of the CSV Pipeline.
 * @param {express.Request} req 
 * @param {express.Response} res 
 * @param {filepath} filepath Path to meters csv file.
 * @param conn Connection to the database.
 */
async function uploadMeters(req, res, filepath, conn) {
	const temp = (await readCsv(filepath)).map(row => {
		// The Canonical structure of each row in the Meters CSV file is the order of the fields 
		// declared in the Meter constructor. If no headerRow is provided (i.e. headerRow === false),
		// then we assume that the uploaded CSV file follows this Canonical structure.

		// For now, we do not use the header row to remap the ordering of the columns.
		// To Do: Use header row to remap the indices to fit the Meter constructor
		return row.map(val => val === '' ? undefined : val);
	});

	// If there is a header row, we remove and ignore it for now.
	const meters = normalizeBoolean(req.body.headerRow) ? temp.slice(1) : temp;
	// The original code used a Promise.all to run through the meters. The issue is that the promises are run in parallel.
	// If the meters are independent as expected then this works fine. However, in the error case where one CSV file has
	// the same meter name listed twice, the order of the attempts to add to the database was arbitrary. This meant one of them
	// failed due to the duplicate name but you did not know which one. If some of the information on the two meters differed then
	// you did not know which one you would get in the database. The best result would be the first one in the CSV file would be stored
	// as this makes the most logical sense (no update here) and it is consistent. To make this happen a for loop is used as it
	// is sequential. A small negative is the database requests do not run in parallel in the usual case without an error.
	// However, uploading meters is not common so slowing it down slightly seems a reasonable price to get this behavior.

	try {
		for (let i = 0; i < meters.length; i++) {
			let meter = meters[i];

			// Validate min and max values
			const minValue = meter[27];
			const maxValue = meter[28];
			const minMaxCheck = validateMinMaxValues(minValue, maxValue, i);
			if (!minMaxCheck.value) {
				throw new CSVPipelineError(minMaxCheck.minMaxErrorMsg, undefined, 500);
			}

			// First verify GPS is okay
			// This assumes that the sixth column is the GPS as order is assumed for now in a GPS file.
			const gpsInput = meter[6];
			// Skip if undefined.
			if (gpsInput) {
				// Verify GPS is okay values
				const { validGps, message } = isValidGPSInput(gpsInput);
				if (!validGps) {
					let msg = `For meter ${meter[0]} the gps coordinates of ${gpsInput} are invalid with error of "${message}"`;
					throw new CSVPipelineError(msg, undefined, HTTP_CODES.INTERNAL_SERVER_ERROR);
				}
				// Need to reverse latitude & longitude because standard GPS gives in that order but a GPSPoint for the
				// DB is longitude, latitude.
				meter[6] = switchGPS(gpsInput);
			}

			// verify the area input
			const areaInput = meter[9];
			const areaInputCheck = isValidArea(areaInput, i);
			if (!areaInputCheck.value) {
				throw new CSVPipelineError(areaInputCheck.areaMsg, undefined, 500);
			}

			const timeSortValue = meter[17];
			const timeSortCheck = isValidTimeSort(timeSortValue, i);
			if (!timeSortCheck.value) {
				throw new CSVPipelineError(timeSortCheck.timeSortMsg, undefined, 500);
			}

			// Verify area unit provided
			const areaUnitString = meter[25];
			const areaUnitCheck = isValidAreaUnit(areaUnitString, i);
			if (!areaUnitCheck.value) {
				throw new CSVPipelineError(areaUnitCheck.areaUnitMsg, undefined, 500);
			}

			//checks to make sure max error value is a number between 0 and 75 if it is provided.
			const maxErrorInput = meter[31];
			const maxErrorCheck = validateMaxError(maxErrorInput, i);
			if (!maxErrorCheck.value) {
				throw new CSVPipelineError(maxErrorCheck.maxErrorMsg, undefined, 500);
			}

			// Verify meter type
			const meterTypeString = meter[4];
			const meterTypeCheck = isValidMeterType(meterTypeString, i);
			if (!meterTypeCheck.value) {
				throw new CSVPipelineError(meterTypeCheck.meterTypeMsg, undefined, 500);
			}


			// Process unit.
			const unitName = meter[23];
			const unitId = await getUnitId(unitName, Unit.unitType.METER, conn);
			if (!unitId) {
				const msg = `For meter ${meter[0]} the unit of ${unitName} is invalid`;
				throw new CSVPipelineError(msg, undefined, HTTP_CODES.INTERNAL_SERVER_ERROR);
			}
			// Replace the unit's name by its id.
			meter[23] = unitId;

			// Process default graphic unit.
			const defaultGraphicUnitName = meter[24];
			const defaultGraphicUnitId = await getUnitId(defaultGraphicUnitName, Unit.unitType.UNIT, conn);
			if (!defaultGraphicUnitId) {
				const msg = `For meter ${meter[0]} the default graphic unit of ${defaultGraphicUnitName} is invalid`;
				throw new CSVPipelineError(msg, undefined, HTTP_CODES.INTERNAL_SERVER_ERROR);
			}
			// Replace the default graphic unit's name by its id.
			meter[24] = defaultGraphicUnitId;

			if (normalizeBoolean(req.body.update)) {
				// Updating the new meters.
				// First get its id.
				let identifierOfMeter = req.body.meterIdentifier;
				if (!identifierOfMeter) {
					// Seems no identifier provided so use one in CSV file.
					if (!meter[7]) {
						// There is no identifier given for meter in CSV so use name as identifier since would be automatically set.
						identifierOfMeter = meter[0];
					} else {
						identifierOfMeter = meter[7];
					}
				} else if (meters.length !== 1) {
					// This error could be thrown a number of times, one per meter in CSV, but should only see one of them.
					throw new CSVPipelineError(`Meter identifier provided (\"${identifierOfMeter}\") in request with update for meters but more than one meter in CSV so not processing`, undefined, HTTP_CODES.INTERNAL_SERVER_ERROR);
				}
				let currentMeter;
				currentMeter = await Meter.getByIdentifier(identifierOfMeter, conn)
					.catch(error => {
						// Did not find the meter.
						let msg = `Meter identifier of \"${identifierOfMeter}\" does not seem to exist with update for meters and got DB error of: ${error.message}`;
						throw new CSVPipelineError(msg, undefined, HTTP_CODES.INTERNAL_SERVER_ERROR);
					});
				currentMeter.merge(...meter);
				await currentMeter.update(conn);
			} else {
				// Inserting the new meter
				await new Meter(undefined, ...meter).insert(conn)
					.catch(error => {
						// Probably duplicate meter.
						throw new CSVPipelineError(
							`Meter name of \"${meter[0]}\" got database error of: ${error.message}`, undefined, HTTP_CODES.INTERNAL_SERVER_ERROR);
					}
					);
			}
		}
	} catch (error) {
		throw new CSVPipelineError(`Failed to upload meters due to internal OED Error: ${error.message}`, undefined, HTTP_CODES.INTERNAL_SERVER_ERROR);
	}
}

// TODO This is almost the same as the client function in src/client/app/utils/calibration.ts. When the server side
// is in TS then a single version should exist and be used.
/**
 * Checks if the string is a valid GPS representation. This requires it to be two numbers
 * separated by a comma and the GPS values to be within allowed values. The should be a latitude, longitude pair.
 * This is very similar to src/client/app/utils/calibration.ts but not TypeScript and does not do popup.
 * @param input The string to check for GPS values
 * @returns true if string is GPS and false otherwise.
 */
function isValidGPSInput(input) {
	let message = '';
	let validGps = true;
	if (input.indexOf(',') === -1) { // if there is no comma
		message = 'GPS Input is missing a comma';
		validGps = false;
	} else if (input.indexOf(',') !== input.lastIndexOf(',')) { // if there are multiple commas
		message = 'GPS Input has too many commas';
		validGps = false;
	}
	if (validGps) {
		// Works if value is not a number since parseFloat returns a NaN so treated as invalid later.
		const array = input.split(',').map((value) => parseFloat(value));
		const latitudeIndex = 0;
		const longitudeIndex = 1;
		const latitudeConstraint = array[latitudeIndex] >= -90 && array[latitudeIndex] <= 90;
		const longitudeConstraint = array[longitudeIndex] >= -180 && array[longitudeIndex] <= 180;
		const result = latitudeConstraint && longitudeConstraint;
		if (!result) {
			validGps = false;
			message = 'Invalid GPS coordinate, latitude must be an integer between -90 and 90, longitude must be an integer between -180 and 180. You input: ' + input;
		}
	}
	return { validGps, message };
}

/**
 * Validates the min and max reasonable limits
 * Ensures both are valid numeric values (allowing floating points and Infinity)
 * and verifies that the minimum value does not exceed the maximum value
 * @param {string | number} minValue - inclusive minimum acceptable reading value
 * @param {string | number} maxValue - inclusive maximum acceptable reading value 
 * @param {number} rowIndex - The current row index for error reporting
 * @returns {Object} An object containing the error message (if any) and a boolean success flag
 */

function validateMinMaxValues(minValue, maxValue, rowIndex) {
	let msg = ''

	//Quick exit if both are empty
	if ((minValue === undefined || minValue === '' || minValue === null) && (maxValue === undefined || maxValue === '' || maxValue === null)) {
		return { minMaxErrorMsg: '', value: true };
	}

	//1.Test if minValue is a Valid number
	if (minValue !== undefined && minValue !== '' && minValue !== null) {
		if (typeof minValue !== 'number' && Number.isNaN(Number(minValue))) {
			msg = `Invalid Min in row ${rowIndex + 1}: "${minValue}" is not a number.`;
			return { minMaxErrorMsg: msg, value: false };
		}

	}
	//2.Check if maxValue is a Valid Number
	if (maxValue !== undefined && maxValue !== '' && maxValue !== null) {
		if (typeof maxValue !== 'number' && Number.isNaN(Number(maxValue))) {
			msg = `Invalid Max in row ${rowIndex + 1}: "${maxValue}" is not a number.`;
			return { minMaxErrorMsg: msg, value: false };
		}
	}

	//3.Convert to a number now that we know they are valid
	let minNum;

	//if its not empty convert it to a number otherwise fall back to DB defaults
	if (minValue !== undefined && minValue !== '' && minValue !== null) {
		minNum = Number(minValue);
	} else {
		minNum = Number.MIN_SAFE_INTEGER;
	}

	let maxNum;

	//if its not empty convert it to a number otherwise fall back to DB defaults
	if (maxValue !== undefined && maxValue !== '' && maxValue !== null) {
		maxNum = Number(maxValue);
	} else {
		maxNum = Number.MAX_SAFE_INTEGER;
	}
	//4.Test if min > max
	if (minNum > maxNum) {
		msg = `Invalid Min/Max Values in row ${rowIndex + 1}: Min ("${minValue}") is greater than Max ("${maxValue}").`;
		return { minMaxErrorMsg: msg, value: false };
	}
	return { minMaxErrorMsg: '', value: true };
}

/**
 * Validates the max error value for a given meter row. Range should be between 0 and 75 if it is provided
 * Allows for empty value which is treated as valid. Also allows for floating point values
 * @param {number | string} maxErrorValue - The raw max error value extracted from the CSV row
 * @param {number} rowIndex - The current row index for error reporting
 * @returns {Object} An object containing the error message (if any) and a boolean success flag
 */
function validateMaxError(maxErrorValue, rowIndex) {
	let msg = '';

	//check existence
	if (maxErrorValue === undefined || maxErrorValue === null || maxErrorValue === '') {
		return { maxErrorMsg: '', value: true };
	}

	//Strict type check
	if (typeof maxErrorValue !== 'number' && Number.isNaN(Number(maxErrorValue))) {
		msg = `Invalid Max Error in row ${rowIndex + 1}: "${maxErrorValue}" is not a number.`;
		return { maxErrorMsg: msg, value: false };
	}

	//Conversion
	const val = Number(maxErrorValue);

	//Now that we know its a number, check if it is in the valid range
	if (val < 0 || val > 75) {
		msg = `Invalid Max Error in row ${rowIndex + 1}: "${maxErrorValue}" Max error must be between 0 and 75.`;
		return { maxErrorMsg: msg, value: false };
	}

	return { maxErrorMsg: '', value: true };
}

/**
 * Reverses the latitude and longitude in GPS string. More basically, it switches the two values separated by a comma.
 * Assumes went through isValidGPSInput first so know it has a single comma so does what it should.
 * @param gpsString The string with GPS pair separated by a comma to reverse
 * @returns the new string with the updated GPS pair
 */
function switchGPS(gpsString) {
	const array = gpsString.split(',');
	// return String(array[1] + "," + array[0]);
	return (array[1] + ',' + array[0]);
}

/**
 * Checks if the area provided is a number and if it is larger than zero.
 * @param {number | string} areaInput - The provided area for the meter
 * @param {number} rowIndex - The current row index for error reporting
 * @returns {Object} An object containing the error message (if any) and a boolean success flag
 */
function isValidArea(areaInput, rowIndex) {
	let msg = '';

	const val = Number(areaInput);

	// check for non-number input, which is not allowed
	if (Number.isNaN(val)) {
		msg = `Invalid area in row ${rowIndex + 1}: "${areaInput}" is not a number.`;
		return { areaMsg: msg, value: false };
	}

	// must be a number and must be non-negative
	if (val < 0) {
		msg = `Invalid area in row ${rowIndex + 1}: "${areaInput}" cannot be less than zero.`;
		return { areaMsg: msg, value: false };
	}

	return { areaMsg: '', value: true };
}

/**
 * Checks if the unit of measurement for area is valid
 * @param {string} areaUnit - the unit of measurement for area
 * @param {number} rowIndex - The current row index for error reporting
 * @returns {Object} - An object containing the error message (if any) and a boolean success flag
 */
function isValidAreaUnit(areaUnit, rowIndex) {
	let msg = '';
	const validTypes = Object.values(Unit.areaUnitType);
	// must be one of the enum values 
	if (validTypes.includes(areaUnit)) {
		return { areaUnitMsg: '', value: true };
	} else {
		msg = `Unrecognizable area unit in row ${rowIndex + 1}: "${areaUnit}" is not a valid unit.`;
		return { areaUnitMsg: msg, value: false };
	}
}

/**
 * Checks if the time sort value provided is accurate (should be increasing or decreasing)
 * @param {string} timeSortValue - The provided time sort
 * @param {number} rowIndex - The current row index for error reporting
 * @returns {Object} - An object containing the error message (if any) and a boolean success flag
 */
function isValidTimeSort(timeSortValue, rowIndex) {
	let msg = '';
	const validTimes = Object.values(MeterTimeSortTypesJS);
	// must be one of the enum values
	if (validTimes.includes(timeSortValue)) {
		return { timeSortMsg: '', value: true };
	} else {
		msg = `Unrecognized time sort value in row ${rowIndex + 1}: "${timeSortValue}" is not a valid value. Time sort must be either increasing or decreasing.`;
		return { timeSortMsg: msg, value: false };
	}
}

/**
 * Checks if the meter type provided is one of the options allowed when creating a meter.
 * @param {string} meterTypeString - The string for the meter type
 * @param {number} rowIndex - The current row index for error reporting.
 * @returns {Object} - An object containing the error message (if any) and a boolean success flag.
 */
function isValidMeterType(meterTypeString, rowIndex) {
	let msg = '';
	const validTypes = Object.values(Meter.type);
	if (validTypes.includes(meterTypeString)) {
		return { meterTypeMsg: '', value: true };
	} else {
		msg = `Invalid meter type in row ${rowIndex + 1}: "${meterTypeString}" is not valid. Valid types are: ${Object.values(Meter.type).join(', ')}.`;
		return { meterTypeMsg: msg, value: false };
	}
}

/**
 * Return the id associated with the given unit's name.
 * If the unit's name is invalid or its type is different from expected type, return null.
 * @param {string} unitName The given unit's name.
 * @param {Unit.unitType} expectedUnitType the expected unit's type.
 * @param {*} conn The connection to use.
 * @returns 
 */
async function getUnitId(unitName, expectedUnitType, conn) {
	// Case no unit.
	if (!unitName) return -99;
	// Get the unit associated with the name.
	const unit = await Unit.getByName(unitName, conn);
	// Return null if the unit doesn't exist or its type is different from expectation.
	if (!unit || unit.typeOfUnit !== expectedUnitType) return null;
	return unit.id;
}

module.exports = uploadMeters;
