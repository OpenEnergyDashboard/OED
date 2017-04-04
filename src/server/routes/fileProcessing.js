const express = require('express');
const streamBuffers = require('stream-buffer');
const readCSVFromString = require('../services/readCSV').readCSVFromString;
const multer = require('multer');

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
		console.log(data);
		res.status(200);
	} catch (err) {
		res.status(400).send({ text: 'Invalid file.' });
		console.log('it broke, fix it.');
		console.log(err);
	}
});

module.exports = router;
