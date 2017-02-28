const express = require('express');
const readCSVFromString = require('../services/readCSV').readCSVFromString;
const multer = require('multer');

const router = express.Router();

// The upload here ensures that the file is saved to server RAM rather than disk
const upload = multer({ storage: multer.memoryStorage() });
router.post('/', upload.single('csvFile'), async (req, res) => {
	try {
		// Grab and save the data
		const data = await readCSVFromString(req.file.buffer.toString('utf8'));
		console.log(data);
		res.status(200);
	} catch (err) {
		res.status(400).send({ text: 'Invalid file.' });
		console.log('it broke, fix it.');
		console.log(err);
	}
});

module.exports = router;
