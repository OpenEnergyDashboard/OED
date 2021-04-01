/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const Map = require('../models/Map');
const { log } = require('../log');
const validate = require('jsonschema').validate;
const { getConnection } = require('../db');
const adminAuthenticator = require('./authenticator').adminAuthMiddleware;
const optionalAuthenticator = require('./authenticator').optionalAuthMiddleware;
const Point = require('../models/Point');
const { isTokenAuthorized } = require('../util/userRoles');
const User = require('../models/User');

const router = express.Router();
router.use(optionalAuthenticator);

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
		mapSource: map.mapSource
	};
	return formattedMap;
}

router.get('/', async (req, res) => {
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
		log.error(`Error while performing GET all maps query: ${err}`, err);
	}
});

router.get('/:map_id', async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['map_id'],
		properties: {
			map_id: {
				type: 'string',
				pattern: '^\\d+$'
			}
		}
	};
	if (!validate(req.params, validParams).valid) {
		res.sendStatus(400);
	} else {
		const conn = getConnection();
		try {
			const map = await Map.getByID(req.params.map_id, conn);
			res.json(formatMapForResponse(map));
		} catch (err) {
			log.error(`Error while performing GET specific map by id query: ${err}`, err);
			res.sendStatus(500);
		}
	}
});

router.post('/create', adminAuthenticator('create maps'), async (req, res) => {
	const validMap = {
		type: 'object',
		required: ['name', 'modifiedDate', 'filename', 'mapSource'],
		properties: {
			name: {
				type: 'string',
				minLength: 1
			},
			filename: {
				type: 'string'
			},
			modifiedDate: {
				type: 'string',
				minLength: 1
			},
			mapSource: {
				type: 'string',
				minLength: 1
			},
			note: {
				oneOf: [
					{ type: 'string' },
					{ type: 'null' }
				]
			},
			displayable: {
				type: 'bool'
			},
			if: {
				properties: {
					origin: {
						type: 'object',
						required: ['latitude', 'longitude'],
						properties: {
							latitude: { type: 'number', minimum: '-90', maximum: '90' },
							longitude: { type: 'number', minimum: '-180', maximum: '180' }
						}
					}
				}
			},
			then: {
				properties: {
					opposite: {
						type: 'object',
						required: ['latitude', 'longitude'],
						properties: {
							latitude: { type: 'number', minimum: '-90', maximum: '90' },
							longitude: { type: 'number', minimum: '-180', maximum: '180' }
						}
					}
				}
			},
			else: {
				properties: {
					opposite: { type: 'null' }
				}
			}
		}
	};
	const validationResult = validate(req.body, validMap);
	if (!validationResult.valid) {
		log.error(`Invalid input for mapAPI. ${validationResult.errors}`);
		res.sendStatus(400);
	} else {
		const conn = getConnection();
		try {
			await conn.tx(async t => {
				const origin = (req.body.origin) ? new Point(req.body.origin.longitude, req.body.origin.latitude) : null;
				const opposite = (req.body.opposite) ? new Point(req.body.opposite.longitude, req.body.opposite.latitude) : null;
				const newMap = new Map(
					undefined,
					req.body.name,
					false,
					req.body.note,
					req.body.filename,
					req.body.modifiedDate,
					origin,
					opposite,
					req.body.mapSource
				);
				await newMap.insert(t);
			});
			res.sendStatus(200);
		} catch (err) {
			if (err.toString() === 'error: duplicate key value violates unique constraint "maps_name_key"') {
				res.status(400).json({ error: `Map "${req.body.name}" is already in use.` });
			} else {
				log.error(`Error while inserting new map ${err}`, err);
				res.sendStatus(500);
			}
		}
	}
});

router.post('/edit', adminAuthenticator('edit maps'), async (req, res) => {
	const validMap = {
		type: 'object',
		required: ['id', 'name', 'modifiedDate', 'filename', 'mapSource', 'displayable', 'note', 'origin', 'opposite'],
		properties: {
			id: {
				type: 'integer',
				minimum: 1
			},
			name: {
				type: 'string',
				minLength: 1
			},
			filename: {
				type: 'string'
			},
			modifiedDate: {
				type: 'string',
				minLength: 1
			},
			mapSource: {
				type: 'string',
				minLength: 1
			},
			note: {
				oneOf: [
					{ type: 'string' },
					{ type: 'null' }
				]
			},
			displayable: {
				type: 'bool'
			},
			if: {
				properties: {
					origin: {
						type: 'object',
						required: ['latitude', 'longitude'],
						properties: {
							latitude: { type: 'number', minimum: '-90', maximum: '90' },
							longitude: { type: 'number', minimum: '-180', maximum: '180' }
						}
					}
				}
			},
			then: {
				properties: {
					opposite: {
						type: 'object',
						required: ['latitude', 'longitude'],
						properties: {
							latitude: { type: 'number', minimum: '-90', maximum: '90' },
							longitude: { type: 'number', minimum: '-180', maximum: '180' }
						}
					}
				}
			},
			else: {
				properties: {
					opposite: { type: 'null' }
				}
			}
		}
	};
	const validatorResult = validate(req.body, validMap);
	if (!validatorResult.valid) {
		log.error(`Invalid map data supplied, err: ${validatorResult.errors}`);
		res.status(400);
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
					req.body.mapSource
				);
				await editedMap.update(t);
			});
			res.sendStatus(200);
			log.info(`Successfully edited map ${req.body.id}`);
		} catch (err) {
			if (err.toString() === 'error: duplicate key value violates unique constraint "maps_name_key"') {
				res.sendStatus(400);
				log.error(`Map "${req.body.name}" is already in use.`);
			} else {
				log.error(`Error while updating map ${err}`, err);
				res.sendStatus(500);
			}
		}
	}
});

router.post('/delete', adminAuthenticator('delete maps'), async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['id'],
		properties: {
			id: { type: 'integer' }
		}
	};
	if (!validate(req.body, validParams).valid) {
		res.sendStatus(400);
	} else {
		const conn = getConnection();
		try {
			await Map.delete(req.body.id, conn);
			res.sendStatus(200);
		} catch (err) {
			log.error(`Error while deleting group ${err}`, err);
			res.sendStatus(500);
		}
	}
});

module.exports = router;
