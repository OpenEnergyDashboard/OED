/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * This file implements the /api/csv route. This route accepts csv data for 
 * meter and readings data.
 *
 */

const escapeHtml = require('core-js/fn/string/escape-html');
const express = require('express');
const fs = require('fs').promises;
const { getConnection } = require('../db');
const { loadCsvInput } = require('../services/pipeline-in-progress/loadCsvInput');
const { log } = require('../log');
const multer = require('multer');
const streamBuffers = require('stream-buffers');
const zlib = require('zlib');

// The upload here ensures that the file is saved to server RAM rather than disk; TODO: Think about large uploads
const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

/**
 * Inform the client of a failure (406 Not Acceptable), and log it.
 *
 * @param {express.Request} req The Express request object
 * @param {express.Response} res The Express response object
 * @param {string} reason The reason for the failure.
 *
 */
function failure(req, res, reason = '') {
	const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	log.error(`Obvius protocol request from ${ip} failed due to ${reason}`);

	res.status(406) // 406 Not Acceptable error, as required by Obvius
		.send(`<pre>\n${escapeHtml(reason)}\n</pre>\n`);
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

function streamToWriteBuffer(stream) {
	const writableStreamBuffer = new streamBuffers.WritableStreamBuffer({
		frequency: 10,
		chunkSize: 2048
	});
	writableStreamBuffer.put(stream);
	writableStreamBuffer.stop(); // stop() indicates we are done putting the data in our readable stream.
	return writableStreamBuffer;
}

router.post('/', upload.single('csvFile'), async (req, res) => {
	// We do readings for meters first then meter data later
	// since the pipeline only supports readings atm.

	const { createmeter: createMeter, cumulative, cumulativereset: cumulativeReset, duplications, length, meter, mode, password,
		timesort: timeSort, update } = req.query; // extract query parameters

	if (!req.file) {
		failure(req, res, 'No file uploaded.');
		return;
	}// TODO: Validate file upload

	// Invalidate improper mode, meter pair.
	if (mode === 'readings' && !meter) {
		failure(req, res, `Readings are provided, but no meter is provided. Meter '${meter}' is invalid.`)
		return;
	}

	// Invalidate unimplemented time sort.
	if (timeSort !== 'increasing') {
		failure(req, res, `Time sort '${timeSort}' is invalid. Only 'increasing' is currently implemented.`);
		return;
	}

	switch (mode) {
		case 'readings':
			// create buffer to save into file; will need to gunzip file 
			const myWritableStreamBuffer = streamToWriteBuffer(req.file.buffer);
			// save this buffer into a file
			const filePath = './readings.txt'; // TODO: use a unique name and use that name in the new meter creation
			await fs.writeFile(filePath, myWritableStreamBuffer)
				.then(() => log.info(`The file ${filePath} was created to upload csv data`))
				.catch(reason => log.error(`Failed to write the file: ${filePath}`, reason));

			const mapRowToModel = (row) => (row); // stub func to satisfy param
			const conn = getConnection();
			loadCsvInput(filePath, meter, mapRowToModel, false, cumulative, cumulativeReset,
				duplications, undefined, conn); // load csv data
			return;
		case 'meter':
			failure(req, res, `Mode meter has not been implemented`);
			return;
		default:
			failure(req, res, `Mode ${mode} is invalid. Mode can either be 'readings' or 'meter'.`)
			return;
	}
});

module.exports = router;
