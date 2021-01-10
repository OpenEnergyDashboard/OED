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
const zlib = require('zlib');

// The upload here ensures that the file is saved to server RAM rather than disk; TODO: Think about large uploads
const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

const failure = require('../services/csvPipeline/failure');
const success = require('../services/csvPipeline/success');

const uploadMeters = require('../services/csvPipeline/uploadMeters');
const uploadReadings = require('../services/csvPipeline/uploadReadings');

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
		const { createmeter, cumulative, cumulativereset: cumulativeReset, duplications, length, meter: meterName,
			mode, timesort: timeSort, update } = req.body; // extract query parameters

		let filepath, conn;
		switch (mode) {
			case 'readings':
				filepath = await saveCsv(zlib.gunzipSync(req.file.buffer), meterName);
				log.info(`The file ${filepath} was created to upload readings csv data`);
				conn = getConnection(); // TODO: when should we close this connection?
				await uploadReadings(req, res, filepath, conn);
				return;
			case 'meter':
				filepath = await saveCsv(zlib.gunzipSync(req.file.buffer), "meters");
				log.info(`The file ${filepath} was created to upload meters csv data`);
				conn = getConnection(); // TODO: when should we close this connection?
				await uploadMeters(req, res, filepath, conn);
				return;
			default:
				throw new CSVPipelineError(`Mode ${mode} is invalid. Mode can only be either 'readings' or 'meter'.`);
		}
	} catch (error) {
		failure(req, res, error);
	}
});

module.exports = router;
