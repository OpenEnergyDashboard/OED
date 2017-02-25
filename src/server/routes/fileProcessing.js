const express = require('express');
const readCSV = require('../services/readCSV');

const router = express.Router();

router.post('/', async (req, res) => {
	try {
		const file = req.body.file;
		const data = await readCSV(file);
		console.log(data);
		res.status(200);
	} catch (err) {
		//todo Change the status to a good one so John does not burst a gasket.
		res.status(201).send({ text: 'Invalid file.' });
		console.log('it broke, fix it.');
	}
});

module.exports = router;
