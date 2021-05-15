/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { CSVPipelineError } = require('./CustomErrors');
const success = require('./success');
const fs = require('fs').promises;
const { log } = require('../../log');
const Meter = require('../../models/Meter');
const readCsv = require('../pipeline-in-progress/readCsv');

/**
 * Middleware that uploads meters via the pipeline. This should be the final stage of the CSV Pipeline.
 * @param {express.Request} req 
 * @param {express.Response} res 
 * @param {filepath} filepath Path to meters csv file.
 * @param conn Connection to the database.
 * @returns 
 */
async function uploadMeters(req, res, filepath, conn) {
	try {
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
		await Promise.all(meters.map(meter => {
			return (new Meter(undefined, ...meter).insert(conn));
		}));
		fs.unlink(filepath)
			.catch(err => {
				log.error(`Failed to remove the file ${filepath}.`, err);
			}); // remove file
		success(req, res, 'Successfully inserted the meters.');
		return;
	} catch (error) {
		throw new CSVPipelineError(`Failed to upload meters due to internal OED Error: ${error.message}`, undefined, 500);
	}
}

module.exports = uploadMeters;