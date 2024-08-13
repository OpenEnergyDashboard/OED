/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { CSVPipelineError } = require('./CustomErrors');
const Meter = require('../../models/Meter');
const readCsv = require('../pipeline-in-progress/readCsv');
const Unit = require('../../models/Unit');
const { normalizeBoolean } = require('./validateCsvUploadParams');

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
			// First verify GPS is okay
			// This assumes that the sixth column is the GPS as order is assumed for now in a GPS file.
			const gpsInput = meter[6];
			// Skip if undefined.
			if (gpsInput) {
				// Verify GPS is okay values
				if (!isValidGPSInput(gpsInput)) {
					let msg = `For meter ${meter[0]} the gps coordinates of ${gpsInput} are invalid`;
					throw new CSVPipelineError(msg, undefined, 500);
				}
				// Need to reverse latitude & longitude because standard GPS gives in that order but a GPSPoint for the
				// DB is longitude, latitude.
				meter[6] = switchGPS(gpsInput);
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
