/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * This file implements the /api/csv route. This route accepts csv data for 
 * meter and readings data.
 *
 */

const express = require('express');
const fs = require('fs').promises;
const { getConnection } = require('../db');
const { loadCsvInput } = require('../services/pipeline-in-progress/loadCsvInput');
const { log } = require('../log');
const multer = require('multer');
const streamBuffers = require('stream-buffers');
const zlib = require('zlib');

// The upload here ensures that the file is saved to server RAM rather than disk
const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.post('/', upload.single('csvFile'), async () => {
	// We do readings for meters first then meter data later
	// since the pipeline only supports readings atm.

	const { createmeter, cumulative, duplications, length, meter, mode, password,
	timeSort, update } = req.query; // extract query parameters
	const cumulativeReset = false;

	// create buffer to save into file; will need to gunzip file 
	const myReadableStreamBuffer = new streamBuffers.ReadableStreamBuffer({
		frequency: 10,
		chunkSize: 2048
	});
	myReadableStreamBuffer.put(req.file.buffer);
	myReadableStreamBuffer.stop(); // stop() indicates we are done putting the data in our readable stream.
	// save this buffer into a file
	const filePath = './readings.txt';
	await fs.writeFile(filePath. myReadableStreamBuffer)
		.then(() => log.info(`The file ${filePath} was created to upload csv data`))
		.catch(reason => log.error(`Failed to write the file: ${filePath}`, reason));

	const mapRowToModel = (row) => (row); // stub func to satisfy param
	const conn = getConnection();
	loadCsvInput(filePath, meter, mapRowToModel, false, cumulative, cumulativeReset, 
	duplications, undefined, conn); // load csv data
});

module.exports = router;
