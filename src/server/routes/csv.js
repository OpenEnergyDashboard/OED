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
const { verifyCredentials } = require('./authenticator');
const fs = require('fs');
const multer = require('multer');
const saveCsv = require('../services/csvPipeline/saveCsv');
const uploadMeters = require('../services/csvPipeline/uploadMeters');
const uploadReadings = require('../services/csvPipeline/uploadReadings');
const zlib = require('zlib');

/** Middleware validation */
const { validateMetersCsvUploadParams, validateReadingsCsvUploadParams } = require('../services/csvPipeline/validateCsvUploadParams');
const { CSVPipelineError } = require('../services/csvPipeline/CustomErrors');
const { isTokenAuthorized, isUserAuthorized } = require('../util/userRoles');

const { CSV: csvRole } = require('../models/User').role;

// Set router to use multer
router.use(function (req, res, next) {
	// Config object so that multer stores the uploaded file to disk rather than to memory.
	const storage = multer.diskStorage({
		destination: function () {
			const path = `${__dirname}/../tmp/uploads/csvPipeline`;
			fs.mkdirSync(path, { recursive: true }); // creates directory if not exists
			return path;
		}(),
		filename: function (r, file, cb) {

			// Get the file extension.
			let extArray = file.mimetype.split('/');
			let extension = extArray[extArray.length - 1];

			// Save file with original name
			cb(null, file.originalname + '-' + Date.now() + '.' + extension);
		}
	})

	// Multer Config
	let upload = multer({
		storage: storage,
		// We will use this filter to handle user authentication. If the user is doing a curl request
		// we need the supplied password param to precede the file when uploading so that 
		// multer will have stored 'password' in req.body by the time this filter is called on a file.
		// If the user is uploading via the webapp, we expect the request to have a token.
		fileFilter: async function (request, file, cb) {
			// Multer only executes the file filter when a file is being processed. If no file is 
			// uploaded, then the authentication checks below are not called. This is okay, because 
			// if no file is uploaded the subsequent middleware will end the request.
			try {
				const token = request.headers.token || request.body.token || request.query.token;
				if (token) {
					// If a token is found, then we will check authentication and validation via the token.
					(await isTokenAuthorized(token, csvRole)) ? cb(null, true) : cb(new Error('Invalid token'));
				} else {
					// If no token is found, then the request is mostly like a curl request. We require an 
					// email and password to be supplied for curl requests.
					const { email, password } = request.body;
					const verifiedUser = await verifyCredentials(email, password, true);
					if (verifiedUser) {
						isUserAuthorized(verifiedUser, csvRole) ? cb(null, true) : cb(new Error('Invalid credentials'));
					} else {
						cb(new Error('Invalid credentials'));
					}
				}
			} catch (error) {
				cb(error);
			}
		}
	})

	// Set multer to look for a file in the csvfile field.
	upload = upload.single('csvfile');

	upload(req, res, function (err) {
		if (err) {
			failure(req, res, err);
			return;
		}
		next();
	})
});

// This middleware ensures that one CSV file has been uploaded. If no file is uploaded, the request ends. Otherwise, it proceeds.
// We need this extra middleware because multer does not provide an option to guard against the case where no file is uploaded. 
router.use(function (req, res, next) {
	if (!req.file) {
		failure(req, res, new CSVPipelineError('No csv file was uploaded. A csv file must be submitted via the csvfile parameter.'));
	} else {
		next();
	}
});

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

router.post('/readings', validateReadingsCsvUploadParams, async (req, res) => {
	try {
		let fileBuffer = fs.readFileSync(req.file.path);
		if (req.body.gzip === 'true') {
			fileBuffer = zlib.gunzipSync(fileBuffer);
		}
		const filepath = await saveCsv(fileBuffer, 'readings');
		log.info(`The file ${filepath} was created to upload readings csv data`);
		const conn = getConnection();
		await uploadReadings(req, res, filepath, conn);
		if (req.body.refreshReadings) {
			// Call the refreshReadingViews script
			require('../services/refreshReadingViews');
		}
	} catch (error) {
		failure(req, res, error);
	}
});

module.exports = router;