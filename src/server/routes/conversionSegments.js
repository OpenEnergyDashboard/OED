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
const { momentToIsoOrInfinity } = require('../util/handleTimestampValues');

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
 * POST get all conversion segment(s) by source id and destination id.
 * @param {int} sourceId The source meter's id.
 * @param {int} destinationId The destination meter's id.
 */
router.post('/sourceDestination', adminAuthMiddleware('get conversion segment(s) by source and destination id'), async (req, res) => {
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
		const errMsg = `Got request to retrieve conversion segment(s) by source id and destination id with invalid data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			const rows = await ConversionSegment.getBySourceDestination(
				req.body.sourceId, 
				req.body.destinationId, 
				conn
			);
			res.json(rows.map(formatConversionSegmentForResponse));
		} catch (err) {
			const errMsg = `Error while retrieving conversion segment by source id and destination id with error(s): ${err}`
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

/**
 * POST get a conversion segment by source id, destination id, start time, and end time.
 * @param {int} sourceId The source meter's id.
 * @param {int} destinationId The destination meter's id.
 * @param {string} startTime The start time of the conversion segment.
 * @param {string} endTime The end time of the conversion segment.
 */
router.post('/sourceDestinationStartEnd', adminAuthMiddleware('get conversion segment by source id, destination id, start time, and end time'), async (req, res) => {
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
		const errMsg = `Got request to retrieve a conversion segment by source id, destination id, start time, and end time with invalid data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			const row = await ConversionSegment.getBySourceDestinationStartEnd(
				req.body.sourceId, 
				req.body.destinationId, 
				momentToIsoOrInfinity(req.body.startTime),
				momentToIsoOrInfinity(req.body.endTime),
				conn
			);
			res.json(formatConversionSegmentForResponse(row));
		} catch (err) {
			const errMsg = `Error while retrieving conversion segment by source id, destination id, start time, and end time with error(s): ${err}`
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

/**
 * POST add conversion segment.
 * @param {int} sourceId The source meter's id.
 * @param {int} destinationId The destination meter's id.
 * @param {int} weekPatternsId The id of the weekly pattern.
 * @param {number} slope The slope for the conversion segment.
 * @param {number} intercept The intercept for the conversion segment.
 * @param {string} startTime The start time of the conversion segment.
 * @param {string} endTime The end time of the conversion segment.
 * @param {string} note Notes added by the admin for the conversion segment.
 */
router.post('/addConversionSegment', adminAuthMiddleware('add conversion segment'), async (req, res) => {
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
		const errMsg = `Got request to add a conversion segment with invalid conversion segment data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			const newConversionSegment = new ConversionSegment(
				req.body.sourceId, 
				req.body.destinationId, 
				req.body.weekPatternsId, 
				req.body.slope, 
				req.body.intercept, 
				momentToIsoOrInfinity(req.body.startTime),
				momentToIsoOrInfinity(req.body.endTime),
				req.body.note
			);
			await newConversionSegment.insert(conn);
			success(res, `Successfully added conversion segment`);
		} catch (err) {
			const errMsg = `Error adding conversion segment with error(s): ${err}`
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

/**
 * POST split a segment in two, the earlier segment uses the new slope/intercept/pattern/note.
 * @param {int} sourceId The source meter's id.
 * @param {int} destinationId The destination meter's id.
 * @param {string} startTime The start time of the conversion segment.
 * @param {string} endTime The end time of the conversion segment.
 * @param {int} newWeekPatternsId The id of the weekly pattern for the new conversion segment.
 * @param {number} newSlope The slope for the new conversion segment.
 * @param {number} newIntercept The intercept for the new conversion segment.
 * @param {string} newNote Notes added by the admin for the new conversion segment.
 * @param {string} splitTime The time to split the segment at.
 */
router.post('/splitEarlier', adminAuthMiddleware('split earlier conversion segment'), async (req, res) => {
	const validConversionSegment = {
		type: 'object',
		maxProperties: 9,
		required: ['sourceId', 'destinationId', 'startTime', 'endTime', 'newSlope', 'newIntercept', 'splitTime',],
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
			},
			newWeekPatternsId: {
				oneOf: [
					{ type: 'integer' },
					{ type: 'null' }
				]
			},
			newSlope: {
				type: 'number'
			},
			newIntercept: {
				type: 'number'
			},
			newNote: {
				oneOf: [
					{type: 'string'},
					{type: 'null'}
				]
			},
			splitTime: {
				type: 'string'
			}
		}
	};
	
	const validatorResult = validate(req.body, validConversionSegment);
	if (!validatorResult.valid) {
		const errMsg = `Got request to split a conversion segment earlier with invalid conversion segment data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			const earlierSegment = new ConversionSegment(
				req.body.sourceId, 
				req.body.destinationId,
				req.body.newWeekPatternsId === -99 ? null : req.body.newWeekPatternsId,
				req.body.newSlope,
				req.body.newIntercept,
				momentToIsoOrInfinity(req.body.startTime),
				momentToIsoOrInfinity(req.body.splitTime),
				req.body.newNote
			);
			await earlierSegment.splitEarlier(
				momentToIsoOrInfinity(req.body.startTime),
				momentToIsoOrInfinity(req.body.endTime),
				momentToIsoOrInfinity(req.body.splitTime),
				conn
			);
			success(res, `Successfully split conversion segment earlier`);
		} catch (err) {
			const errMsg = `Error splitting conversion segment earlier with error(s): ${err}`
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

/**
 * POST split a segment in two, the later segment uses the new slope/intercept/pattern/note.
 * @param {int} sourceId The source meter's id.
 * @param {int} destinationId The destination meter's id.
 * @param {string} startTime The start time of the conversion segment.
 * @param {string} endTime The end time of the conversion segment.
 * @param {int} newWeekPatternsId The id of the weekly pattern for the new conversion segment.
 * @param {number} newSlope The slope for the new conversion segment.
 * @param {number} newIntercept The intercept for the new conversion segment.
 * @param {string} newNote Notes added by the admin for the new conversion segment.
 * @param {string} splitTime The time to split the segment at.
 */
router.post('/splitLater', adminAuthMiddleware('split later conversion segment'), async (req, res) => {
	const validConversionSegment = {
		type: 'object',
		maxProperties: 9,
		required: ['sourceId', 'destinationId', 'startTime', 'endTime', 'newSlope', 'newIntercept', 'splitTime',],
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
			},
			newWeekPatternsId: {
				oneOf: [
					{ type: 'integer' },
					{ type: 'null' }
				]
			},
			newSlope: {
				type: 'number'
			},
			newIntercept: {
				type: 'number'
			},
			newNote: {
				oneOf: [
					{type: 'string'},
					{type: 'null'}
				]
			},
			splitTime: {
				type: 'string'
			}
		}
	};
	
	const validatorResult = validate(req.body, validConversionSegment);
	if (!validatorResult.valid) {
		const errMsg = `Got request to split a conversion segment later with invalid conversion segment data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			const laterSegment = new ConversionSegment(
				req.body.sourceId, 
				req.body.destinationId,
				req.body.newWeekPatternsId === -99 ? null : req.body.newWeekPatternsId,
				req.body.newSlope,
				req.body.newIntercept,
				momentToIsoOrInfinity(req.body.splitTime),
				momentToIsoOrInfinity(req.body.endTime),
				req.body.newNote
			);
			await laterSegment.splitLater(
				momentToIsoOrInfinity(req.body.startTime),
				momentToIsoOrInfinity(req.body.endTime),
				momentToIsoOrInfinity(req.body.splitTime),
				conn
			);
			success(res, `Successfully split conversion segment later`);
		} catch (err) {
			const errMsg = `Error splitting conversion segment later with error(s): ${err}`
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

/**
 * POST edit conversion segment.
 * @param {int} sourceId The source meter's id.
 * @param {int} destinationId The destination meter's id.
 * @param {int} weekPatternsId The id of the weekly pattern.
 * @param {number} slope The new slope for the conversion segment.
 * @param {number} intercept The new intercept for the conversion segment.
 * @param {string} startTime The new start time of the conversion segment.
 * @param {string} endTime The new end time of the conversion segment.
 * @param {string} note The new note added by the admin for the conversion segment.
 * @param {string} originalStartTime The start time of the conversion segment before it is edited.
 * @param {string} originalEndTime The end time of the conversion segment before it is edited.
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
					{ type: 'integer' },
					{ type: 'null' }
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
				type: 'string'
			},
			originalEndTime: {
				type: 'string'
			}
		}
	};

	const validatorResult = validate(req.body, validConversionSegment);
	if (!validatorResult.valid) {
		const errMsg = `Got request to edit a conversion segment with invalid conversion segment data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			const updatedConversionSegment = new ConversionSegment(
				req.body.sourceId, 
				req.body.destinationId, 
				req.body.weekPatternsId === -99 ? null : req.body.weekPatternsId,
				req.body.slope, 
				req.body.intercept, 
				momentToIsoOrInfinity(req.body.startTime),
				momentToIsoOrInfinity(req.body.endTime),
				req.body.note
			);
			await updatedConversionSegment.update(
				momentToIsoOrInfinity(req.body.originalStartTime),
				momentToIsoOrInfinity(req.body.originalEndTime),
				conn
			);
			success(res, `Successfully edited conversion segment`);
		} catch (err) {
			const errMsg = `Error while editing conversion segment with error(s): ${err}`
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

/**
 * POST delete conversion segment.
 * @param {int} sourceId The source meter's id.
 * @param {int} destinationId The destination meter's id.
 * @param {string} startTime The new start time of the conversion segment.
 * @param {string} endTime The new end time of the conversion segment.
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
		const errMsg = `Got request to delete a conversion segment with invalid conversion segment data, error(s): ${validatorResult.errors}`
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			// Don't worry about checking if the conversion segment already exists
			// Just try to delete it to save the extra database call, since the database will return an error anyway if the row does not exist
			await ConversionSegment.delete(
				req.body.sourceId, 
				req.body.destinationId, 
				momentToIsoOrInfinity(req.body.startTime),
				momentToIsoOrInfinity(req.body.endTime),
				conn
			);
			success(res, 'Successfully deleted conversion segment');
		} catch (err) {
			const errMsg = `Error while deleting conversion segment with error(s): ${err}`
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

/**
 * POST delete conversion segment after updating the end time of the previous segment to the end time of the deleted segment.
 * @param {int} sourceId The source meter's id.
 * @param {int} destinationId The destination meter's id.
 * @param {string} startTime The new start time of the conversion segment.
 * @param {string} endTime The new end time of the conversion segment.
 */
router.post('/deleteEarlier', adminAuthMiddleware('delete earlier conversion segment'), async (req, res) => {
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
		const errMsg = `Got request to delete earlier conversion segment with invalid conversion segment data, error(s): ${validatorResult.errors}`
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			// Don't worry about checking if the conversion segment already exists
			// Just try to delete it to save the extra database call, since the database will return an error anyway if the row does not exist
			await ConversionSegment.deleteEarlier(
				req.body.sourceId, 
				req.body.destinationId, 
				momentToIsoOrInfinity(req.body.startTime),
				momentToIsoOrInfinity(req.body.endTime),
				conn
			);
			success(res, 'Successfully deleted earlier conversion segment.');
		} catch (err) {
			const errMsg = `Error while deleting earlier conversion segment with error(s): ${err}`
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

/**
 * POST delete conversion segment after updating the start time of the following segment to the start time of the deleted segment.
 * @param {int} sourceId The source meter's id.
 * @param {int} destinationId The destination meter's id.
 * @param {string} startTime The new start time of the conversion segment.
 * @param {string} endTime The new end time of the conversion segment.
 */
router.post('/deleteLater', adminAuthMiddleware('delete later conversion segment'), async (req, res) => {
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
		const errMsg = `Got request to delete later conversion segment with invalid conversion segment data, error(s): ${validatorResult.errors}`
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			// Don't worry about checking if the conversion segment already exists
			// Just try to delete it to save the extra database call, since the database will return an error anyway if the row does not exist
			await ConversionSegment.deleteLater(
				req.body.sourceId, 
				req.body.destinationId, 
				momentToIsoOrInfinity(req.body.startTime),
				momentToIsoOrInfinity(req.body.endTime),
				conn
			);
			success(res, 'Successfully deleted later conversion segment.');
		} catch (err) {
			const errMsg = `Error while deleting later conversion segment with error(s): ${err}`
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

module.exports = router;