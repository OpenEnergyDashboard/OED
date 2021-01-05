/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * This file implements the /api/csv route. This route accepts csv data for
 * meter and readings data.
 */

const { CSVPipelineError } = require('../services/csvPipeline/CustomErrors');
const escapeHtml = require('core-js/fn/string/escape-html');
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

/**
 * Inform the client of a failure (406 Not Acceptable), and log it.
 *
 * @param {express.Request} req The Express request object
 * @param {express.Response} res The Express response object
 * @param {Error || CSVPipelineError.class} error The reason for the failure.
 *
 */
function failure(req, res, error, statusCode = 400) {
	const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	if (error instanceof CSVPipelineError) {
		const { logErrorMessage, responseMessage } = error;
		log.error(`Csv protocol request from ${ip} failed due to ${logErrorMessage}`, error);
		res.status(statusCode)
			.send(`<pre>\n${escapeHtml(responseMessage)}\n</pre>\n`);
	} else { // we do not actually expect to reach this case however just in case we receive an error we still want to respond.
		const { message } = error;
		log.error(`Csv protocol request from ${ip} failed due to ${error.message}`, error);
		res.status(statusCode)
			.send(`<pre>\n${escapeHtml(message)}\n</pre>\n`);
	}
}

/**
 * Inform the client of a success (200 OK).
 *
 * @param {express.Request} req The Express request object
 * @param {express.Response} res The Express response object
 * @param {string} comment Any additional data to be returned to the client.
 *
 */
function success(req, res, comment = '') {
	res.status(200) // 200 OK
		.send(`<pre>\nSUCCESS\n${escapeHtml(comment)}</pre>\n`);
}


async function uploadMeter(req, res) {
	try {
		const { update } = req.body; // extract query parameters // TODO: validate password.
		// Fail if request to update meters.
		if (update && update !== 'false') {
			failure(req, res, `Update data for a meter is not implemented for update=${update}.`);
			return;
		}
		// create buffer to save into file; will need to gunzip file
		const myWritableStreamBuffer = streamToWriteBuffer(req.file.buffer);
		// save this buffer into a file
		const randomFileName = `willBeRandom`; // TODO: use a unique name // TODO: Dumping file needs to be the save, whatDoing param dumping readings/ dumping meters
		const filePath = `./${randomFileName}.csv`; // TODO: You might want to change this so you don't read from a file
		await fs.writeFile(filePath, myWritableStreamBuffer.getContents())
			.then(() => log.info(`The file ${filePath} was created to upload csv data`))
		// .catch(reason => log.error(`Failed to write the file: ${filePath}`, reason)); // TODO: this error needs to stop the entire function
		const { name, ipAddress, enabled, displayable, type, identifier } = await async function () {
			const row = (await readCsv(filePath))[0];
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
		await fs.unlink(filePath); // remove file
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
		const { password } = req;
		if (password === 'password') {
			next();
		} else {
			throw CSVPipelineError('Failed to supply valid password. Request to upload a csv file is rejected.');
		}
	} catch (error) {
		failure(req, res, error);
	}
	return password === 'password';
};

router.get('/', (req, res) => {
	success(req, res, "Lookie here you accessed the route file");
});

router.post('/', validatePassword, upload.single('csvfile'), validateCsvUploadParams, async (req, res) => {
	// TODO: we need to sanitize req query params, res
	// TODO: we need to create a condition set
	// TODO: we need to check incorrect parameters

	try {
		const { createmeter: createMeter, cumulative, cumulativereset: cumulativeReset, duplications, length, meter: meterName,
			mode, timesort: timeSort, update } = req.body; // extract query parameters
		const filepath = await saveCsv(req.file.buffer, meterName);
		log.info(`The file ${filepath} was created to upload csv data`);
		const conn = getConnection(); // TODO: when should we close this connection?
		switch (mode) {
			case 'readings':
				let meter = await Meter.getByName(meterName, conn)
					.catch(err => {
						if (createMeter !== 'true') {
							throw CSVPipelineError(`Internal OED error: Meter with name ${meterName} is not found. createMeter was not set to true.`, err.message);
						}
					});
				if (!meter) {
					meter = new Meter(undefined, meterName, undefined, false, false, Meter.type.MAMAC, meterName);
					await meter.insert(conn)
						.catch(err => {
							throw CSVPipelineError('Internal OED error: Failed to insert meter into the database.', err.message);
						});
				}
				const mapRowToModel = (row) => { return row; }; // stub func to satisfy param
				await loadCsvInput(filepath, meter.id, mapRowToModel, false, areReadingsCumulative, cumulativeReset, readingRepetition, undefined, conn); // load csv data
				// TODO: If unsuccessful upload then an error will be thrown. We need to catch this error.
				fs.unlink(filepath).catch(err => log.error(`Failed to remove the file ${filepath}.`, err)); // TODO: do we really need this to complete before sending back a response and should this file be removed on an unsuccessful upload?
				success(req, res, `It looks like success.`); // TODO: We need a try catch for all these awaits.
				return;
			case 'meter':
				throw CSVPipelineError('Temporarily disabled.');
				// await uploadMeter(req, res);
				return;
			default:
				throw CSVPipelineError(`Mode ${mode} is invalid. Mode can only be either 'readings' or 'meter'.`);
		}
	} catch (error) {
		failure(req, res, error);
	}
});

module.exports = {
	router,
	failure
};
