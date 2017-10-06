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
	try{
		const data = await readCSVFromString(req.file.buffer.toString('utf8'));
		const myReadableStreamBuffer = new streamBuffers.ReadableStreamBuffer({
			frequency: 10,
			chunkSize: 2048
		});
		myReadableStreamBuffer.put(req.file.buffer);
		// TODO ensure that we are getting Readings appropriately.
		streamToDB(myReadableStreamBuffer, row => {
			//change the type of file being read. So, my guess is I need to change the content here.
			//MAMAC Sample log file.
			const id =  parseInt(req.params.meter_id);
			const readRate = row[0];
			const endTimestamp = moment(row[1], 'HH:mm:ss MM/DD/YYYY');
			const startTimestamp = moment(row[1], 'HH:mm:ss MM/DD/YYYY').subtract(60,'minutes');
			// console.log(`readRate: ${readRate}`);
			return new Reading(id, readRate, startTimestamp, endTimestamp);
			// TODO Fix the third paramter, Simon will know.
		}, (readings, tx) => Reading.insertAll(readings, tx).then(() => console.log('Inserted!')).catch(e => {
			console.error(`Error inserting readings ${readings}`)
		}));

		res.status(200);
	} catch (err) {
		res.status(400).send({ text: 'Invalid file.' });
		console.log('it broke, fix it.');
		console.log(err);
	}
});

module.exports = router;
