/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * This file implements the /api/csv route. This route accepts csv data for
 * meter and readings data.
 */

const express = require('express');
const router = express.Router();
const failure = require('../services/csvPipeline/failure');
const { getConnection } = require('../db');
const { log } = require('../log');
const { csvAuthMiddleware } = require('./authenticator');
const fs = require('fs');
const multer = require('multer');
const saveCsv = require('../services/csvPipeline/saveCsv');
const uploadMeters = require('../services/csvPipeline/uploadMeters');
const uploadReadings = require('../services/csvPipeline/uploadReadings');
const zlib = require('zlib');

/** Middleware validation */
const { validateMetersCsvUploadParams, validateReadingsCsvUploadParams } = require('../services/csvPipeline/validateCsvUploadParams');
const validatePassword = require('../middleware/validatePassword');
const { CSVPipelineError } = require('../services/csvPipeline/CustomErrors');

// Config so that multer stores the uploaded file to disk rather than to memory.
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		const path = `${__dirname}/../tmp/uploads/csvPipeline`;
		fs.mkdirSync(path, { recursive: true }); // creates directory if not exists

		cb(null, path);
	},
	filename: function (req, file, cb) {

		// Get the file extension.
		let extArray = file.mimetype.split('/');
		let extension = extArray[extArray.length - 1];

		// Save file with original name
		cb(null, file.originalname + '-' + Date.now() + '.' + extension);
	}
})

// Multer Config
const upload = multer({
	storage: storage,
	// This filter stop form processing if supplied password is invalid. 
	// The password param needs to precede the file when uploading so that 
	// multer will have processed the form by the time this filter is called on a file.
	fileFilter: async function (req, file, cb) {
		try {
			req.body.password = 'password'; // for testing purposes all requests will be accepted.
			const { password } = req.body;
			const valid = await validatePassword(password);
			if (valid) {
				cb(null, true);
			} else {
				cb(new Error('Submitted password is invalid.'));
			}
		} catch (error) {
			cb(error);
		}
	}
}).single('csvfile');

// Set router to use multer
router.use(function (req, res, next) {
	upload(req, res, function (err) {
		if (err) {
			failure(req, res, err);
			return;
		}
		next();
	})
});

router.use(function (req, res, next) { // This ensures that at least one csv file has been submitted.
	if (!req.file) {
		failure(req, res, new CSVPipelineError('No csv file was uploaded. A csv file must be submitted via the csvfile parameter.'));
	} else {
		// TODO: For now we assume canonical csv structure. In the future we will have to validate csv files via headers.
		next();
	}
});

// router.post('/meters', csvAuthMiddleware('upload meters'), validateMetersCsvUploadParams, async (req, res) => {
router.post('/meters', validateMetersCsvUploadParams, async (req, res) => {
	try {
		let fileBuffer = fs.readFileSync(req.file.path);
		if (req.body.gzip === 'true') {
			fileBuffer = zlib.gunzipSync(fileBuffer);
		}
		const filepath = await saveCsv(fileBuffer, 'meters');
		log.info(`The file ${filepath} was created to upload meters csv data`);
		const conn = getConnection();
		await uploadMeters(req, res, filepath, conn);
	} catch (error) {
		failure(req, res, error);
	}
});

// router.post('/readings', csvAuthMiddleware('upload readings'), validateReadingsCsvUploadParams, async (req, res) => {
router.post('/readings', validateReadingsCsvUploadParams, async (req, res) => {
	try {
		let fileBuffer = fs.readFileSync(req.file.path);
		if (req.body.gzip === 'true') {
			fileBuffer = zlib.gunzipSync(fileBuffer);
		}
		const filepath = await saveCsv(fileBuffer, 'meters');
		log.info(`The file ${filepath} was created to upload readings csv data`);
		const conn = getConnection();
		await uploadReadings(req, res, filepath, conn);
	} catch (error) {
		failure(req, res, error);
	}
});

module.exports = router;