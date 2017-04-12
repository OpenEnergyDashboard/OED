const express = require('express');
const Reading = require('../models/Reading');
const moment = require('moment');
const streamBuffers = require('stream-buffers');
const readCSVFromString = require('../services/readCSV').readCSVFromString;
const multer = require('multer');
const streamToDB = require('../services/loadFromCsvStream');

const router = express.Router();

// The upload here ensures that the file is saved to server RAM rather than disk
const upload = multer({ storage: multer.memoryStorage() });
router.post('/', upload.single('csvFile'), async (req, res) => {
	try {
		const data = await readCSVFromString(req.file.buffer.toString('utf8'));
		const myReadableStreamBuffer = new streamBuffers.ReadableStreamBuffer({
			frequency: 10,
			chunkSize: 2048
		});
		myReadableStreamBuffer.put(req.file.buffer);
		// TODO ensure that we are getting Readings appropriately.
		streamToDB(myReadableStreamBuffer, row => {
			const id = row[0];
			const readRate = row[1];

			const startTimestamp = moment(row[2], 'HH:mm:ss MM/DD/YYYY');
			const endTimestamp = moment(row[3], 'HH:mm:ss MM/DD/YYYY');
			return new Reading(id, readRate, startTimestamp, endTimestamp);
			// TODO Fix the third paramter, Simon will know.
		}, (readings, tx) => Reading.insertAll(readings, tx).then(() => console.log('Inserted!')));
		console.log(data);
		res.status(200);
	} catch (err) {
		res.status(400).send({ text: 'Invalid file.' });
		console.log('it broke, fix it.');
		console.log(err);
	}
});

module.exports = router;
