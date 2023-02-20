/* This Source Code Form is subject to the terms of the Mozilla Public
  * License, v. 2.0. If a copy of the MPL was not distributed with this
  * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { log } = require('../log');
const { getConnection } = require('../db');
const Unit = require('../models/Unit');
const { removeAdditionalConversionsAndUnits } = require('../services/graph/handleSuffixUnits');
const validate = require('jsonschema').validate;
const { success, failure } = require('./response');

const router = express.Router();

function formatUnitForResponse(item) {
	return {
		id: item.id, name: item.name, identifier: item.identifier, unitRepresent: item.unitRepresent,
		secInRate: item.secInRate, typeOfUnit: item.typeOfUnit, unitIndex: item.unitIndex, suffix: item.suffix,
		displayable: item.displayable, preferredDisplay: item.preferredDisplay, note: item.note
	};
}

/**
 * Route for getting all units.
 */
router.get('/', async (req, res) => {
	const conn = getConnection();
	try {
		const rows = await Unit.getAll(conn);
		res.json(rows.map(formatUnitForResponse));
	} catch (err) {
		log.error(`Error while performing GET units details query: ${err}`, err);
	}
});

/**
 * Route for POST, edit unit.
 */
router.post('/edit', async (req, res) => {
	const validUnit = {
		type: 'object',
		required: ['id', 'identifier'],
		properties: {
			id: {
				type: 'integer'
			},
			name: {
				type: 'string',
				minLength: 1
			},
			identifier: {
				type: 'string'
			},
			unitRepresent: {
				type: 'string',
				minLength: 1,
				enum: Object.values(Unit.unitRepresentType)
			},
			secInRate: {
				type: 'number',
			},
			typeOfUnit: {
				type: 'string',
				minLength: 1,
				enum: Object.values(Unit.unitType)
			},
			suffix: {
				type: 'string'
			},
			displayable: {
				type: 'string',
				minLength: 1,
				enum: Object.values(Unit.displayableType)
			},
			preferredDisplay: {
				type: 'bool'
			},
			note: {
				type: 'string'
			}
		}
	};

	const validatorResult = validate(req.body, validUnit);
	if (!validatorResult.valid) {
		log.warn(`Got request to edit units with invalid unit data, errors:${validatorResult.errors}`);
		failure(res, 400, 'Validation failed with ' + validatorResult.errors.toString());
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
			await unit.update(conn);
		} catch (err) {
			log.error('Failed to edit unit', err);
			failure(res, 500, 'Unable to edit units ' + err.toString());
		}
		success(res, `Successfully edited units ${req.body.id}`);
	}
});

/**
 * Route for POST add unit.
 */
router.post('/addUnit', async (req, res) => {
	const validUnit = {
		type: 'object',
		required: ['name', 'identifier', 'unitRepresent', 'typeOfUnit', 'displayable', 'preferredDisplay'],
		properties: {
			// Removed id from properties list since it is set to undefined no matter what is passed.
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
			secInRate: {
				type: 'number'
			},
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
			preferredDisplay: {
				type: 'bool'
			},
			note: {
				oneOf: [
					{ type: 'string' },
					{ type: 'null' }
				]
			}
		}
	};
	const validationResult = validate(req.body, validUnit);
	if (!validationResult.valid) {
		log.error(`Invalid input for unitsAPI. ${validationResult.error}`);
		failure(res, 400, 'Validation failed with  ' + validationResult.error.toString());
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
					undefined, // initIndex
					req.body.suffix,
					req.body.displayable,
					req.body.preferredDisplay,
					req.body.note
				);
				await newUnit.insert(t);
			});
			success(res);
		} catch (err) {
			log.error(`Error while inserting new unit ${err}`, err);
			failure(res, 500, err.toString() + ' with detail ' + err['detail']);
		}
	}
});

module.exports = router;
