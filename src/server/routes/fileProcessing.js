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
router.post('/:meter_id', upload.single('csvFile'), async (req, res) => {
	const id = parseInt(req.params.meter_id);
	console.log(`ID: ${id}`);
	console.log(`Retrieved meter id: ${id}`);
	try {
		const data = await readCSVFromString(req.file.buffer.toString('utf8'));
		const myReadableStreamBuffer = new streamBuffers.ReadableStreamBuffer({
			frequency: 10,
			chunkSize: 2048
		});
		myReadableStreamBuffer.put(req.file.buffer);
		myReadableStreamBuffer.stop();
		const transaction = streamToDB(myReadableStreamBuffer, row => {
			//	const readRate = parseInt(row[0]);
			//	const endTimestamp = moment(row[1], 'HH:mm:ss MM/DD/YYYY');
			const readRate = parseInt(row[0]);
			const endTimestamp = moment(row[1], 'MM/DD/YYYY HH:mm');
			const startTimestamp = moment(row[1], 'MM/DD/YYYY HH:mm').subtract(60, 'minutes');
			console.log(startTimestamp);
			const reading = new Reading(id, readRate, startTimestamp, endTimestamp);
			return reading;
		}, (readings, tx) => {
			return Reading.insertOrUpdateAll(readings, tx).then(() => {
				console.log("Completed")
			});
		});
		try { await transaction;

			console.log("DONE");
			res.status(200).json({success: true});
		}
		catch(e) {
			console.log(e);
			res.status(403).json({ success: false, message: 'Failed to upload data.' });
		}
	} catch (err) {
		console.log("undone2");
		res.status(400).send({
			success: false,
			message: 'Incorrect file type.'
		});
	}
});
module.exports = router;
