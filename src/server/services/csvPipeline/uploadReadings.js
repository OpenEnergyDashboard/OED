/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { CSVPipelineError } = require('./CustomErrors');
const success = require('./success');
const fs = require('fs').promises;
const loadCsvInput = require('../pipeline-in-progress/loadCsvInput');
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

	const { createMeter, cumulative, cumulativeReset, duplications, headerRow,
		length, meterName, mode, timeSort, update } = req.body; // extract query parameters

	const areReadingsCumulative = (cumulative === 'true');
	const hasHeaderRow = (headerRow === 'true');
	const readingRepetition = duplications;

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
				const tempMeter = new Meter(undefined, meterName, undefined, false, false, Meter.type.MAMAC, meterName);
				await tempMeter.insert(conn);
				return tempMeter;
			}
		});

	const mapRowToModel = row => { return row; }; // STUB function to satisfy the parameter of loadCsvInput.
	await loadCsvInput(
		filepath,
		meter.id,
		mapRowToModel,
		false,
		areReadingsCumulative,
		cumulativeReset,
		readingRepetition,
		undefined,
		hasHeaderRow,
		conn
	); // load csv data
	// TODO: If unsuccessful upload then an error will be thrown. We need to catch this error.
	fs.unlink(filepath).catch(err => log.error(`Failed to remove the file ${filepath}.`, err));
	success(req, res, 'It looks like success.'); // TODO: We need a try catch for all these awaits.
	return;
}

module.exports = uploadReadings;