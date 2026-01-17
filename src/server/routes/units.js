/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { adminAuthMiddleware, optionalAuthMiddleware } = require('./authenticator');
const { log } = require('../log');
const { getConnection } = require('../db');
const Unit = require('../models/Unit');
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
			for (const key of Object.keys(unit)) {
				if (Object.hasOwn(req.body, key)) {
					unit[key] = req.body[key]
				}
			}
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
		const errorMsg = `Got request to delete a unit with invalid data, error(s):  ${validatorResult.errors}`;
		log.warn(errorMsg);
		failure(res, 400, errorMsg);
	} else {
		const conn = getConnection();
		const unitId = req.body.id;
		try {
			// Don't worry about checking if the unit already exists
			// Just try to delete it to save the extra database call, since the database will return an error anyway if the row does not exist
			await Unit.delete(unitId, conn);
			success(res, 'Successfully deleted unit');
		} catch (err) {
			const errorMsg = `Error while deleting unit with error(s): ${err}`;
			log.error(errorMsg);
			failure(res, 500, errorMsg);
		}
	}
});

module.exports = router;
