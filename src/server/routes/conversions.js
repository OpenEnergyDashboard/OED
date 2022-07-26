/* This Source Code Form is subject to the terms of the Mozilla Public
  * License, v. 2.0. If a copy of the MPL was not distributed with this
  * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { log } = require('../log');
const { getConnection } = require('../db');
const Conversion = require('../models/Conversion');
const validate = require('jsonschema').validate;

const router = express.Router();

function formatConversionForResponse(item) {
	return {
		sourceId: item.sourceId, destinationId: item.destinationId, bidirectional: item.bidirectional,
		slope: item.slope, intercept: item.intercept, note: item.note
	};
}

/**
 * Route for getting all conversions.
 */
router.get('/', async (req, res) => {
	const conn = getConnection();
	try {
		const rows = await Conversion.getAll(conn);
		res.json(rows.map(formatConversionForResponse));
	} catch (err) {
		log.error(`Error while performing GET conversions details query: ${err}`, err);
	}
});

/**
 * Route for POST, edit conversion.
 */
router.post('/edit', async (req, res) => {
	const validConversion = {
		type: 'object',
		required: ['sourceId', 'destinationId', 'bidirectional', 'slope', 'intercept'], // TODO: Determine if we will only require source and destination IDs
		properties: {
			sourceId: {
				type: 'number',
			},
			destinationId: {
				type: 'number',
			},
			bidirectional: {
				type: 'boolean',
			},
			slope: {
				type: 'float',
			},
			intercept: {
				type: 'float',
			},
			note: {
				oneOf: [
					{ type: 'string' },
					{ type: 'null' }
				]
			}
		}
	};

	const validatorResult = validate(req.body, validConversion);
	if (!validatorResult.valid) {
		log.warn(`Got request to edit conversions with invalid conversion data, errors:${validatorResult.errors}`);
		res.status(400);
	} else {
		const conn = getConnection();
		try {
			const conversion = await Conversion.getBySourceDestination(req.body.sourceId, req.body.destinationId, conn);
			conversion.sourceId = req.body.sourceId;
			conversion.destinationId = req.body.destinationId;
			conversion.bidirectional = req.body.bidirectional;
			conversion.slope = req.body.slope;
			conversion.intercept = req.body.intercept;
			conversion.note = req.body.note;
			await conversion.update(conn);
		} catch (err) {
			log.error('Failed to edit conversion', err);
			res.status(500).json({ message: 'Unable to edit conversions.', err });
		}
		res.status(200).json({ message: `Successfully edited conversions ${req.body.sourceId}` });
	}
});

/**
 * Route for POST add conversion.
 */
router.post('/addConversion', async (req, res) => {
	const validConversion = {
		type: 'object',
		required: ['sourceId', 'destinationId', 'bidirectional', 'slope', 'intercept'],
		properties: {
			sourceId: {
				type: 'number',
			},
			destinationId: {
				type: 'number',
			},
			bidirectional: {
				type: 'boolean',
			},
			slope: {
				type: 'float',
			},
			intercept: {
				type: 'float',
			},
			note: {
				oneOf: [
					{ type: 'string' },
					{ type: 'null' }
				]
			}
		}
	};
	const validationResult = validate(req.body, validConversion);
	if (!validationResult.valid) {
		log.error(`Invalid input for ConversionsAPI. ${validationResult.error}`);
		res.sendStatus(400);
	} else {
		const conn = getConnection();
		try {
			await conn.tx(async t => {
				const newConversion = new Conversion(
					undefined,
					req.body.sourceId,
					req.body.destinationId,
					req.body.bidirectional,
					req.body.slope,
					req.body.intercept,
					req.body.note
				);
				await newConversion.insert(t);
			});
			res.sendStatus(200);
		} catch (err) {
			log.error(`Error while inserting new conversion ${err}`, err);
			res.sendStatus(500);
		}
	}
});

module.exports = router;