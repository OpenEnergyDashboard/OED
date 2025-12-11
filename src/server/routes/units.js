/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { adminAuthMiddleware, optionalAuthMiddleware } = require('./authenticator');
const { log } = require('../log');
const { getConnection } = require('../db');
const Unit = require('../models/Unit');
const Conversion = require('../models/Conversion');
const { removeAdditionalConversionsAndUnits } = require('../services/graph/handleSuffixUnits');
const validate = require('jsonschema').validate;
const { success, failure } = require('./response');
const router = express.Router();

function formatUnitForResponse(unit) {
	return {
		id: unit.id,
		name: unit.name,
		identifier: unit.identifier,
		unitRepresent: unit.unitRepresent,
		secInRate: unit.secInRate,
		typeOfUnit: unit.typeOfUnit,
		suffix: unit.suffix,
		displayable: unit.displayable,
		preferredDisplay: unit.preferredDisplay,
		note: unit.note,
		minVal: unit.minVal,
		maxVal: unit.maxVal,
		disableChecks: unit.disableChecks
	};
}

/**
 * Route for getting all units.
 */
router.get('/', optionalAuthMiddleware, async (req, res) => {
	const conn = getConnection();
	try {
		const rows = await Unit.getAll(conn);
		res.json(rows.map(formatUnitForResponse));
	} catch (err) {
		log.error(`Error fetching units: ${err}`, err);
		res.sendStatus(500);
	}
});

/**
 * Route for editing a unit by ID.
 */
router.post('/edit', adminAuthMiddleware('edit units'), async (req, res) => {
	const validUnit = {
		type: 'object',
		required: ['id', 'identifier'],
		// TODO Consider updating once decide exactly what want.
		// required: ['id', 'name', 'identifier', 'unitRepresent', 'secInRate', 'typeOfUnit', 'suffix'],
		properties: {
			id: { type: 'integer' },
			name: {
				type: 'string',
				minLength: 1
			},
			identifier: { type: 'string' },
			unitRepresent: {
				type: 'string',
				minLength: 1,
				enum: Object.values(Unit.unitRepresentType)
			},
			secInRate: { type: 'number' },
			typeOfUnit: {
				type: 'string',
				minLength: 1,
				enum: Object.values(Unit.unitType)
			},
			suffix: { type: 'string' },
			displayable: {
				type: 'string',
				minLength: 1,
				enum: Object.values(Unit.displayableType)
			},
			preferredDisplay: { type: 'boolean' },
			note: { type: 'string' },
			minVal: { type: 'number' },
			maxVal: { type: 'number' },
			disableChecks: {
				type: 'string',
				minLength: 1,
				enum: Object.values(Unit.disableChecksType)
			}
		}
	};
	const validatorResult = validate(req.body, validUnit);
	if (!validatorResult.valid) {
		log.warn(`Got request to edit units with invalid unit data, errors: ${validatorResult.errors}`);
		failure(res, 400, `Got request to edit units with invalid unit data, errors: ${validatorResult.errors}`);
	} else {
		const conn = getConnection();
		try {
			const unit = await Unit.getById(req.body.id, conn);
			if (unit.suffix !== req.body.suffix) {
				// Suffix changes so some conversions and units need to be removed.
				await removeAdditionalConversionsAndUnits(unit, conn);
			}
			unit.name = req.body.name;
			unit.displayable = req.body.displayable;
			unit.identifier = req.body.identifier;
			unit.unitRepresent = req.body.unitRepresent;
			unit.typeOfUnit = req.body.typeOfUnit;
			unit.preferredDisplay = req.body.preferredDisplay;
			unit.secInRate = req.body.secInRate;
			unit.suffix = req.body.suffix;
			unit.note = req.body.note;
			unit.minVal = req.body.minVal;
			unit.maxVal = req.body.maxVal;
			unit.disableChecks = req.body.disableChecks;
			// TODO Consider if this might be a better way.
			// Object.assign(unit, req.body);
			await unit.update(conn);
			success(res, 'Successfully edited unit');
		} catch (err) {
			log.error(`Failed to update unit: ${err}`, err);
			failure(res, 500, 'Unable to update unit');
		}
	}
});

/**
 * Route for creating a new unit.
 */
router.post('/addUnit', adminAuthMiddleware('add units'), async (req, res) => {
	const validUnit = {
		type: 'object',
		required: ['name', 'identifier', 'unitRepresent', 'typeOfUnit', 'displayable', 'preferredDisplay', 'minVal', 'maxVal', 'disableChecks'],
		properties: {
			// TODO Probably should not be passed
			// id: { type: 'integer' },
			name: {
				type: 'string',
				minLength: 1
			},
			identifier: {
				type: 'string',
				minLength: 1
			},
			unitRepresent: {
				type: 'string',
				minLength: 1,
				enum: Object.values(Unit.unitRepresentType)
			},
			secInRate: { type: 'number' },
			typeOfUnit: {
				type: 'string',
				minLength: 1,
				enum: Object.values(Unit.unitType)
			},
			suffix: {
				oneOf: [
					{ type: 'string' },
					{ type: 'null' }
				]
			},
			displayable: {
				type: 'string',
				minLength: 1,
				enum: Object.values(Unit.displayableType)
			},
			preferredDisplay: { type: 'boolean' },
			note: {
				oneOf: [
					{ type: 'string' },
					{ type: 'null' }
				]
			},
			minVal: { type: 'number' },
			maxVal: { type: 'number' },
			disableChecks: {
				type: 'string',
				minLength: 1,
				enum: Object.values(Unit.disableChecksType)
			}
		}
	};
	const validationResult = validate(req.body, validUnit);
	if (!validationResult.valid) {
		log.error(`Got request to edit units with invalid unit data, errors: ${validationResult.errors}`);
		failure(res, 400, `Got request to add units with invalid unit data, errors: ${validationResult.errors}`);
	} else {
		const conn = getConnection();
		try {
			await conn.tx(async t => {
				const newUnit = new Unit(
					undefined, // id
					req.body.name,
					req.body.identifier,
					req.body.unitRepresent,
					req.body.secInRate,
					req.body.typeOfUnit,
					req.body.suffix,
					req.body.displayable,
					req.body.preferredDisplay,
					req.body.note,
					req.body.minVal,
					req.body.maxVal,
					req.body.disableChecks
				);
				await newUnit.insert(t);
			});
			success(res, 'Unit created successfully');
		} catch (err) {
			log.error(`Error while inserting new unit: ${err}`, err);
			failure(res, 500, `Error while inserting new unit: ${err}`);
		}
	}
});

/**
 * Route for deleting a unit by ID.
 */
router.post('/delete', adminAuthMiddleware('delete units'), async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['id'],
		properties: { id: { type: 'integer' } }
	};
	// Ensure delete request is valid
	const validatorResult = validate(req.body, validParams);
	if (!validatorResult.valid) {
		const errorMsg = `Got request to delete a unit with invalid data, error(s): ${validatorResult.errors}`;
		log.warn(errorMsg);
		failure(res, 400, errorMsg);
		return;
	}
	
		const conn = getConnection();
		const unitId = req.body.id;
		try {
		const unit = await Unit.getById(unitId, conn);
		if (!unit) {
			failure(res, 404, 'Unit not found');
			return;
		}
		
		// Check for dependencies before deletion
		const { checkUnitDependencies } = require('../services/graph/checkUnitDependencies');
		const deps = await checkUnitDependencies(unitId, conn);
		
		// If unit has meter/group dependencies, provide detailed error
		if (deps.meters.length > 0 || deps.groups.length > 0) {
			const meterNames = deps.meters.map(m => `"${m.name}"`).join(', ');
			const groupNames = deps.groups.map(g => `"${g.name}"`).join(', ');
			
			let errorMsg = `Cannot delete unit "${unit.name}" (ID: ${unitId}): used by `;
			const parts = [];
			if (deps.meters.length > 0) {
				parts.push(`${deps.meters.length} meter(s): ${meterNames}`);
			}
			if (deps.groups.length > 0) {
				parts.push(`${deps.groups.length} group(s): ${groupNames}`);
			}
			errorMsg += parts.join(' and ');
			
			log.warn(`Unit deletion blocked due to dependencies: ${errorMsg}`);
			failure(res, 400, errorMsg);
			return;
		}
		
		// Perform all operations in a single transaction for atomicity
		await conn.tx(async t => {
			// Lock the unit to prevent concurrent modifications
			await t.one('SELECT * FROM units WHERE id = $1 FOR UPDATE', [unitId]);
			
			// Reload unit within transaction to ensure consistency
			const unitInTx = await Unit.getById(unitId, t);
			
			// Handle suffix-type units (created by OED)
			if (unitInTx.typeOfUnit === 'suffix') {
				log.info(`Deleting suffix-type unit ${unitId}. Cleaning up associated units and conversions.`);
				await removeAdditionalConversionsAndUnits(unitInTx, t);
			}
			
			// Handle units with suffix string (not suffix-type)
			// These units may have conversions involving suffix units that need cleanup
			if (unitInTx.suffix && unitInTx.suffix.trim() !== '') {
				log.info(`Unit ${unitId} has suffix "${unitInTx.suffix}". Checking for suffix-involved conversions.`);
				
				// Get all conversions involving this unit
				const allConversions = await Conversion.getAll(t);
				const relatedConversions = allConversions.filter(c =>
					c.sourceId === unitId || c.destinationId === unitId
				);
				
				// Delete bidirectional conversions safely
				for (const conversion of relatedConversions) {
					// Delete the conversion
					await Conversion.delete(conversion.sourceId, conversion.destinationId, t);
					
					// If bidirectional, also delete reverse if it exists separately
					if (conversion.bidirectional) {
						const reverseConversion = await Conversion.getBySourceDestination(
							conversion.destinationId,
							conversion.sourceId,
							t
						);
						if (reverseConversion) {
							await Conversion.delete(conversion.destinationId, conversion.sourceId, t);
							log.info(`Deleted bidirectional conversion pair: ${conversion.sourceId} <-> ${conversion.destinationId}`);
						}
					}
				}
			}
			
			// Delete the unit
			await Unit.delete(unitId, t);
		});
		
			success(res, 'Successfully deleted unit');
		} catch (err) {
			const errorMsg = `Error while deleting unit with error(s): ${err}`;
		log.error(errorMsg, err);
			failure(res, 500, errorMsg);
	}
});

module.exports = router;
