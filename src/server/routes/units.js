/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { adminAuthMiddleware, optionalAuthMiddleware } = require('./authenticator');
const { getConnection } = require('../db');
const Unit = require('../models/Unit');
const { removeAdditionalConversionsAndUnits } = require('../services/graph/handleSuffixUnits');
const validate = require('jsonschema').validate;
const { success, failure, LogLevel } = require('./response');
const { HTTP_CODES } = require('../util/httpCodes');
const { STRING_GENERAL_MAX_LENGTH, STRING_SHORT_MAX_LENGTH } = require('../util/validationConstants');
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
 * Validates the body of a unit create/edit request.
 * isEdit=true includes the required 'id' property (edit, since the client must tell us which unit to
 * update); isEdit=false excludes it (create, since id is assigned by the DB on insert).
 * @param params req.body for a unit create or edit request
 * @param isEdit whether this is validating an edit (true) or create (false) request
 * @returns {{valid: boolean, errors: array}}
 */
function validateUnitsParams(params, isEdit = true) {
	const properties = {
		name: {
			type: 'string',
			minLength: 1,
			maxLength: STRING_SHORT_MAX_LENGTH
		},
		identifier: {
			type: 'string',
			minLength: 1,
			maxLength: STRING_SHORT_MAX_LENGTH
		},
		unitRepresent: {
			type: 'string',
			minLength: 1,
			maxLength: STRING_SHORT_MAX_LENGTH,
			enum: Object.values(Unit.unitRepresentType)
		},
		secInRate: { type: 'number', minimum: 0 },
		typeOfUnit: {
			type: 'string',
			minLength: 1,
			maxLength: STRING_SHORT_MAX_LENGTH,
			enum: Object.values(Unit.unitType)
		},
		suffix: {
			oneOf: [
				{ type: 'string', maxLength: STRING_SHORT_MAX_LENGTH },
				{ type: 'null' }
			]
		},
		displayable: {
			type: 'string',
			minLength: 1,
			maxLength: STRING_SHORT_MAX_LENGTH,
			enum: Object.values(Unit.displayableType)
		},
		preferredDisplay: { type: 'boolean' },
		note: {
			oneOf: [
				{ type: 'string', maxLength: STRING_GENERAL_MAX_LENGTH },
				{ type: 'null' }
			]
		},
		minVal: { type: 'number' },
		maxVal: { type: 'number' },
		disableChecks: {
			type: 'string',
			minLength: 1,
			maxLength: STRING_SHORT_MAX_LENGTH,
			enum: Object.values(Unit.disableChecksType)
		}
	};
 
	// TODO Consider updating once decide exactly what want.
	// required: ['id', 'name', 'identifier', 'unitRepresent', 'secInRate', 'typeOfUnit', 'suffix'],
	const required = ['identifier'];
 
	if (isEdit) {
		properties.id = { type: 'integer', minimum: 1 };
		required.push('id');
	} else {
		required.push('name', 'unitRepresent', 'typeOfUnit', 'displayable', 'preferredDisplay', 'minVal', 'maxVal', 'disableChecks');
	}
 
	const validUnit = {
		type: 'object',
		additionalProperties: false,
		required,
		properties
	};
	const validatorResult = validate(params, validUnit);
	return { valid: validatorResult.valid, errors: validatorResult.errors };
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
		failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Error fetching units: ${err.message}`, { cause: err }));
	}
});

/**
 * Route for editing a unit by ID.
 */
router.post('/edit', adminAuthMiddleware('edit units'), async (req, res) => {
	// isEdit=true: id is required here since the client must tell us which unit to update.
	const validatorResult = validateUnitsParams(req.body, true);

	if (!validatorResult.valid) {
		const message = `Got request to edit units with invalid unit data, errors: ${validatorResult.errors}`;
		failure(res, HTTP_CODES.BAD_REQUEST, message, message, LogLevel.WARN);
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
			failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Failed to update unit: ${err.message}`, { cause: err }));
		}
	}
});

/**
 * Route for creating a new unit.
 */
router.post('/addUnit', adminAuthMiddleware('add units'), async (req, res) => {
	// isEdit=false: id must not be present, since it's assigned by the DB on insert.
	const validationResult = validateUnitsParams(req.body, false);

	if (!validationResult.valid) {
		const message = `Got request to add units with invalid unit data, errors: ${validationResult.errors}`;
		failure(res, HTTP_CODES.BAD_REQUEST, message, message);
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
			failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Error while inserting new unit: ${err.message}`, { cause: err }));
		}
	}
});

/**
 * Route for deleting a unit by ID.
 */
router.post('/delete', adminAuthMiddleware('delete units'), async (req, res) => {
	const validParams = {
		type: 'object',
		additionalProperties: false,
		maxProperties: 1,
		required: ['id'],
		properties: { id: { type: 'integer', minimum: 1 } }
	};
	// Ensure delete request is valid
	const validatorResult = validate(req.body, validParams);
	if (!validatorResult.valid) {
		const message = `Got request to delete a unit with invalid data, error(s):  ${validatorResult.errors}`;
		failure(res, HTTP_CODES.BAD_REQUEST, message, message, LogLevel.WARN);
	} else {
		const conn = getConnection();
		const unitId = req.body.id;
		try {
			// Don't worry about checking if the unit already exists
			// Just try to delete it to save the extra database call, since the database will return an error anyway if the row does not exist
			await Unit.delete(unitId, conn);
			success(res, 'Successfully deleted unit');
		} catch (err) {
			failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Error while deleting unit with error(s): ${err.message}`, { cause: err }));
		}
	}
});

module.exports = router;
