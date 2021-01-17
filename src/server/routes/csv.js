/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * This file implements the /api/csv route. This route accepts csv data for
 * meter and readings data.
 */

const express = require('express');
const failure = require('../services/csvPipeline/failure');
const { getConnection } = require('../db');
const { log } = require('../log');
const middleware = require('../middleware');
const multer = require('multer');
const saveCsv = require('../services/csvPipeline/saveCsv');
const uploadMeters = require('../services/csvPipeline/uploadMeters');
const uploadReadings = require('../services/csvPipeline/uploadReadings');
const zlib = require('zlib');

/** Middleware validation */
const { validateMetersCsvUploadParams, validateReadingsCsvUploadParams } = require('../middleware/validateCsvUploadParams');
const validatePassword = require('../middleware/validatePassword');

// The upload here ensures that the file is saved to server RAM rather than disk; TODO: Think about large uploads
const upload = multer({
	storage: multer.memoryStorage(),
	// This filter stop form processing if supplied password is invalid. 
	// The password param was precede the file on upload so that multer will have processed the form by the time this filter is called on a file.
	fileFilter: async function (req, file, cb) {
		try {
			const { password } = req.body;
			const valid = await validatePassword(password);
			if (valid) {
				cb(null, true);
			} else {
				cb(new Error("Submitted password is invalid."));
			}
		} catch (error) {
			cb(error);
		}
	}
}).single('csvfile');

const router = express.Router();
// Process form data with multer, if password check fails then the request ends with failure.
router.use(function (req, res, next) {
	upload(req, res, function (err) {
		if (err) {
			failure(req, res, err);
			return;
		}
		next();
	})
}, middleware.lowercaseAllParamNames);

// TODO: we need to sanitize req query params, res
// TODO: we need to create a condition set

router.post('/meters', validateMetersCsvUploadParams, async (req, res) => {
	try {
		const filepath = await saveCsv(zlib.gunzipSync(req.file.buffer), 'meters');
		log.info(`The file ${filepath} was created to upload meters csv data`);
		const conn = getConnection(); // TODO: when should we close this connection?
		await uploadMeters(req, res, filepath, conn);
	} catch (error) {
		failure(req, res, error);
	}
});

// NOTE: for some reason upload needs to come before the other middleware for this to work.
router.post('/readings', validateReadingsCsvUploadParams, async (req, res) => {
	try {
		const filepath = await saveCsv(zlib.gunzipSync(req.file.buffer), 'readings');
		log.info(`The file ${filepath} was created to upload readings csv data`);
		const conn = getConnection();
		await uploadReadings(req, res, filepath, conn);
	} catch (error) {
		failure(req, res, error);
	}
});

module.exports = router;
