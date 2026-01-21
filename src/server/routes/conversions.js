/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { log } = require('../log');
const { getConnection } = require('../db');
const Conversion = require('../models/Conversion');
const { success, failure } = require('./response');
const validate = require('jsonschema').validate;

const { simulateDeleteConversion } = require('../services/conversionSimulation');
const { adminAuthMiddleware, optionalAuthMiddleware } = require('./authenticator');


const router = express.Router();

function formatConversionForResponse(item) {
	return {
		sourceId: item.sourceId, destinationId: item.destinationId, bidirectional: item.bidirectional, slope: item.slope, intercept: item.intercept, note: item.note
	};
}

/**
 * Route for getting all conversions.
 */
router.get('/', optionalAuthMiddleware, async (req, res) => {
	const conn = getConnection();
	try {
		const rows = await Conversion.getAll(conn);
		res.json(rows.map(formatConversionForResponse));
	} catch (err) {
		log.error(`Error while performing GET conversions details query: ${err}`);
	}
});

/**
 * Route for POST, edit conversion.
 */
router.post('/edit', adminAuthMiddleware('edit conversions'), async (req, res) => {
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
		log.warn(`Got request to edit conversions with invalid conversion data, errors: ${validatorResult.errors}`);
		failure(res, 400, `Got request to edit conversions with invalid conversion data, errors: ${validatorResult.errors}`);
	} else {
		const conn = getConnection();
		try {
			const updatedConversion = new Conversion(req.body.sourceId, req.body.destinationId, req.body.bidirectional,
				req.body.slope, req.body.intercept, req.body.note);
			await updatedConversion.update(conn);
		} catch (err) {
			log.error(`Error while editing conversion with error(s): ${err}`);
			failure(res, 500, `Error while editing conversion with error(s): ${err}`);
		}
		success(res);
	}
});

/**
 * Route for POST add conversion.
 */
router.post('/addConversion', adminAuthMiddleware('add conversions'), async (req, res) => {
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
		log.error(`Got request to insert conversion with invalid conversion data, errors: ${validatorResult.errors}`);
		failure(res, 400, `Got request to insert conversion with invalid conversion data. Error(s): ${validatorResult.errors}`);
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
			log.error(`Error while inserting new conversion with error(s): ${err}`);
			failure(res, 500, `Error while inserting new conversion with errors(s): ${err}`);
		}
	}
});

/**
 * Route for POST, delete conversion.
 */
router.post('/delete', adminAuthMiddleware('delete conversions'), async (req, res) => {
	// Accept sourceId, destinationId, meterIds, groupIds
	const validConversion = {
		type: 'object',
		required: ['sourceId', 'destinationId', 'meterIds', 'groupIds'],
		properties: {
			sourceId: {
				type: 'integer',
				minimum: 0
			},
			destinationId: {
				type: 'integer',
				minimum: 0
			},
			meterIds: {
				type: 'array',
				items: { type: 'integer', minimum: 0 },
				uniqueItems: true,
				maxItems: 1000
			},
			groupIds: {
				type: 'array',
				items: { type: 'integer', minimum: 0 },
				uniqueItems: true,
				maxItems: 1000
			}
		},
		additionalProperties: false
	};

	const validatorResult = validate(req.body, validConversion);
	if (!validatorResult.valid) {
		log.error(`Got request to delete conversions with invalid conversion data, errors: ${validatorResult.errors}`);
		failure(res, 400, `Got request to delete conversions with invalid conversion data. Error(s): ${validatorResult.errors}`);
	} else {
		const { sourceId, destinationId, meterIds = [], groupIds = [] } = req.body;
		const conn = getConnection();
		try {
			await conn.tx(async t => {
				// Update meters if any
				for (const meterId of meterIds) {
					await t.none(`UPDATE meters SET default_graphic_unit = NULL WHERE id = ${meterId}`);
				}
				// Update groups if any
				for (const groupId of groupIds) {
					await t.none(`UPDATE groups SET default_graphic_unit = NULL WHERE id = ${groupId}`);
				}
				// Delete conversion
				await Conversion.delete(sourceId, destinationId, t);
			});
			success(res, 'Successfully deleted conversion and updated meters/groups');
		} catch (err) {
			log.error(`Error while deleting conversion and updating meters/groups: ${err}`);
			failure(res, 500, `Error while deleting conversion and updating meters/groups: ${err}`);
		}
	}
});
router.post('/simulate-delete', adminAuthMiddleware('simulate deleting conversions'), async (req, res) => {
	const validConversion = {
		type: 'object',
		required: ['sourceId', 'destinationId'],
		properties: {
			sourceId: { type: 'number', minimum: 0 },
			destinationId: { type: 'number', minimum: 0 }
		},
		additionalProperties: false
	};
	const validatorResult = validate(req.body, validConversion);
	if (!validatorResult.valid) {
		log.warn(`Got request to simulate deletion of conversions with invalid conversion data, errors: ${validatorResult.errors}`);
		failure(res, 400, `Got request to delete conversions with invalid conversion data. Error(s): ${validatorResult.errors}`);
	} else {
		try {
			const conn = getConnection();
			const result = await simulateDeleteConversion(req.body, conn);
			return res.json(result);
		} catch (err) {
			log.error(`Error while simulating deletion of conversion with error(s): ${err}`);
			failure(res, 500, `Error while simulating deletion of conversion with errors(s): ${err}`);
		}
	}
});
module.exports = router;
