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
const loadCsvInput = require('../services/pipeline-in-progress/loadCsvInput');
const { log } = require('../log');
const Meter = require('../models/Meter');
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
	log.error(`Csv protocol request from ${ip} failed due to ${reason}`);

	res.status(400)
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
	writableStreamBuffer.write(stream);
	return writableStreamBuffer;
}

router.get('/', (req, res) => {
	success(req, res, "Lookie here you accessed the route file");
});

router.post('/', upload.single('csvfile'), async (req, res) => {
	// we need to sanitize req query params, res

	// We do readings for meters first then meter data later
	// since the pipeline only supports readings atm.

	const { createmeter: createMeter, cumulative, cumulativereset: cumulativeReset, duplications, length, meter: meterName,
		mode, password, timesort: timeSort, update } = req.body; // extract query parameters

	if (!req.file) {
		failure(req, res, 'No file uploaded.');
		return;
	}// TODO: Validate file upload


	switch (mode) {
		case 'readings':
			// Invalidate unimplemented time sort.
			if (timeSort !== 'increasing') {
				failure(req, res, `Time sort '${timeSort}' is invalid. Only 'increasing' is currently implemented.`);
				return;
			}

			// create buffer to save into file; will need to gunzip file 
			const myWritableStreamBuffer = streamToWriteBuffer(req.file.buffer);
			// save this buffer into a file
			const randomFileName = `${meterName}-willBeRandom`; // TODO: use a unique name and use that name in the new meter creation 
			const filePath = `./${randomFileName}.csv`;
			await fs.writeFile(filePath, myWritableStreamBuffer.getContents())
				.then(() => log.info(`The file ${filePath} was created to upload csv data`))
				.catch(reason => log.error(`Failed to write the file: ${filePath}`, reason));

			const conn = getConnection();

			let meter;
			await Meter.getByName(meterName, conn)
				.then(row => meter = row) // retrieve meter by name
				.catch(async err => {
					meter = new Meter(undefined, meterName, undefined, false, false, Meter.type.MAMAC, meterName);
					log.warn(`Creating the meter ${meterName} for readings since it did not exist.`);
					await meter.insert(conn); // does not seem to actually return a promise
				}) // if no meter is found an error is thrown and we create the meter and log it. TODO: there may be other reasons for error; QueryResultError may be a type to switch on

			const mapRowToModel = (row) => { return row; }; // stub func to satisfy param
			await loadCsvInput(filePath, meter.id, mapRowToModel, false, cumulative, cumulativeReset, duplications, undefined, conn); // load csv data
			// Problem here is that we will not know if csv was loaded successfully.
			await fs.unlink(filePath); // TODO: do we really need this to complete before sending back a response and should this file be removed on an unsuccessful upload?
			success(req, res, `It looks like success.`); // TODO: need try catch for all these awaits
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
