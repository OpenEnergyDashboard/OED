/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * This file implements the /api/csv route. This route accepts csv data for
 * meter and readings data.
 */

const moment = require('moment');
const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const { getConnection } = require('../db');
const { log } = require('../log');
const { verifyCredentials } = require('./authenticator');
const fs = require('fs').promises;
const { mkdirSync } = require('fs');
const multer = require('multer');
const saveCsv = require('../services/csvPipeline/saveCsv');
const uploadMeters = require('../services/csvPipeline/uploadMeters');
const uploadReadings = require('../services/csvPipeline/uploadReadings');
const zlib = require('zlib');
const { refreshAllReadingViews } = require('../services/refreshAllReadingViews');
const { success, failure } = require('../services/csvPipeline/success');

/** Middleware validation */
const { normalizeBoolean, validateMetersCsvUploadParams, validateReadingsCsvUploadParams } = require('../services/csvPipeline/validateCsvUploadParams');
const { CSVPipelineError } = require('../services/csvPipeline/CustomErrors');
const { isTokenAuthorized, isUserAuthorized } = require('../util/userRoles');

const { CSV: csvRole } = require('../models/User').role;

// Set router to use multer
router.use(function (req, res, next) {
	// Config object so that multer stores the uploaded file to disk rather than to memory.
	const storage = multer.diskStorage({
		destination: function () {
			const path = `${__dirname}/../tmp/uploads/csvPipeline`;
			mkdirSync(path, { recursive: true }); // creates directory if not exists
			return path;
		}(),
		filename: function (r, file, cb) {
			// Save file with original name and date time to prevent accidental overwrites.
			const modifiedFilename = `${moment().format('YYYY-MM-DD_HH:mm:ss.SSS')}-${crypto.randomBytes(2).toString('hex')}-${file.originalname}`;
			cb(null, modifiedFilename);
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
					(await isTokenAuthorized(token, csvRole)) ? cb(null, true) : cb(new Error('Invalid token (either unauthorized or logged out'));
				} else {
					// If no token is found, then the request is mostly like a curl request. We require an
					// username and password to be supplied for curl requests.
					const { username, email, password } = request.body;
					// TODO:
					// Allowing for backwards compatibility if any users are still using the 'email' parameter instead of
					// the 'username' parameter to login. Developers need to decide in the future if we should deprecate email
					// or continue to allow this backwards compatibility
					const user = username || email;
					const verifiedUser = await verifyCredentials(user, password, true);
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
	const isGzip = normalizeBoolean(req.body.gzip);
	const uploadedFilepath = req.file.path;
	let csvFilepath;
	try {
		log.info(`The file ${uploadedFilepath} was created to upload meters csv data`);
		let fileBuffer = await fs.readFile(uploadedFilepath);
		// Unzip uploaded file and save file to disk if the user 
		// has indicated that the file is (g)zipped.
		if (isGzip) {
			fileBuffer = zlib.gunzipSync(fileBuffer);
			// We expect this directory to have been created by this stage of the pipeline.
			const dir = `${__dirname}/../tmp/uploads/csvPipeline`;
			csvFilepath = await saveCsv(fileBuffer, 'meters', dir);
			log.info(`The unzipped file ${csvFilepath} was created to upload meters csv data`);
		} else {
			csvFilepath = uploadedFilepath;
		}

		const conn = getConnection();
		await uploadMeters(req, res, csvFilepath, conn);
		success(req, res, 'Successfully inserted the meters.');
	} catch (error) {
		failure(req, res, error);

	} finally {
		// Clean up files
		fs.unlink(uploadedFilepath) // Delete the uploaded file.
			.then(() => log.info(`Successfully deleted the uploaded file ${uploadedFilepath}.`))
			.catch(err => {
				log.error(`Failed to remove the file ${uploadedFilepath}.`, err);
			});

		// If user has indicated that the file is (g)zipped, then we also have to remove the unzipped file.
		if (isGzip) {
			// Delete the unzipped csv file if it exists.
			fs.unlink(csvFilepath)
				.then(() => log.info(`Successfully deleted the unzipped csv file ${csvFilepath}.`))
				.catch(err => {
					log.error(`Failed to remove the file ${csvFilepath}.`, err);
				});
		}
	}
});

router.post('/readings', validateReadingsCsvUploadParams, async (req, res) => {
	const isGzip = normalizeBoolean(req.body.gzip);
	const isRefreshReadings = normalizeBoolean(req.body.refreshReadings);
	const uploadedFilepath = req.file.path;
	let csvFilepath;
	let isAllReadingsOk;
	let msgTotal;
	try {
		log.info(`The uploaded file ${uploadedFilepath} was created to upload readings csv data`);
		let fileBuffer = await fs.readFile(uploadedFilepath);
		// Unzip uploaded file and save file to disk if the user 
		// has indicated that the file is (g)zipped.
		if (isGzip) {
			fileBuffer = zlib.gunzipSync(fileBuffer);
			// We expect this directory to have been created by this stage of the pipeline.
			const dir = `${__dirname}/../tmp/uploads/csvPipeline`;
			csvFilepath = await saveCsv(fileBuffer, 'readings', dir);
			log.info(`The unzipped file ${csvFilepath} was created to upload readings csv data`);
		} else {
			csvFilepath = uploadedFilepath;
		}
		const conn = getConnection();
		({ isAllReadingsOk, msgTotal } = await uploadReadings(req, res, csvFilepath, conn));
		if (isRefreshReadings) {
			// Refresh readings so show when daily data is used.
			await refreshAllReadingViews();
		}
	} catch (error) {
		failure(req, res, error);
		return;
	} finally {
		// Clean up files
		fs.unlink(uploadedFilepath) // Delete the uploaded file.
			.then(() => log.info(`Successfully deleted the uploaded file ${uploadedFilepath}.`))
			.catch(err => {
				log.error(`Failed to remove the file ${uploadedFilepath}.`, err);
			});

		// If user has indicated that the file is (g)zipped, then we also have to remove the unzipped file.
		if (isGzip) {
			// Delete the unzipped csv file if it exists.
			fs.unlink(csvFilepath)
				.then(() => log.info(`Successfully deleted the unzipped csv file ${csvFilepath}.`))
				.catch(err => {
					log.error(`Failed to remove the file ${csvFilepath}.`, err);
				});
		}
	}
	let message;
	if (isAllReadingsOk) {
		message = '<h2>It looks like the insert of the readings was a success.</h2>'
		if (msgTotal !== '') {
			message += '<h3>However, note that the processing of the readings returned these warning(s):</h3>' + msgTotal;
		}
		success(req, res, message);
	} else {
		message = '<h2>It looks like the insert of the readings had issues with some or all of the readings where' +
			' the processing of the readings returned these warning(s)/error(s):</h2>' + msgTotal;
		failure(req, res, message);
	}
});

module.exports = router;
