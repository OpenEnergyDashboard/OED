/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { getConnection } = require('../db');
const Conversion = require('../models/Conversion');
const { success, failure, LogLevel } = require('./response');
const { HTTP_CODES } = require('../util/httpCodes');
const validate = require('jsonschema').validate;

const { simulateDeleteConversion } = require('../services/conversionSimulation');
const { adminAuthMiddleware, optionalAuthMiddleware } = require('./authenticator');
const { STRING_GENERAL_MAX_LENGTH } = require('../util/validationConstants');


const router = express.Router();

function formatConversionForResponse(item) {
	return {
		sourceId: item.sourceId, destinationId: item.destinationId, bidirectional: item.bidirectional, slope: item.slope, intercept: item.intercept, note: item.note
	};
}

/**
 * Validates the body of a conversion create/edit request.
 * Conversions are keyed by sourceId/destinationId rather than a single id, so the same
 * schema is valid for both /addConversion and /edit; there is no isEdit distinction needed.
 * @param params req.body for a conversion create or edit request
 * @returns {{valid: boolean, errors: array}}
 */
function validateConversionsParams(params) {
	const validConversion = {
		type: 'object',
		maxProperties: 6,
		required: ['sourceId', 'destinationId', 'bidirectional', 'slope', 'intercept'],
		properties: {
			sourceId: {
				type: 'integer',
				minimum: 1,
				maximum: Number.MAX_SAFE_INTEGER
			},
			destinationId: {
				type: 'integer',
				minimum: 1,
				maximum: Number.MAX_SAFE_INTEGER
			},
			bidirectional: {
				type: 'boolean'
			},
			slope: {
				type: 'number'
			},
			intercept: {
				type: 'number'
			},
			note: {
				oneOf: [
					{
						type: 'string',
						maxLength: STRING_GENERAL_MAX_LENGTH
					},
					{ type: 'null' }
				]
			}
		}
	};
	const validatorResult = validate(params, validConversion);
	return { valid: validatorResult.valid, errors: validatorResult.errors };
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
		failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Error while performing GET conversions details query: ${err.message}`, { cause: err }));
	}
});

/**
 * Route for POST, edit conversion.
 */
router.post('/edit', adminAuthMiddleware('edit conversions'), async (req, res) => {
	const validatorResult = validateConversionsParams(req.body);

	if (!validatorResult.valid) {
		const message = `Got request to edit conversions with invalid conversion data, errors: ${validatorResult.errors}`;
		failure(res, HTTP_CODES.BAD_REQUEST, message, message, LogLevel.WARN);
		return;
	} else {
		const conn = getConnection();
		try {
			const updatedConversion = new Conversion(req.body.sourceId, req.body.destinationId, req.body.bidirectional,
				req.body.slope, req.body.intercept, req.body.note);
			await updatedConversion.update(conn);
			success(res);
		} catch (err) {
			failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Error while editing conversion with error(s): ${err.message}`, { cause: err }));
		}
	}
});

/**
 * Route for POST add conversion.
 */
router.post('/addConversion', adminAuthMiddleware('add conversions'), async (req, res) => {
	const validatorResult = validateConversionsParams(req.body);

	if (!validatorResult.valid) {
		const message = `Got request to insert conversion with invalid conversion data. Error(s): ${validatorResult.errors}`;
		failure(res, HTTP_CODES.BAD_REQUEST, message, message);
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
			success(res);
		} catch (err) {
			failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Error while inserting new conversion with error(s): ${err.message}`, { cause: err }));
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
				minimum: 1
			},
			destinationId: {
				type: 'integer',
				minimum: 1
			},
			meterIds: {
				type: 'array',
				items: { type: 'integer', minimum: 1 },
				uniqueItems: true,
				maxItems: 1000
			},
			groupIds: {
				type: 'array',
				items: { type: 'integer', minimum: 1 },
				uniqueItems: true,
				maxItems: 1000
			}
		},
		additionalProperties: false
	};

	const validatorResult = validate(req.body, validConversion);
	if (!validatorResult.valid) {
		const message = `Got request to delete conversions with invalid conversion data. Error(s): ${validatorResult.errors}`;
		failure(res, HTTP_CODES.BAD_REQUEST, message, message);
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
			failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Error while deleting conversion and updating meters/groups: ${err.message}`, { cause: err }));
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
		const message = `Got request to simulate deletion of conversions with invalid conversion data. Error(s): ${validatorResult.errors}`;
		failure(res, HTTP_CODES.BAD_REQUEST, message, message, LogLevel.WARN);
	} else {
		try {
			const conn = getConnection();
			const result = await simulateDeleteConversion(req.body, conn);
			success(res, result);
		} catch (err) {
			failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Error while simulating deletion of conversion with error(s): ${err.message}`, { cause: err }));
		}
	}
});
module.exports = router;
