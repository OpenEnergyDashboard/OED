/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const _ = require('lodash');
const moment = require('moment');
const Meter = require('../models/Meter');
const Reading = require('../models/Reading');
const TimeInterval = require('../../common/TimeInterval').TimeInterval;
const { log } = require('../log');
const validate = require('jsonschema').validate;
const { getConnection } = require('../db');

const router = express.Router();

router.get('/line/count/meters/:meter_ids', async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['meter_ids'],
		properties: {
			meter_ids: {
				type: 'string'
			}
		}
	};
	const validQueries = {
		type: 'object',
		maxProperties: 1,
		required: ['timeInterval'],
		properties: {
			timeInterval: {
				type: 'string'
			}
		}
	};
	if (!validate(req.params, validParams).valid || !validate(req.query, validQueries).valid) {
		res.sendStatus(400);
	} else {
		const conn = getConnection();
		const meterIDs = req.params.meter_ids.split(',').map(s => parseInt(s));
		const timeInterval = TimeInterval.fromString(req.query.timeInterval);
		try {
			let count = 0;
			for (var i = 0; i < meterIDs.length; i++) {
				const curr = await Reading.getCountByMeterIDAndDateRange(meterIDs[i], timeInterval.startTimestamp, timeInterval.endTimestamp, conn);
				count += curr
			}
			res.send(JSON.stringify(count));
		} catch (err) {
			log.error(`Error while performing GET readings COUNT for line with meters ${meterIDs} with time interval ${timeInterval}: ${err}`, err);
			res.sendStatus(500);
		}
	}
})

router.get('/line/raw/meters/:meter_ids', async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['meter_ids'],
		properties: {
			meter_ids: {
				type: 'string'
			}
		}
	};
	const validQueries = {
		type: 'object',
		maxProperties: 1,
		required: ['timeInterval'],
		properties: {
			timeInterval: {
				type: 'string'
			}
		}
	};
	if (!validate(req.params, validParams).valid || !validate(req.query, validQueries).valid) {
		res.sendStatus(400);
	} else {
		const conn = getConnection();
		// We can't do .map(parseInt) here because map would give parseInt a radix value of the current array position.
		// Again, this is why a lambda function is used so that .map(parseInt) can be recreated without problems.
		const meterIDs = req.params.meter_ids.split(',').map(s => parseInt(s));
		const timeInterval = TimeInterval.fromString(req.query.timeInterval);
		try {
			let toReturn = [];
			for (let i = 0; i < meterIDs.length; i++) {
				meterID = meterIDs[i];
				const rawReadings = await Reading.getReadingsByMeterIDAndDateRange(meterID, timeInterval.startTimestamp, timeInterval.endTimestamp, conn)
				const meterLabel = (await Meter.getByID(meterID, conn)).name;
				rawReadings.map(ele => {
					delete ele.meterID;
					ele.label = meterLabel;
					// The Reading function to get items from the databases returns the moment in UTC so this is okay without forcing it.
					ele.startTimestamp = moment(ele.startTimestamp).format('dddd LL LTS').replace(/,/g, ''); // use regex to omit pesky commas
					ele.endTimestamp = moment(ele.endTimestamp).format('dddd LL LTS').replace(/,/g, ''); // use regex to omit pesky commas
					toReturn.push(ele);
				})
			}
			res.send(toReturn);
		} catch (err) {
			log.error(`Error while performing GET raw readings for line with meters ${meterIDs} with time interval ${timeInterval}: ${err}`, err);
			res.sendStatus(500);
		}
	}
});


module.exports = router;

