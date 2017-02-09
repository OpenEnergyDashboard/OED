const express = require('express');
const Meter = require('../models/Meter');
const Reading = require('../models/Reading');

const router = express.Router();

/**
 * Takes in an array of row objects and reformats the timestamp from ISO 8601 format to the number
 * of milliseconds since January 1st, 1970 and groups each reading with each timestamp.
 * @param rows
 */
function formatReadings(rows) {
	return rows.map(row => [new Date(row.timestamp).valueOf(), row.reading]);
}

/**
 * GET information on all meters
 */
router.get('/', async (req, res) => {
	try {
		const rows = await Meter.getAll();
		res.json(rows);
	} catch (err) {
		console.error(`Error while performing GET all meters query: ${err}`);
	}
});

/**
 * GET information for a specific meter by id
 * @param {int} meter_id
 */
router.get('/:meter_id', async (req, res) => {
	try {
		const rows = await Meter.getByID(req.params.meter_id);
		res.json(rows);
	} catch (err) {
		console.error(`Error while performing GET specific meter by id query: ${err}`);
	}
});


/**
 * GET meter readings by meter id
 * @param {int} meter_id
 * @param {Date} [startDate]
 * @param {Date} [endDate]
 */
router.get('/readings/:meter_id', async (req, res) => {
	if (req.query.startDate || req.query.endDate) {
		try {
			const rows = await Reading.getReadingsByMeterIDAndDateRange(req.params.meter_id, req.query.startDate, req.query.endDate);
			res.json(formatReadings(rows));
		} catch (err) {
			console.error(`Error while performing GET specific meter readings with date range query: ${err}`);
		}
	} else {
		try {
			const rows = await Reading.getAllByMeterID(req.params.meter_id);
			res.json(formatReadings(rows));
		} catch (err) {
			console.error(`Error while performing GET all readings from specific meter by id query: ${err}`);
		}
	}
});

module.exports = router;
