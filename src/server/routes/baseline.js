/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
const express = require('express');
const Baseline = require('../models/Baseline');
const log = require('../log');
const router = express.Router();
router.get('/', async (req, res) => {
	try {
		const rawBaselines = await Baseline.getAllBaselines();
		res.json(rawBaselines);
	} catch (err) {
		log(`Error while getting all baselines: ${err}`, 'error');
	}
});
router.post('/new', async (req, res) => {
	try {
		const baseline = await new Baseline(
			req.body.meterID,
			req.body.applyStart,
			req.body.applyEnd,
			req.body.calcStart,
			req.body.calcEnd
		);
		await baseline.insert();
		res.sendStatus(200);
	} catch (err) {
		res.sendStatus(500);
		log(`Error while adding baseline: ${err}`, 'error');
	}
});
module.exports = router;
