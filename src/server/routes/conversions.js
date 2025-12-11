/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { log } = require('../log');
const { getConnection } = require('../db');
const Conversion = require('../models/Conversion');
const { success, failure } = require('./response');
const validate = require('jsonschema').validate;
const Unit = require('../models/Unit');
const { removeAdditionalConversionsAndUnits } = require('../services/graph/handleSuffixUnits');
const { adminAuthMiddleware, optionalAuthMiddleware } = require('./authenticator');
const { simulateDeleteConversion } = require('../services/conversionSimulation');
const { checkUnitDependencies, getUnitDependencyDetails } = require('../services/graph/checkUnitDependencies');

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
		return;
	}
	const { sourceId, destinationId, meterIds = [], groupIds = [] } = req.body;
	const conn = getConnection();
	try {
		// Get the source and destination units for the conversion (before transaction for validation)
		const source = await Unit.getById(sourceId, conn);
		const dest = await Unit.getById(destinationId, conn);
		
		if (!source || !dest) {
			failure(res, 404, 'Source or destination unit not found');
			return;
		}

		// Check for dependencies on suffix units that will be affected
		// This provides better error messages before attempting deletion
		const suffixUnitsToCheck = [];
		if (source.typeOfUnit === 'suffix') {
			suffixUnitsToCheck.push({ unit: source, role: 'source' });
		}
		if (dest.typeOfUnit === 'suffix') {
			suffixUnitsToCheck.push({ unit: dest, role: 'destination' });
		}

		// Check dependencies for each suffix unit that will be cleaned up
		for (const { unit, role } of suffixUnitsToCheck) {
			const deps = await getUnitDependencyDetails(unit.id, conn);
			
			// If suffix unit has meter/group dependencies, provide detailed error
			if (deps.meterCount > 0 || deps.groupCount > 0) {
				const meterNames = deps.meters.map(m => `"${m.name}"`).join(', ');
				const groupNames = deps.groups.map(g => `"${g.name}"`).join(', ');
				
				let errorMsg = `Cannot delete conversion: ${role} unit "${unit.name}" (ID: ${unit.id}) is used by `;
				const parts = [];
				if (deps.meterCount > 0) {
					parts.push(`${deps.meterCount} meter(s): ${meterNames}`);
				}
				if (deps.groupCount > 0) {
					parts.push(`${deps.groupCount} group(s): ${groupNames}`);
				}
				errorMsg += parts.join(' and ');
				
				log.warn(`Conversion deletion blocked due to dependencies: ${errorMsg}`);
				failure(res, 400, errorMsg);
				return;
			}
		}

		// Perform all operations in a single transaction for atomicity
		await conn.tx(async t => {
			// Lock the units to prevent concurrent modifications
			await t.one('SELECT * FROM units WHERE id = $1 FOR UPDATE', [sourceId]);
			await t.one('SELECT * FROM units WHERE id = $1 FOR UPDATE', [destinationId]);
			
			// Check if the source or the destination is a suffix unit and clean up related conversions/units
			if (source.typeOfUnit === 'suffix') {
				log.info(`Suffix unit ${sourceId} is used in conversion deletion as source. Cleaning up related conversions and units.`);
				// Reload source unit within transaction to ensure consistency
				const sourceInTx = await Unit.getById(sourceId, t);
				await removeAdditionalConversionsAndUnits(sourceInTx, t);
			}
			if (dest.typeOfUnit === 'suffix') {
				log.info(`Suffix unit ${destinationId} is used in conversion deletion as destination. Cleaning up related conversions and units.`);
				// Reload dest unit within transaction to ensure consistency
				const destInTx = await Unit.getById(destinationId, t);
				await removeAdditionalConversionsAndUnits(destInTx, t);
			}
			
			// Handle bidirectional conversion deletion safely
			// Check if this conversion is bidirectional and if reverse exists
			const conversion = await Conversion.getBySourceDestination(sourceId, destinationId, t);
			if (conversion && conversion.bidirectional) {
				// Check for reverse conversion (some systems store bidirectional as two entries)
				const reverseConversion = await Conversion.getBySourceDestination(destinationId, sourceId, t);
				if (reverseConversion) {
					log.info(`Deleting bidirectional conversion pair: ${sourceId} <-> ${destinationId}`);
					await Conversion.delete(destinationId, sourceId, t);
				}
			}
			
			// Update meters if any
			for (const meterId of meterIds) {
				await t.none('UPDATE meters SET default_graphic_unit = NULL WHERE id = $1', [meterId]);
			}
			// Update groups if any
			for (const groupId of groupIds) {
				await t.none('UPDATE groups SET default_graphic_unit = NULL WHERE id = $1', [groupId]);
			}
			// Delete conversion
			await Conversion.delete(sourceId, destinationId, t);
		});
		
		// Verify no orphaned suffix units after cleanup (performance: only check if suffix units were involved)
		if (source.typeOfUnit === 'suffix' || dest.typeOfUnit === 'suffix') {
			try {
				// Use efficient query with LIMIT to avoid scanning large tables unnecessarily
				// Only check recently affected units to improve performance on large databases
				const orphanedUnits = await conn.any(`
					SELECT u.id, u.name 
					FROM units u
					WHERE u.type_of_unit = 'suffix'::unit_type
					  AND u.displayable != 'none'::displayable_type
					  AND (u.id = $1 OR u.id = $2 OR u.id IN (
						  SELECT DISTINCT CASE 
							  WHEN c.source_id IN ($1, $2) THEN c.destination_id
							  WHEN c.destination_id IN ($1, $2) THEN c.source_id
						  END
						  FROM conversions c
						  WHERE (c.source_id IN ($1, $2) OR c.destination_id IN ($1, $2))
					  ))
					  AND NOT EXISTS (
						  SELECT 1 FROM conversions c 
						  WHERE (c.source_id = u.id OR c.destination_id = u.id)
					  )
					LIMIT 100
				`, [sourceId, destinationId]);
				if (orphanedUnits.length > 0) {
					log.warn(`Found ${orphanedUnits.length} potentially orphaned suffix units after cleanup: ${orphanedUnits.map(u => `${u.id} (${u.name})`).join(', ')}`);
					// Log metrics for monitoring
					log.info(`Conversion deletion metrics: sourceId=${sourceId}, destId=${destinationId}, orphanedUnits=${orphanedUnits.length}`);
				}
			} catch (err) {
				// Non-critical check, log but don't fail
				log.warn(`Error checking for orphaned units: ${err}`);
			}
		}
		
		success(res, 'Successfully deleted conversion and updated meters/groups');
	} catch (err) {
		log.error(`Error while deleting conversion and updating meters/groups: ${err}`, err);
		failure(res, 500, `Error while deleting conversion and updating meters/groups: ${err.message || err}`);
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
