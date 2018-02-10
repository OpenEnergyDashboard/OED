/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const Reading = require('../models/Reading');
const moment = require('moment');
const streamBuffers = require('stream-buffers');
const multer = require('multer');
const streamToDB = require('../services/loadFromCsvStream');
const authenticator = require('./authenticator');
const validate = require('jsonschema').validate;

const router = express.Router();

// The upload here ensures that the file is saved to server RAM rather than disk
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticator);
router.post('/:meter_id', upload.single('csvFile'), async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['meter_id'],
		properties: {
			meter_id: {
				type: 'string',
				pattern: '^\\d+$'
			}
		}
	};
	if (!validate(req.params, validParams).valid || !req.file.buffer) {
		res.sendStatus(400);
	} else {
		try {
			const id = parseInt(req.params.meter_id);
			const myReadableStreamBuffer = new streamBuffers.ReadableStreamBuffer({
				frequency: 10,
				chunkSize: 2048
			});
			myReadableStreamBuffer.put(req.file.buffer);
			// stop() indicates we are done putting the data in our readable stream.
			myReadableStreamBuffer.stop();
			try {
				await streamToDB(myReadableStreamBuffer, row => {
					const readRate = Number(row[0]);
					const endTimestamp = moment(row[1], 'MM/DD/YYYY HH:mm');
					const startTimestamp = moment(row[1], 'MM/DD/YYYY HH:mm').subtract(60, 'minutes');
					return new Reading(id, readRate, startTimestamp, endTimestamp);
				}, (readings, tx) => Reading.insertOrUpdateAll(readings, tx));
				res.status(200).json({ success: true });
			} catch (e) {
				res.status(403).json({ success: false, message: 'Failed to upload data.' });
			}
		} catch (err) {
			res.status(400).send({
				success: false,
				message: 'Incorrect file type.'
			});
		}
	}
});

module.exports = router;
