const express = require('express');
const Meter = require('../models/Meter');
const Reading = require('../models/Reading');

const router = express.Router();

/**
 * GET information on all meters
 */
router.get('/', (req, res) => {
	Meter.getAll()
		.then(rows => {
			res.json(rows);
		})
		.catch(err => {
			console.log(`Error while performing GET all meters query: ${err}`);
		});
});

/**
 * GET information for a specific meter by id
 * @param {int} meter_id
 */
router.get('/:meter_id', (req, res) => {
	Meter.getByID(req.params.meter_id)
		.then(rows => {
			res.json(rows);
		})
		.catch(err => {
			console.log(`Error while performing GET specific meter by id query: ${err}`);
		});
});

/**
 * GET meter readings by meter id
 * @param {int} meter_id
 * @param {Date} [startDate]
 * @param {Date} [endDate]
 */
router.get('/readings/:meter_id', (req, res) => {
	if (req.query.startDate || req.query.endDate) {
		Reading.getReadingsByMeterIDAndDateRange(req.params.meter_id, req.query.startDate, req.query.endDate)
			.then(rows => {
				res.json(rows);
			})
			.catch(err => {
				console.log(`Error while performing GET specific meter readings with date range query: ${err}`);
			});
	} else {
		Reading.getAllByMeterID(req.params.meter_id)
			.then(rows => {
				res.json(rows);
			})
			.catch(err => {
				console.log(`Error while performing GET all readings from specific meter by id query: ${err}`);
			});
	}
});

module.exports = router;
