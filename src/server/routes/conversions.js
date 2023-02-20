/* This Source Code Form is subject to the terms of the Mozilla Public
  * License, v. 2.0. If a copy of the MPL was not distributed with this
  * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { log } = require('../log');
const { getConnection } = require('../db');
const Conversion = require('../models/Conversion');
const { success, failure } = require('./response');
const validate = require('jsonschema').validate;

const router = express.Router();

function formatConversionForResponse(item) {
	return {
		sourceId: item.sourceId, destinationId: item.destinationId, bidirectional: item.bidirectional, slope: item.slope, intercept: item.intercept, note: item.note
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
		required: ['sourceId', 'destinationId', 'bidirectional', 'slope', 'intercept'],
		properties: {
			sourceId: {
				type: 'number',
				// Do not allow negatives for now
				minimum: 0
			},
			destinationId: {
				type: 'number',
				// Do not allow negatives for now
				minimum: 0
			},
			bidirectional: {
				type: 'boolean'
			},
			slope: {
				type: 'float'
			},
			intercept: {
				type: 'float'
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
		failure(res, 400, "Error(s): " + validatorResult.errors.toString());
	} else {
		const conn = getConnection();
		try {
			const updatedConversion = new Conversion(req.body.sourceId, req.body.destinationId, req.body.bidirectional,
				req.body.slope, req.body.intercept, req.body.note);
			await updatedConversion.update(conn);
		} catch (err) {
			log.error('Failed to edit conversion', err);
			failure(res, 500, "Unable to edit conversions due to " + err.toString());
		}
		success(res);
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
				// Do not allow negatives for now
				minimum: 0
			},
			destinationId: {
				type: 'number',
				// Do not allow negatives for now
				minimum: 0
			},
			bidirectional: {
				type: 'boolean'
			},
			slope: {
				type: 'float'
			},
			intercept: {
				type: 'float'
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
        failure(res, 400, 'Invalid input: ' + validationResult.error.toString());
	} else {
		const conn = getConnection();
		try {
			await conn.tx(async t => {
				const newConversion = new Conversion(
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
            failure(res, 500, 'Error while inserting new conversion: ' + err.toString());
		}
	}
});

/**
 * Route for POST, delete conversion.
 */
router.post('/delete', async (req, res) => {
	// Only require a source and destination id
	const validConversion = {
		type: 'object',
		required: ['sourceId', 'destinationId'],
		properties: {
			sourceId: {
				type: 'number',
				// Do not allow negatives for now
				minimum: 0
			},
			destinationId: {
				type: 'number',
				// Do not allow negatives for now
				minimum: 0
			}
		}
	};

	// Ensure conversion object is valid
	const validatorResult = validate(req.body, validConversion);
	if (!validatorResult.valid) {
		log.warn(`Got request to delete conversions with invalid conversion data, errors:${validatorResult.errors}`);
		res.status(400);
	} else {
		const conn = getConnection();
		try {
			// Don't worry about checking if the conversion already exists
			// Just try to delete it to save the extra database call, since the database will return an error anyway if the row does not exist
			await Conversion.delete(req.body.sourceId, req.body.destinationId, conn);
		} catch (err) {
			log.error('Failed to delete conversion', err);
			res.status(500).json({ message: 'Unable to delete conversions.', err });
		}
		res.status(200).json({ message: `Successfully deleted conversion ${req.body.sourceId} -> ${req.body.destinationId}` });
	}
});

module.exports = router;
