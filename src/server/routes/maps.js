/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { Map } = require('../models/Map');
const { log } = require('../log');
const validate = require('jsonschema').validate;
const { getConnection } = require('../db');
const { adminAuthMiddleware, optionalAuthMiddleware } = require('./authenticator');
const Point = require('../models/Point');
const { isTokenAuthorized } = require('../util/userRoles');
const User = require('../models/User');
const { DEFAULT_CIRCLE_SIZE } = require('../models/Map');
const { STRING_GENERAL_MAX_LENGTH, STRING_SHORT_MAX_LENGTH: SHORT_STRING_MAX_LENGTH, NUMERIC_ID_MAX_LENGTH } = require('../util/validationConstants');
const { HTTP_CODES } = require('../util/httpCodes');
const { isValidIsoDateTime } = require('../util/timeValidation');
const omit = require('lodash/omit');
const { success, failure, LogLevel } = require('./response');

const router = express.Router();

function formatMapForResponse(map) {
	const formattedMap = {
		id: map.id,
		name: map.name,
		displayable: map.displayable,
		note: map.note,
		filename: map.filename,
		modifiedDate: map.modifiedDate,
		origin: map.origin,
		opposite: map.opposite,
		mapSource: map.mapSource,
		northAngle: map.northAngle,
		circleSize: map.circleSize
	};
	return formattedMap;
}

/**
 * Validates the body of a map create/edit request.
 * isEdit=true includes the required 'id' property, along with 'displayable', 'note', 'origin', and
 * 'opposite' as required (edit); isEdit=false excludes them (create), since id is assigned by the DB
 * on insert and the others are not needed to create the initial map entry.
 * @param params req.body for a map create or edit request
 * @param isEdit whether this is validating an edit (true) or create (false) request
 * @returns {{valid: boolean, errors: array}}
 */
function validateMapsParams(params, isEdit = true) {
	const properties = {
		name: {
			type: 'string',
			minLength: 1,
			maxLength: SHORT_STRING_MAX_LENGTH
		},
		filename: {
			type: 'string',
			maxLength: 500
		},
		modifiedDate: {
			type: 'string',
			minLength: 1,
			maxLength: STRING_GENERAL_MAX_LENGTH
		},
		mapSource: {
			type: 'string',
			minLength: 1,
			// TODO This is a very long string that encodes the actual map. It is unclear the exact maximum
			// size so it is not clear this is the correct value.
			maxLength: 100000
		},
		note: {
			oneOf: [
				{ type: 'string', maxLength: STRING_GENERAL_MAX_LENGTH },
				{ type: 'null' }
			]
		},
		displayable: {
			type: 'boolean'
		},
		northAngle: {
			type: 'number',
			minimum: 0,
			maximum: 360
		},
		circleSize: {
			type: 'number',
			// The UI limits 0:2 so do that here.
			minimum: 0,
			maximum: 2
		},
		origin: {
			oneOf: [
				{
					type: 'object',
					additionalProperties: false,
					required: ['latitude', 'longitude'],
					properties: {
						latitude: { type: 'number', minimum: -90, maximum: 90 },
						longitude: { type: 'number', minimum: -180, maximum: 180 },
						// TODO For unknown reasons, map edit is sending this.
						rawType: {type: 'boolean'}
					}
				},
				{ type: 'null' }
			]
		},
		opposite: {
			oneOf: [
				{
					type: 'object',
					additionalProperties: false,
					required: ['latitude', 'longitude'],
					properties: {
						latitude: { type: 'number', minimum: -90, maximum: 90 },
						longitude: { type: 'number', minimum: -180, maximum: 180 },
						// TODO For unknown reasons, map edit is sending this.
						rawType: {type: 'boolean'}
					}
				},
				{ type: 'null' }
			]
		}
	};

	const required = ['name', 'modifiedDate', 'filename', 'mapSource'];

	if (isEdit) {
		properties.id = {
			type: 'integer',
			minimum: 1,
			maximum: 2147483647
		};
		required.push('id', 'displayable', 'note', 'origin', 'opposite');
	}

	const validMap = {
		type: 'object',
		additionalProperties: false,
		required,
		properties
	};
	const validatorResult = validate(params, validMap);
	return { valid: validatorResult.valid, errors: validatorResult.errors };
}

router.get('/', optionalAuthMiddleware, async (req, res) => {
	try {
		const conn = getConnection();
		let query;
		const token = req.headers.token || req.body.token || req.query.token;
		if (req.hasValidAuthToken && (await isTokenAuthorized(token, User.role.ADMIN))) {
			query = Map.getAll; // only admins can see disabled maps;
		} else {
			query = Map.getDisplayable;
		}
		const rows = await query(conn);
		res.json(rows.map(row => formatMapForResponse(row)));
	} catch (err) {
		failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Error while performing GET all maps query: ${err.message}`, { cause: err }));
	}
});

router.get('/:map_id', optionalAuthMiddleware, async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['map_id'],
		properties: {
			map_id: {
				type: 'string',
				maxLength: NUMERIC_ID_MAX_LENGTH,
				pattern: '^\\d+$'
			}
		}
	};
	if (!validate(req.params, validParams).valid) {
		failure(res, HTTP_CODES.BAD_REQUEST);
	} else {
		const conn = getConnection();
		try {
			const map = await Map.getByID(req.params.map_id, conn);
			res.json(formatMapForResponse(map));
		} catch (err) {
			failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Error while performing GET specific map by id query: ${err.message}`, { cause: err }));
		}
	}
});

router.post('/create', adminAuthMiddleware('create maps'), async (req, res) => {
	// TODO This is a temporary fix because create is sending additional values that are not really
	// needed: id, calibrationMode, image, calibrationSet, calibrationResult.
	// The UI should let the admin set the note but dummy up here for now.
	// It is assumed this will be fixed in the map PR 1314 or soon after that.
	req.body.note = '';
	req.body = omit(req.body, 'id', 'calibrationMode', 'image', 'calibrationSet', 'calibrationResult');

	// isEdit=false: id must not be present, since it's assigned by the DB on insert.
	const validationResult = validateMapsParams(req.body, false);
	// TODO It is uncertain if the date has a timezone since map creation was not working when that was tested.
	// This is a comment so if if fails someone knows to see if the second parameter should be false. If it works
	// then this can be removed.
	if (!validationResult.valid || !isValidIsoDateTime(req.body.modifiedDate)) {
		failure(res, HTTP_CODES.BAD_REQUEST, `Invalid input for mapAPI. ${validationResult.errors}`);
	} else {
		const conn = getConnection();
		try {
			await conn.tx(async t => {
				const origin = (req.body.origin) ? new Point(req.body.origin.longitude, req.body.origin.latitude) : null;
				const opposite = (req.body.opposite) ? new Point(req.body.opposite.longitude, req.body.opposite.latitude) : null;
				// Use default value for optional circleSize field
				const circleSize = (req.body.circleSize) ? req.body.circleSize : DEFAULT_CIRCLE_SIZE;
				const newMap = new Map(
					undefined,
					req.body.name,
					// TODO req.body had displayable but it is not used. Unclear if user should be allowed to set this when created.
					false,
					req.body.note,
					req.body.filename,
					req.body.modifiedDate,
					origin,
					opposite,
					req.body.mapSource,
					req.body.northAngle,
					circleSize
				);
				await newMap.insert(t);
			});
			success(res);
		} catch (err) {
			if (err.toString() === 'error: duplicate key value violates unique constraint "maps_name_key"') {
				failure(res, HTTP_CODES.BAD_REQUEST, err, { error: `Map "${req.body.name}" is already in use.` }, LogLevel.SILENT);
			} else {
				failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Error while inserting new map: ${err.message}`, { cause: err }));
			}
		}
	}
});

router.post('/edit', adminAuthMiddleware('edit maps'), async (req, res) => {
	// TODO This is a temporary fix because edit is sending additional values that are not really
	// needed: calibrationMode, image, calibrationSet, calibrationResult.
	// It is assumed this will be fixed in the map PR 1314 or soon after that.
	req.body = omit(req.body, 'calibrationMode', 'image', 'calibrationSet', 'calibrationResult');
	// isEdit=true: id is required here since the client must tell us which map to update.
	const validatorResult = validateMapsParams(req.body, true);

	// TODO edit, unlike create, is not currently sending a time zone with the modifiedDate. It is unclear
	// why they differ but for now don't require it here.
	if (!validatorResult.valid || !isValidIsoDateTime(req.body.modifiedDate, false)) {
		failure(res, HTTP_CODES.BAD_REQUEST, `Invalid map data supplied, err: ${validatorResult.errors}`);
	} else {
		const conn = getConnection();
		try {
			await conn.tx(async t => {
				const origin = (req.body.origin) ? new Point(req.body.origin.longitude, req.body.origin.latitude) : null;
				const opposite = (req.body.opposite) ? new Point(req.body.opposite.longitude, req.body.opposite.latitude) : null;
				const editedMap = new Map(
					req.body.id,
					req.body.name,
					req.body.displayable,
					req.body.note,
					req.body.filename,
					req.body.modifiedDate,
					origin,
					opposite,
					req.body.mapSource,
					req.body.northAngle,
					req.body.circleSize
				);
				await editedMap.update(t);
			});
			success(res);
			log.info(`Successfully edited map ${req.body.id}`);
		} catch (err) {
			if (err.toString() === 'error: duplicate key value violates unique constraint "maps_name_key"') {
				failure(res, HTTP_CODES.BAD_REQUEST, `Map "${req.body.name}" is already in use.`);
			} else {
				failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Error while updating map: ${err.message}`, { cause: err }));
			}
		}
	}
});

router.post('/delete', adminAuthMiddleware('delete maps'), async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['id'],
		properties: {
			id: {
				type: 'integer',
				minimum: 1,
				maximum: 2147483647
			}
		}
	};
	if (!validate(req.body, validParams).valid) {
		failure(res, HTTP_CODES.BAD_REQUEST);
	} else {
		const conn = getConnection();
		try {
			await Map.delete(req.body.id, conn);
			success(res);
		} catch (err) {
			failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Error while deleting map: ${err.message}`, { cause: err }));
		}
	}
});

module.exports = router;
