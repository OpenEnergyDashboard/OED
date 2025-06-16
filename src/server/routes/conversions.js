/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { log } = require('../log');
const { getConnection } = require('../db');
const Conversion = require('../models/Conversion');
const Meter = require('../models/Meter');
const User = require('../models/User');
const Unit = require('../models/Unit');
const { success, failure } = require('./response');
const { getAllPaths, createConversionGraph, createConversionGraphFromArray } = require('../services/graph/createConversionGraph');
const validate = require('jsonschema').validate;
const Unit = require('../models/Unit');
const { removeAdditionalConversionsAndUnits } = require('../services/graph/handleSuffixUnits');
const { adminAuthMiddleware, optionalAuthMiddleware } = require('./authenticator');
>>>>>>> 326292140 (This changes several items in routes:)

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
		log.warn(`Got request to delete conversions with invalid conversion data, errors: ${validatorResult.errors}`);
		failure(res, 400, `Got request to delete conversions with invalid conversion data. Error(s): ${validatorResult.errors}`);
	} else {
		const conn = getConnection();
		try {
			// Get the source and destination units for the conversion
			const source = await Unit.getById(req.body.sourceId, conn);
			const dest = await Unit.getById(req.body.destinationId, conn);
			// Check if the source or the destination is a suffix unit
			if (source.typeOfUnit === 'suffix') {
				log.info('Suffix unit is used in conversion deletion as source.');
				await removeAdditionalConversionsAndUnits(source, conn);
			}
			if (dest.typeOfUnit === 'suffix') {
				log.info('Suffix unit is used in conversion deletion as destination.');
				await removeAdditionalConversionsAndUnits(dest, conn);
			}
			// Don't worry about checking if the conversion already exists
			// Just try to delete it to save the extra database call, since the database will return an error anyway if the row does not exist
			await Conversion.delete(req.body.sourceId, req.body.destinationId, conn);
		} catch (err) {
			log.error(`Error while deleting conversion with error(s): ${err}`);
			failure(res, 500, `Error while deleting conversion with errors(s): ${err}`);
		}
		success(res, 'Successfully deleted conversion');
	}
});
router.post('/simulate-delete', async (req, res) => {
	const conn = getConnection();
	// 1. Validate input like in /delete
	// Only require a source and destination id
	const validConversion = {
		type: 'object',
		required: ['sourceId', 'destinationId'],
		properties: {
			sourceId: {
				type: 'number',
				minimum: 0
			},
			destinationId: {
				type: 'number',
				minimum: 0
			}
		}
	};
	const validatorResult = validate(req.body, validConversion);
	if (!validatorResult.valid) {
		log.warn(`Got request to simulate deletion of conversions with invalid conversion data, errors: ${validatorResult.errors}`);
		failure(res, 400, `Got request to delete conversions with invalid conversion data. Error(s): ${validatorResult.errors}`);
	}
	// 2. Load all conversions, units, meters, groups
	try {
		const [allConversions, allMeters, allUnits] = await Promise.all([
			Conversion.getAll(conn),
			Meter.getAll(conn),
			Unit.getAll(conn)
		]);
	// 3. Remove the conversions we are simulating deleting
	const newConversions = allConversions.filter(c =>
		!(c.sourceId === req.body.sourceId && c.destinationId === req.body.destinationId)
	);
	// 4. Build old and new graphs
	const oldGraph = await createConversionGraph(conn);
	// Build a new graph with the remaining conversions
	const newGraph = createConversionGraphFromArray(allUnits, newConversions);
	// 5. For each meter/group, compare graphable units before/after deletion
	const affectedMeters = [];
		for (const meter of allMeters) {
			const unitId = meter.unitId;
			const oldPaths = getAllPaths(oldGraph, unitId);
			const newPaths = getAllPaths(newGraph, unitId);

			const oldReachable = new Set(oldPaths.map(p => p[p.length - 1]));
			const newReachable = new Set(newPaths.map(p => p[p.length - 1]));

			const lostUnits = [...oldReachable].filter(u => !newReachable.has(u));
			if (lostUnits.length > 0) {
				affectedMeters.push({
					meterId: meter.id,
					meterName: meter.name,
					lostUnits
				});
			}
		}
	// 6. Return a summary of affected meters/groups and lost units
		return res.json({affectedMeters});
	} catch (err) {
		log.error(`Error while simulating deletion of conversion with error(s): ${err}`);
		failure(res, 500, `Error while simulating deletion of conversion with errors(s): ${err}`);
	}
});
module.exports = router;
