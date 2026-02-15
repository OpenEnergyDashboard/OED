/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { CSVPipelineError } = require('./CustomErrors');
const Meter = require('../../models/Meter');
const readCsv = require('../pipeline-in-progress/readCsv');
const Unit = require('../../models/Unit');
const { normalizeBoolean, MeterTimeSortTypesJS } = require('./validateCsvUploadParams');
const moment = require('moment-timezone');
const { min, max } = require('lodash');
const { validate } = require('jsonschema');

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
			//validation for boolean values
			validateBooleanFields(meter, i);

			// Validate min and max values
			validateMinMaxValues(meter, i);

			// First verify GPS is okay
			// This assumes that the sixth column is the GPS as order is assumed for now in a GPS file.
			const gpsInput = meter[6];
			// Skip if undefined.
			if (gpsInput) {
				// Verify GPS is okay values
				if (!isValidGPSInput(gpsInput)) {
					let msg = `For meter ${meter[0]} the gps coordinates of ${gpsInput} are invalid.`;
					throw new CSVPipelineError(msg, undefined, 500);
				}
				// Need to reverse latitude & longitude because standard GPS gives in that order but a GPSPoint for the
				// DB is longitude, latitude.
				meter[6] = switchGPS(gpsInput);
			}

			// verify the area input
			const areaInput = meter[9];
			if (areaInput) {
				if (!isValidArea(areaInput)) {
					let msg = `For meter ${meter[0]} the area entry of ${areaInput} is invalid. Area must be a number greater than 0.`;
					throw new CSVPipelineError(msg, undefined, 500);
				}
			}

			// validate reading duplication
			const duplicateValue = meter[16];
			if (duplicateValue) {
				if (!isDuplicate(duplicateValue)) {
					let msg = `For meter ${meter[0]}, duplicate reading is outside of the range 1 to 9 inclusive.`;
					throw new CSVPipelineError(msg, undefined, 500);
				}
			}

			const timeSortValue = meter[17];
			if (timeSortValue) {
				if (!isValidTimeSort(timeSortValue)) {
					let msg = `For meter ${meter[0]} the time sort ${timeSortValue} is invalid. Valid options are increasing or decreasing.`;
					throw new CSVPipelineError(msg, undefined, 500);
				}
			}

			// validate min & maxDates
			// meter indicies based off of timeSortValue
			const minDate = meter[29];
			const maxDate = meter[30];
			if (minDate && maxDate) {
				// returns boolean
				const { msg, value } = isValidDate(minDate, maxDate);	

				if (!value) {
					// msg comes from function
					throw new CSVPipelineError(msg, undefined, 500);
				}
			}

			const timezone = meter[5];
			if (timezone) {
				if (!isValidTimeZone(timezone)) {
					let msg = `For meter ${meter[0]}, ${timezone} is not a valid time zone.`;
					throw new CSVPipelineError(msg, undefined, 500);
				}
			}

			// Verify area unit provided
			const areaUnitString = meter[25];
			if (areaUnitString) {
				//for "feet/meters/none" check
				if (!isValidAreaUnit(areaUnitString)) {
					let msg = `For meter ${meter[0]} the area unit of ${areaUnitString} is invalid.`;
					throw new CSVPipelineError(msg, undefined, 500);
				}
			//DESTINY added this check to make sure if area unit is none then area value must be empty or 0, and if area unit is not none then area value must be a number greater than 0.
				const areaCheck = validateArea(meter, i);
                if (!areaCheck.value) {
                    throw new CSVPipelineError(areaCheck.areaMsg, undefined, 500);
                }
			}
			//DESTINY added this check to make sure max error value is a number between 0 and 75 if it is provided.
			const maxErrorCheck = validateMaxError(meter, i);
			if (!maxErrorCheck.value) {
				throw new CSVPipelineError(maxErrorCheck.maxErrorMsg, undefined, 500);
			}

			// Verify meter type
			const meterTypeString = meter[4];
			if (meterTypeString) {
				if (!isValidMeterType(meterTypeString)) {
					let msg = `For meter ${meter[0]} the meter type of ${meterTypeString} is invalid. Valid types include:
								egauge, mamac, metasys, obvius, and other. `;
					throw new CSVPipelineError(msg, undefined, 500);
				}
			}

			// Process unit.
			const unitName = meter[23];
			const unitId = await getUnitId(unitName, Unit.unitType.METER, conn);
			if (!unitId) {
				const msg = `For meter ${meter[0]} the unit of ${unitName} is invalid`;
				throw new CSVPipelineError(msg, undefined, 500);
			}
			// Replace the unit's name by its id.
			meter[23] = unitId;

			// Process default graphic unit.
			const defaultGraphicUnitName = meter[24];
			const defaultGraphicUnitId = await getUnitId(defaultGraphicUnitName, Unit.unitType.UNIT, conn);
			if (!defaultGraphicUnitId) {
				const msg = `For meter ${meter[0]} the default graphic unit of ${defaultGraphicUnitName} is invalid`;
				throw new CSVPipelineError(msg, undefined, 500);
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
					throw new CSVPipelineError(`Meter identifier provided (\"${identifierOfMeter}\") in request with update for meters but more than one meter in CSV so not processing`, undefined, 500);
				}
				let currentMeter;
				currentMeter = await Meter.getByIdentifier(identifierOfMeter, conn)
					.catch(error => {
						// Did not find the meter.
						let msg = `Meter identifier of \"${identifierOfMeter}\" does not seem to exist with update for meters and got DB error of: ${error.message}`;
						throw new CSVPipelineError(msg, undefined, 500);
					});
				currentMeter.merge(...meter);
				await currentMeter.update(conn);
			} else {
				// Inserting the new meter
				await new Meter(undefined, ...meter).insert(conn)
					.catch(error => {
						// Probably duplicate meter.
						throw new CSVPipelineError(
							`Meter name of \"${meter[0]}\" got database error of: ${error.message}`, undefined, 500);
					}
					);
			}
		}
	} catch (error) {
		throw new CSVPipelineError(`Failed to upload meters due to internal OED Error: ${error.message}`, undefined, 500);
	}
}

/**
 * Checks if the string is a valid GPS representation. This requires it to be two numbers
 * separated by a comma and the GPS values to be within allowed values. The should be a latitude, longitude pair.
 * This is very similar to src/client/app/utils/calibration.ts but not TypeScript and does not do popup.
 * @param input The string to check for GPS values
 * @returns true if string is GPS and false otherwise.
 */
function isValidGPSInput(input) {
	if (input.indexOf(',') === -1) { // if there is no comma
		return false;
	} else if (input.indexOf(',') !== input.lastIndexOf(',')) { // if there are multiple commas
		return false;
	}
	// Works if value is not a number since parseFloat returns a NaN so treated as invalid later.
	const array = input.split(',').map(value => parseFloat(value));
	const latitudeIndex = 0;
	const longitudeIndex = 1;
	const latitudeConstraint = array[latitudeIndex] >= -90 && array[latitudeIndex] <= 90;
	const longitudeConstraint = array[longitudeIndex] >= -180 && array[longitudeIndex] <= 180;
	const result = latitudeConstraint && longitudeConstraint;
	return result;
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
 * @param areaInput the provided area for the meter
 * @returns true or false
 */
function isValidArea(areaInput) {
	// check for non-number input, which is not allowed
	if (Number.isNaN(areaInput)){
		return false;
	}

	// must be a number and must be non-negative
	if (areaInput > 0) {
		return true;
	} else {
		return false;
	}
}

/**
 * Checks if the area unit provided is an option
 * @param areaUnit the provided area for the meter
 * @returns true or false
 */
function isValidAreaUnit(areaUnit) { 
    const validTypes = Object.values(Unit.areaUnitType); 
    // must be one of the three values 
    if (validTypes.includes(areaUnit)) { 
        return true; 
    } else { 
        return false; 
    } 
}

/**
 * Checks if the time sort value provided is accurate (should be increasing or decreasing)
 * @param timeSortValue the provided time sort
 * @returns true or false
 */
function isValidTimeSort(timeSortValue) {
	const validTimes = Object.values(MeterTimeSortTypesJS);
	// must be one of the three values
	if (validTimes.includes(timeSortValue)) {
		return true;
	} else {
		return false;
	}
}

/**
 * Checks if the meter type provided is one of the 5 options allowed when creating a meter.
 * @param meterTypeString the string for the meter type
 * @returns true or false
 */
function isValidMeterType(meterTypeString) {
	const validTypes = Object.values(Meter.type);
	if (validTypes.includes(meterTypeString)) {
		return true;
	} else {
		return false;
	}
}

/**
 * Checks the provided time zone and if it is a real time zone.
 * @param zone the provided time zone from the csv
 * @returns true or false
 */
function isValidTimeZone(zone) {
	const validZones = moment.tz.names();
	if (validZones.includes(zone)) {
		return true;
	} else {
		return false;
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


/**
 * Validates all boolean-like fields for a given meter row.
 * @param {Array} meter - A single row from the CSV file.
 * @param {number} rowIndex - The current row index for error reporting.
 */
function validateBooleanFields(meter, rowIndex) {
	// all inputs that involve a true or false all being validated together.
	const booleanFields = {
		2: 'enabled',
		3: 'displayable',
		10: 'cumulative',
		11: 'reset',
		18: 'end only',
		32: 'disableChecks'
	};

	// this array has values which may be left empty
	const booleanUndefinedAcceptable = [
		'cumulative', 'reset', 'end only', 'disableChecks'
	];

	for (const [index, name] of Object.entries(booleanFields)) {
		let value = meter[index];

		// allows upper/lower case.
		if ((value === '' || value === undefined) && booleanUndefinedAcceptable.includes(name)) {
			// skip if the value is undefined
			continue;
		} else {
			if (typeof value === 'string') {
				value = value.toLowerCase();
			}
		}

		// Validates read values to either false or true
		if (value !== 'true' && value !== 'false' && value !== true && value !== false
			&& value !== 'yes' && value !== 'no') {
			throw new CSVPipelineError(
				`Invalid input for '${name}' in row ${rowIndex + 1}: "${meter[index]}". Expected 'true' or 'false'.`,
				undefined,
				500
			);
		}
	}
}

function validateMinMaxValues(meter, rowIndex) {
	const minValue = Number(meter[27]);
	const maxValue = Number(meter[28]);

	if (isNaN(minValue) || minValue < -9007199254740991 || (!isNaN(maxValue) && minValue > maxValue)) {
		throw new CSVPipelineError(
			`Invalid min/max values in row ${rowIndex + 1}: min="${minValue}", max="${maxValue}". ` +
			`Min or/and max must be a number larger than -9007199254740991, and less then 9007199254740991, and min must be less than max.`,
			undefined,
			500
		);
	}

		// do nothing, pass it through
	if (isNaN(maxValue) || maxValue > 9007199254740991) {
		throw new CSVPipelineError(
			`Invalid min/max values in row ${rowIndex + 1}: min="${minValue}", max="${maxValue}". ` +
			`Min or/and max must be a number larger than -9007199254740991, and less then 9007199254740991, and min must be less than max.`,
			undefined,
			500
		);
	}
}

function validateMaxError(meter, rowIndex) {
	const maxErrorValue = Number(meter[31]);
	let msg = '';

	//if its a number, validate its range
	if (!isNaN(maxErrorValue)) {
		if (maxErrorValue < 0 || maxErrorValue > 75) {	
			msg = `Invalid max error value in row ${rowIndex + 1}: maxError="${meter[31]}". ` + `MaxError must be a number larger than 0, and less than 75.`;
			return { maxErrorMsg: msg, value: false };
		}
	}
	return { maxErrorMsg: '', value: true };
}

function validateArea(meter, rowIndex) {
	const areaValue = Number(meter[9]);
	const areaUnit = meter[25];
	let msg = '';

	if (areaUnit && areaUnit.toLowerCase() === 'none') {
		if(!isNaN(areaValue) && areaValue !== 0) {
      msg = `Invalid area value in row ${rowIndex + 1}: area="${meter[9]}". ` + `Area must be empty when area unit is 'none'.`;
      return { areaMsg: msg, value: false };
    }
  }
  
  return { areaMsg: '', value: true };
}


//uploadMeters.validateMaxError = validateMaxError;
//uploadMeters.validateArea = validateArea;

/**
 * A function to validate whether or not the inputted minimum and maximum dates are valid.
 * Also validates whether the minimum date comes before, or is equal to the maximum date.
 * Includes the helper function validateYear to create a valid range of dates (currently from: 0001 to the current year).
 * Also includes helper function correctDateTimeFormat to validate and correct any variations between the inputted dates.
 * @param {String} minDate 
 * @param {String} maxDate 
 * @returns array[boolean, string]
 */
function isValidDate(minDate, maxDate) {
	let msg = '';
	
	// get correctly formatted dates and check if they're correctly formatted
	const correctMinFormat = correctDateTimeFormat(minDate);
	const correctMaxFormat = correctDateTimeFormat(maxDate);
	
	// validate that minDate was formatted correctly
	let formattedMinDate, formattedMaxDate;
	if (!correctMinFormat.value || !correctMaxFormat.value) {
		// add error messages to the overall error message
		msg += correctMinFormat.msg + '\n' + correctMaxFormat.msg;
		return { msg: msg, value: false };
	} else {
		// set the formatted dates
		formattedMinDate = correctMinFormat.msg;
		formattedMaxDate = correctMaxFormat.msg;
	}
	
    // validate that years are within range 0001 to the current date
	if (!validateYear(formattedMinDate) || !validateYear(formattedMaxDate)) {
		msg += `\nMin year ${moment(formattedMinDate, "YYYY-MM-DD", true).year()} and Max year ${moment(formattedMaxDate, "YYYY-MM-DD", true).year()} are out of range (0001 to current year).`;
		return { msg: msg, value: false };
	}
	
	let bothValid = false;
	
	// create moment objects
	const minMoment = moment(formattedMinDate, ["YYYY-MM-DD HH:mm:ss", "YYYY-MM-DD"], true); 
	const maxMoment = moment(formattedMaxDate, ["YYYY-MM-DD HH:mm:ss", "YYYY-MM-DD"], true); 
	
	// validate lengths of the dates 
	// checking if one includes time and one doesn't
    if (minMoment.length != maxMoment.length) {
		msg += `Min date: ${minMoment} and max date: ${maxMoment} are not equivalent lengths.`;
		return { msg: msg, value: false };
    }

	if (!minMoment.isValid() || !maxMoment.isValid()) {
		msg += `\nError: Either Min Date ${minDate} or Max Date ${maxDate} is invalid (or both!).`;
		return { msg: msg, value: false };
	} else if (minMoment.isValid() && maxMoment.isValid()) {
		bothValid = true;
	}
	
    // dates validated now check if minDate is == maxDate
    if (minMoment.isBefore(maxMoment) && bothValid) {
		// everything validated
		return { msg: msg, value: true };
    }
	// check if equal
	if (minMoment.isSame(maxMoment)) {
		msg += `\nMin date: ${minDate} is equal to the max date: ${maxDate}.`;
    }

	msg += `\nMin date: ${minDate} is greater than max date: ${maxDate}.`;
	return { msg: msg, value: false };
}

/**
 * A subsidary function to help out isValidDate with processing a viable year range.
 * @param {String} date 
 * @returns boolean 
 */
function validateYear(date) {
	// make sure year exists
	if (date === null || date === undefined) {
		return false;
	}

	const minYear = 1;
	const mYear = moment(date).year();
	const mCurrentYear = moment().year();

    if (mYear >= minYear && mYear <= mCurrentYear) {
        return true;
    }
    return false;
}

/**
 * A function to convert an incorrect date string -> ex: "1970-1-1 1:1:1" to a correct date string
 * "1970-01-01 01:01:01" for less of a chance of an error being thrown in the isValidDate() function.
 * @param {String} date 
 * @returns String - Targeted Format "YYYY-MM-DD HH:MM:SS"
 */
function correctDateTimeFormat(date) {
    // validate type is string
	if (typeof date != 'string') {
		return { msg: `\nError: Inputted date not a string.`, value: false };
	}

    // trim whitespace
    date = date.trim();

    // if length < 10, it's not a full date
    if (date.length < 8) {
        return { msg: `\nError: Inputted date not complete.`, value: false }; 
    }

	// accepted moment format options, more options = slower runtime
	// can remove variations of options if necessary
	// should keep: YYYY-MM-DD, YYYY-M-D, MM-DD-YYYY, M-D-YYYY
	//				YYYY-MM-DD HH:mm:ss, YYYY-MM-DD H:m:s
	//				MM-DD-YYYY HH:mm:ss, MM-DD-YYYY H:m:s 
	const acceptedFormats = [
		'YYYY-MM-DD', 'YYYY-M-D',
		'MM-DD-YYYY', 'M-D-YYYY',
		'M-DD-YYYY', 'MM-D-YYYY',
		'YYYY-M-DD', 'YYYY-MM-D',
		'YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD H:m:s',
		'MM-DD-YYYY HH:mm:ss', 'MM-DD-YYYY H:m:s',
		'M-D-YYYY HH:mm:ss', 'M-D-YYYY H:m:s',
		'M-DD-YYYY HH:mm:ss', 'M-DD-YYYY H:m:s', 
		'MM-D-YYYY HH:mm:ss', 'MM-D-YYYY H:m:s',
		'YYYY-M-DD HH:mm:ss', 'YYYY-M-DD H:m:s',
		'YYYY-MM-D HH:mm:ss', 'YYYY-MM-D HH:mm:ss',
	];	
	
	// parse date with moment 
	const mDate = moment(date, acceptedFormats, true);
    
    // check if date is valid
    if (!mDate.isValid()) {
        return { msg: `\nError: Inputted date not valid.`, value: false };
    }
	
	// check if time was included in the input
	const hasTime = date.includes(':') || date.split(/[\s-]/).length > 3;

	if (hasTime) {
		return { msg: mDate.format('YYYY-MM-DD HH:mm:ss'), value: true };
	} else {
		return { msg: mDate.format('YYYY-MM-DD'), value: true };
	}
}

/**
 * Checks if the number of times each reading is given lies within the range 1 to 9 inclusive.
 * @param {Number} duplicateValue 
 * @returns 
 */
function isDuplicate(duplicateValue) {	
    if (duplicateValue >= 1 && duplicateValue <= 9) {
        return true;
    }
    return false;
}

module.exports = uploadMeters;