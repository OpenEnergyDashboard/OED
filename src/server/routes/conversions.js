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
		const simulatedCik = await createCikArray(simulatedGraph, conn);

		// 4. Get the current Cik array
		const currentGraph = await createConversionGraph(conn);
		const currentCik = await createCikArray(currentGraph, conn);

		// 5. Precompute compatible units for each meter (current and simulated)
		const meterIdToUnits_current = {};
		const meterIdToUnits_sim = {};
		for (const meter of allMeters) {
			if (meter.unitId == -99) continue;
			meterIdToUnits_current[meter.id] = new Set(currentCik.filter(cik => cik.source === meter.unitId).map(cik => cik.destination));
			meterIdToUnits_sim[meter.id] = new Set(simulatedCik.filter(cik => cik.source === meter.unitId).map(cik => cik.destination));
		}

		// 6. Batch load all group-to-meter relationships
		const groupIdToMeterIds = {};
		await Promise.all(allGroups.map(async group => {
			groupIdToMeterIds[group.id] = await Group.getDeepMetersByGroupID(group.id, conn);
		}));

		// 7. For each meter, compare compatible units before/after
		const affectedMeters = [];
		for (const meter of allMeters) {
			if (meter.unitId == -99) continue;
			const before = meterIdToUnits_current[meter.id] || new Set();
			const after = meterIdToUnits_sim[meter.id] || new Set();
			const lostUnits = [...before].filter(u => !after.has(u));
			if (lostUnits.length > 0) {
				affectedMeters.push({
					meterId: meter.id,
					meterName: meter.name,
					lostUnits
				});
			}
		}

		// 8. For each group, intersect the sets (using cached meter compatible units)
		const affectedGroups = [];
		for (const group of allGroups) {
			const meterIds = groupIdToMeterIds[group.id];
			if (!meterIds || meterIds.length === 0) continue;

			const intersectSets = sets => sets.reduce((a, b) => new Set([...a].filter(x => b.has(x))));
			const sets_current = meterIds.map(id => meterIdToUnits_current[id] || new Set());
			const sets_sim = meterIds.map(id => meterIdToUnits_sim[id] || new Set());
			const before = sets_current.length ? intersectSets(sets_current) : new Set();
			const after = sets_sim.length ? intersectSets(sets_sim) : new Set();

			const lostUnits = [...before].filter(u => !after.has(u));
			if (lostUnits.length > 0) {
				affectedGroups.push({
					groupId: group.id,
					groupName: group.name,
					lostUnits,
					orphaned: after.size === 0
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
