/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
const express = require('express');
const { log } = require('../log');
const { getConnection } = require('../db');
const ConversionSegment = require('../models/ConversionSegment');
const { success, failure } = require('./response');
const validate = require('jsonschema').validate;
const { adminAuthMiddleware } = require('./authenticator');

const router = express.Router();

function formatConversionSegmentForResponse(item) {
	return {
		sourceId: item.sourceId, 
		destinationId: item.destinationId, 
		weekPatternsId: item.weekPatternsId, 
		slope: item.slope, 
		intercept: item.intercept, 
		startTime: item.startTime, 
		endTime: item.endTime, 
		note: item.note
	};
}

/**
 * Route for getting all conversion segments.
 */
router.get('/', adminAuthMiddleware('get all conversion segments'), async (req, res) => {
	const conn = getConnection();
	try {
		const rows = await ConversionSegment.getAll(conn);
		res.json(rows.map(formatConversionSegmentForResponse));
	} catch (err) {
		log.error(`Error while performing GET conversion segments details query: ${err}`);
	}
});

/**
 * GET information for conversion segment(s) by source and destination
 * @param {int} sourceId
 * @param {int} destinationId
 */
router.post('/segments', adminAuthMiddleware('get conversion segment(s) by source and destination id'), async (req, res) => {
	const validConversionSegment = {
		type: 'object',
		maxProperties: 2,
		required: ['sourceId', 'destinationId'],
		properties: {
			sourceId: { 
				type: 'integer', 
				minimum: 0
			},
			destinationId: { 
				type: 'integer', 
				minimum: 0
			}
		}
	};

	const validatorResult = validate(req.body, validConversionSegment);

	if (!validatorResult.valid) {
		log.warn(`Invalid route parameters for conversion segment, errors: ${validatorResult.errors}`);
		failure(res, 400, `Invalid route parameters for conversion segment, errors: ${validatorResult.errors}`);
	} else {
		const conn = getConnection();
		try {
			const rows = await ConversionSegment.getBySourceDestination(
				req.body.sourceId, 
				req.body.destinationId, 
				conn
			);
			res.json(rows);
		} catch (err) {
			log.error(`Error while preforming GET on conversion segment : ${err}`, err);
			res.sendStatus(500);
		}
	}
});

/**
 * GET information for a specific conversion segment by source, destination, start time, and end time
 * @param {int} sourceId
 * @param {int} destinationId
 * @param {time} startTime
 * @param {time} endTime
 */
router.post('/segment', adminAuthMiddleware('get conversion segment by source id, destination id, start time, and end time'), async (req, res) => {
	const validConversionSegment = {
		type: 'object',
		maxProperties: 4,
		required: ['sourceId', 'destinationId', 'startTime', 'endTime'],
		properties: {
			sourceId: { 
				type: 'integer', 
				minimum: 0
			},
			destinationId: { 
				type: 'integer', 
				minimum: 0
			},
			startTime: { 
				type: 'string' 
			},
			endTime: {
				type: 'string'
			}
		}
	};

	const validatorResult = validate(req.body, validConversionSegment);

	if (!validatorResult.valid) {
		log.warn(`Invalid route parameters for conversion segment, errors: ${validatorResult.errors}`);
		failure(res, 400, `Invalid route parameters for conversion segment, errors: ${validatorResult.errors}`);
	} else {
		const conn = getConnection();
		try {
			const row = await ConversionSegment.getBySourceDestinationStartEnd(
				req.body.sourceId, 
				req.body.destinationId, 
				req.body.startTime, 
				req.body.endTime,
				conn
			);
			if (!row || row.length === 0) {
				return res.sendStatus(404);
			}
			res.json(row);
		} catch (err) {
			log.error(`Error while preforming GET on conversion segment : ${err}`, err);
			res.sendStatus(500);
		}
	}
});

/**
 * Route for POST add conversion segment.
 */
router.post('/add', adminAuthMiddleware('add conversion segment'), async (req, res) => {
	const validConversionSegment = {
		type: 'object',
		maxProperties: 8,
		required: ['sourceId', 'destinationId', 'slope', 'intercept', 'startTime', 'endTime'],
		properties: {
			sourceId: {
				type: 'integer',
				minimum: 0
			},
			destinationId: {
				type: 'integer',
				minimum: 0
			},
			weekPatternsId: {
				oneOf: [
					{type: 'integer', minimum: 0},
					{type: 'null'}
				]
			},
			slope: {
				type: 'number'
			},
			intercept: {
				type: 'number'
			},
			startTime: {
				type: 'string'
			},
			endTime: {
				type: 'string'
			},
			note: {
				oneOf: [
					{type: 'string'},
					{type: 'null'}
				]
			}
		}
	};
	
	const validatorResult = validate(req.body, validConversionSegment);
	if (!validatorResult.valid) {
		log.warn(`Got request to add conversion segments with invalid conversion segment data, errors: ${validatorResult.errors}`);
		failure(res, 400, `Got request to add conversion segments with invalid conversion segment data, errors: ${validatorResult.errors}`);
	} else {
		const conn = getConnection();
		try {
			await conn.tx(async t => {
				const newConversionSegment = new ConversionSegment(
					req.body.sourceId, 
					req.body.destinationId, 
					req.body.weekPatternsId, 
					req.body.slope, 
					req.body.intercept, 
					req.body.startTime, 
					req.body.endTime, 
					req.body.note
				);
				await newConversionSegment.insert(t);
			});
			success(res, `Successfully added conversion segment`);
		} catch (err) {
			log.error(`Error while inserting new conversion segment with error(s): ${err}`);
			failure(res, 500, `Error while inserting new conversion segment with errors(s): ${err}`);
		}
	}
});

/**
 * Route for POST, edit conversion segment.
 */
router.post('/edit', adminAuthMiddleware('edit conversion segment'), async (req, res) => {
	const validConversionSegment = {
		type: 'object',
		maxProperties: 10,
		required: ['sourceId', 'destinationId', 'slope', 'intercept', 'startTime', 'endTime', 'originalStartTime', 'originalEndTime'],
		properties: {
			sourceId: {
				type: 'integer',
				minimum: 0
			},
			destinationId: {
				type: 'integer',
				minimum: 0
			},
			weekPatternsId: {
				oneOf: [
					{type: 'integer', minimum: 0},
					{type: 'null'}
				]
			},
			slope: {
				type: 'number'
			},
			intercept: {
				type: 'number'
			},
			startTime: {
				type: 'string'
			},
			endTime: {
				type: 'string'
			},
			note: {
				oneOf: [
					{type: 'string'},
					{type: 'null'}
				]
			},
			originalStartTime: {
				oneOf: [
					{type: 'string'},
					{type: 'null'}
				]
			},
			originalEndTime: {
				oneOf: [
					{type: 'string'},
					{type: 'null'}
				]
			}
		}
	};

	const validatorResult = validate(req.body, validConversionSegment);
	if (!validatorResult.valid) {
		log.warn(`Got request to edit conversion segments with invalid conversion segment data, errors: ${validatorResult.errors}`);
		failure(res, 400, `Got request to edit conversion segments with invalid conversion segment data, errors: ${validatorResult.errors}`);
	} else {
		const conn = getConnection();
		try {
			const updatedConversionSegment = new ConversionSegment(
				req.body.sourceId, 
				req.body.destinationId, 
				req.body.weekPatternsId, 
				req.body.slope, 
				req.body.intercept, 
				req.body.startTime, 
				req.body.endTime, 
				req.body.note
			);
			await updatedConversionSegment.update(
				req.body.originalStartTime, 
				req.body.originalEndTime, 
				conn);
			success(res, `Successfully updated Conversion segment`);
		} catch (err) {
			log.error(`Error while editing conversion segment with error(s): ${err}`);
			failure(res, 500, `Error while editing conversion segment with error(s): ${err}`);
		}
	}
});

/**
 * Route for POST, delete conversion segment
 */
router.post('/delete', adminAuthMiddleware('delete conversion segment'), async (req, res) => {
	const validConversionSegment = {
		type: 'object',
		maxProperties: 4,
		required: ['sourceId', 'destinationId', 'startTime', 'endTime'],
		properties: {
			sourceId: {
				type: 'integer',
				minimum: 0
			},
			destinationId: {
				type: 'integer',
				minimum: 0
			},
			startTime: {
				type: 'string'
			},
			endTime: {
				type: 'string'
			}
		}
	};
	// Ensure conversion segment object is valid
	const validatorResult = validate(req.body, validConversionSegment);
	if (!validatorResult.valid) {
		log.warn(`Got request to delete conversion segments with invalid conversion segment data, errors: ${validatorResult.errors}`);
		failure(res, 400, `Got request to delete conversion segments with invalid conversion segment data. Error(s): ${validatorResult.errors}`);
	} else {
		const conn = getConnection();
		try {
			// Don't worry about checking if the conversion segment already exists
			// Just try to delete it to save the extra database call, since the database will return an error anyway if the row does not exist
			await ConversionSegment.delete(
				req.body.sourceId, 
				req.body.destinationId, 
				req.body.startTime,
				req.body.endTime,
				conn
			);
			success(res, 'Successfully deleted conversion segment');
		} catch (err) {
			log.error(`Error while deleting conversion segment with error(s): ${err}`);
			failure(res, 500, `Error while deleting conversion segment with errors(s): ${err}`);
		}
	}
});


module.exports = router;