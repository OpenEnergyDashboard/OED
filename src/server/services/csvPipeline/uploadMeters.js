/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { CSVPipelineError } = require('./CustomErrors');
const { success } = require('./success');
const Meter = require('../../models/Meter');
const readCsv = require('../pipeline-in-progress/readCsv');

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
	const meters = (req.body.headerRow === 'true') ? temp.slice(1) : temp;
	await Promise.all(meters.map(async meter => {
		if (req.body.update === 'true') {
			// Updating the new meters.
			// First get its id.
			let nameOfMeter = req.body.meterName;
			if (!nameOfMeter) {
				// Seems no name provided so use one in CSV file.
				nameOfMeter = meter[0];
			} else if (meters.length !== 1) {
				// This error could be thrown a number of times, one per meter in CSV, but should only see one of them.
				throw new CSVPipelineError(`Meter name provided (${nameOfMeter}) in request with update for meters but more than one meter in CSV so not processing`, undefined, 500);
			}
			let currentMeter;
			currentMeter = await Meter.getByName(nameOfMeter, conn)
				.catch(error => {
					// Did not find the meter.
					let msg = `Meter name of ${nameOfMeter} does not seem to exist with update for meters and got DB error of: ${error.message}`;
					throw new CSVPipelineError(msg, undefined, 500);
				});
			currentMeter.merge(...meter);
			await currentMeter.update(conn);
		} else {
			// Inserting the new meters.
			await new Meter(undefined, ...meter).insert(conn)
				.catch(error => {
					// Probably duplicate meter.
					throw new CSVPipelineError(
						`Meter name of ${meter[0]} seems to exist when inserting new meters and got DB error of: ${error.message}`, undefined, 500);
				});
		}
	}))
		.catch(error => {
			throw new CSVPipelineError(`Failed to upload meters due to internal OED Error: ${error.message}`, undefined, 500);
		});
}

module.exports = uploadMeters;