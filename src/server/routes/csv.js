/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * This file implements the /api/csv route. This route accepts csv data for
 * meter and readings data.
 */

const { CSVPipelineError } = require('../services/csvPipeline/CustomErrors');
const express = require('express');
const fs = require('fs').promises;
const { getConnection } = require('../db');
const loadCsvInput = require('../services/pipeline-in-progress/loadCsvInput');
const { log } = require('../log');
const multer = require('multer');
const Meter = require('../models/Meter');
const readCsv = require('../services/pipeline-in-progress/readCsv');
const saveCsv = require('../services/csvPipeline/saveCsv');
const validateCsvUploadParams = require('../middleware/validateCsvUploadParams');

// The upload here ensures that the file is saved to server RAM rather than disk; TODO: Think about large uploads
const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

const failure = require('../services/csvPipeline/failure');
const success = require('../services/csvPipeline/success');

async function uploadMeter(req, res, filepath) {
	try {
		const { name, ipAddress, enabled, displayable, type, identifier } = await async function () {
			const row = (await readCsv(filepath))[0];
			const meterHash = {
				name: row[0],
				ipAddress: row[1],
				enabled: row[2] === 'TRUE',
				displayable: row[3] === 'TRUE',
				type: row[4],
				identifier: row[5]
			};
			return meterHash;
		}(); // TODO: There are various points of failure for when extracting meter data that we need to think about.
		// TODO: gzip validation and makes filesize smaller
		const conn = getConnection(); // TODO: one csv can have many meters
		const newMeter = new Meter(undefined, name, ipAddress, enabled, displayable, type, identifier);
		await newMeter.insert(conn);
		await fs.unlink(filepath); // remove file
		success(req, res, `Successfully inserted the meter ${name}.`);
		// .catch(err => {
		// 	log.error(`Creating the meter ${name} via the csv pipeline failed due to: `, err);
		// 	failure(req, res, `Meter ${name} failed to be created. Check log for reason.`);
		// });
		return;
	} catch (error) {
		const message = `Creating meter via csv pipeline failed due to error: `;
		log.error(message, error);
		failure(req, res, message + error);
	}
}

// STUB, TODO: Validate Password
async function validatePassword(req, res, next) {
	try {
		const { password } = req.body;
		if (password === 'password') {
			next();
		} else {
			throw new CSVPipelineError('Failed to supply valid password. Request to upload a csv file is rejected.');
		}
	} catch (error) {
		failure(req, res, error);
	}
};

router.get('/', (req, res) => {
	success(req, res, "Lookie here you accessed the route file");
});

router.post('/', upload.single('csvfile'), validatePassword, validateCsvUploadParams, async (req, res) => {
	// TODO: we need to sanitize req query params, res
	// TODO: we need to create a condition set
	// TODO: we need to check incorrect parameters

	try {
		const { createmeter: createMeter, cumulative, cumulativereset: cumulativeReset, duplications, length, meter: meterName,
			mode, timesort: timeSort, update } = req.body; // extract query parameters

		const areReadingsCumulative = (cumulative === 'yes');
		const readingRepetition = duplications;

		const filepath = await saveCsv(req.file.buffer, meterName);
		log.info(`The file ${filepath} was created to upload csv data`);
		const conn = getConnection(); // TODO: when should we close this connection?
		switch (mode) {
			case 'readings':
				let meter = await Meter.getByName(meterName, conn)
					.catch(err => {
						if (createMeter !== 'true') {
							throw new CSVPipelineError(`Internal OED error: Meter with name ${meterName} is not found. createMeter was not set to true.`, err.message);
						}
					});
				if (!meter) {
					meter = new Meter(undefined, meterName, undefined, false, false, Meter.type.MAMAC, meterName);
					await meter.insert(conn)
						.catch(err => {
							throw new CSVPipelineError('Internal OED error: Failed to insert meter into the database.', err.message);
						});
				}
				const mapRowToModel = (row) => { return row; }; // stub func to satisfy param
				await loadCsvInput(filepath, meter.id, mapRowToModel, false, areReadingsCumulative, cumulativeReset, readingRepetition, undefined, conn); // load csv data
				// TODO: If unsuccessful upload then an error will be thrown. We need to catch this error.
				fs.unlink(filepath).catch(err => log.error(`Failed to remove the file ${filepath}.`, err)); // TODO: do we really need this to complete before sending back a response and should this file be removed on an unsuccessful upload?
				success(req, res, `It looks like success.`); // TODO: We need a try catch for all these awaits.
				return;
			case 'meter':
				await uploadMeter(req, res, filepath);
				return;
			default:
				throw new CSVPipelineError(`Mode ${mode} is invalid. Mode can only be either 'readings' or 'meter'.`);
		}
	} catch (error) {
		failure(req, res, error);
	}
});

module.exports = router;
