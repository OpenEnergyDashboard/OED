/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { log } = require('../log');
const { getConnection } = require('../db');
const { createCikArray } = require('../services/graph/createConversionArrays');
const Conversion = require('../models/Conversion');
const Meter = require('../models/Meter');
const Group = require('../models/Group');
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
	const validConversion = {
		type: 'object',
		required: ['sourceId', 'destinationId'],
		properties: {
			sourceId: { type: 'number', minimum: 0 },
			destinationId: { type: 'number', minimum: 0 }
		}
	};
	const validatorResult = validate(req.body, validConversion);
	if (!validatorResult.valid) {
		log.warn(`Got request to simulate deletion of conversions with invalid conversion data, errors: ${validatorResult.errors}`);
		failure(res, 400, `Got request to delete conversions with invalid conversion data. Error(s): ${validatorResult.errors}`);
		return;
	}
	try {
		// 1. Load all data
		const [allConversions, allMeters, allUnits, allGroups] = await Promise.all([
			Conversion.getAll(conn),
			Meter.getAll(conn),
			Unit.getAll(conn),
			Group.getAll(conn)
		]);

		// 2. Remove the conversion to be deleted
		const newConversions = allConversions.filter(c =>
			!(c.sourceId === req.body.sourceId && c.destinationId === req.body.destinationId)
		);

		// 3. Build simulated graph and Cik array
		const simulatedGraph = createConversionGraphFromArray(allUnits, newConversions);
		// If you need to handle suffix units, call your in-memory version here
		// await handleSuffixUnits(simulatedGraph, conn); // (need a different version to not write to DB)
		const simulatedCik = await createCikArray(simulatedGraph, conn);

		// 4. Get the current Cik array
		const currentGraph = await createConversionGraph(conn);
		const currentCik = await createCikArray(currentGraph, conn);

		// 5. For each meter, compare compatible units before/after
		const affectedMeters = [];
		for (const meter of allMeters) {
			if (meter.unitId == -99) continue;
			const before = new Set(currentCik
				.filter(cik => cik.source === meter.unitId)
				.map(cik => cik.destination));
			const after = new Set(simulatedCik
				.filter(cik => cik.source === meter.unitId)
				.map(cik => cik.destination));
			const lostUnits = [...before].filter(u => !after.has(u));
			if (lostUnits.length > 0) {
				affectedMeters.push({
					meterId: meter.id,
					meterName: meter.name,
					lostUnits
				});
			}
		}

		// 6. For each group, compare compatible units before/after
		const affectedGroups = [];
		for (const group of allGroups) {
			const meterIds = await Group.getDeepMetersByGroupID(group.id, conn);
			if (!meterIds || meterIds.length === 0) continue;

			// Helper to get compatible units for a set of meters from a Cik array
			const compatibleUnits = (cikArr) => {
				const sets = meterIds.map(meterId =>
					new Set(cikArr.filter(cik => cik.source === allMeters.find(m => m.id === meterId)?.unitId)
						.map(cik => cik.destination))
				);
				return sets.length ? sets.reduce((a, b) => new Set([...a].filter(x => b.has(x)))) : new Set();
			};

			const before = compatibleUnits(currentCik);
			const after = compatibleUnits(simulatedCik);

			if (before.size > 0 && after.size === 0) {
				affectedGroups.push({
					groupId: group.id,
					groupName: group.name,
					lostUnits: Array.from(before)
				});
			}
		}

		return res.json({ affectedMeters, affectedGroups });
	} catch (err) {
		log.error(`Error while simulating deletion of conversion with error(s): ${err}`);
		failure(res, 500, `Error while simulating deletion of conversion with errors(s): ${err}`);
	}
});
module.exports = router;
