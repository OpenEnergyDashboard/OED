/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { log } = require('../log');
const { getConnection } = require('../db');
const { optionalAuthMiddleware } = require('./authenticator');
const WeatherData = require('../models/WeatherData');
const moment = require('moment');
const { failure } = require('./response');

const router = express.Router();

/**
 * Route for getting weather data by location ID and date range.
 * Query params: startTime, endTime (ISO 8601 strings)
 */
router.get('/:id', async (req, res) => {
	const { id } = req.params;
	const { startTime, endTime } = req.query;

	if (!startTime || !endTime) {
		const errorMsg = 'startTime and endTime query parameters are required.';
		log.warn(`Got request for weather data without required query params: ${errorMsg}`);
		failure(res, 400, errorMsg);
		return;
	}

	const parsedStart = moment(startTime);
	const parsedEnd = moment(endTime);

	if (!parsedStart.isValid() || !parsedEnd.isValid()) {
		const errorMsg = 'startTime and endTime must be valid ISO 8601 date strings.';
		log.warn(`Got request for weather data with invalid date params: ${errorMsg}`);
		failure(res, 400, errorMsg);
		return;
	}

	if (parsedStart.isAfter(parsedEnd)) {
		const errorMsg = 'startTime must be before endTime.';
		log.warn(`Got request for weather data with invalid date range: ${errorMsg}`);
		failure(res, 400, errorMsg);
		return;
	}

	const conn = getConnection();
	try {
		const weatherData = await WeatherData.getWeatherData(id, parsedStart, parsedEnd, conn);
		res.json(weatherData);
	} catch (err) {
		log.error(`Error while performing GET weather data query for location ${id}: ${err}`, err);
		failure(res, 500, `Error while retrieving weather data ${err}`);
	}
});

module.exports = router;