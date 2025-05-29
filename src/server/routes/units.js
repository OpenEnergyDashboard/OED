// routes/units.js
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 const express = require('express');
 const { authMiddleware } = require('./authenticator');
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
 * Route for listing all units.
 */
 router.get(
   '/',
   authMiddleware('get units'),
   async (req, res) => {
	 const conn = getConnection();
	 try {
	   const rows = await Unit.getAll(conn);
	   res.json(rows.map(formatUnitForResponse));
	 } catch (err) {
	   log.error(`Error fetching units: ${err}`, err);
	   res.sendStatus(500);
	 }
   }
 );
 
/**
 * Route for editing a unit by ID.
 */
 router.post(
   '/edit',
   authMiddleware('edit units'),
   async (req, res) => {
	 const unitSchema = { type: 'object',
	 required: ['id', 'name', 'identifier', 'unitRepresent', 'secInRate', 'typeOfUnit', 'suffix'],
	 properties: {
	   id: { type: 'integer' },
	   name: { type: 'string' },
	   identifier: { type: 'string' },
	   unitRepresent: { type: 'string' },
	   secInRate: { type: 'number' },
	   typeOfUnit: { type: 'string' },
	   suffix: { type: 'string' },
	   displayable: { type: 'boolean' },
	   preferredDisplay: { type: 'boolean' },
	   note: { type: 'string' },
	   minVal: { type: 'number' },
	   maxVal: { type: 'number' },
	   disableChecks: { type: 'boolean' }
	 }};
	 const result = validate(req.body, unitSchema);
	 if (!result.valid) {
	   log.warn(`Invalid unit edit payload: ${result.errors}`);
	   return failure(res, 400, `Validation errors: ${result.errors}`);
	 }
 
	 const conn = getConnection();
	 try {
	   const unit = await Unit.getById(req.body.id, conn);
	   if (unit.suffix !== req.body.suffix) {
		 // Remove old conversions if suffix has changed
		 await removeAdditionalConversionsAndUnits(unit, conn);
	   }
	   Object.assign(unit, req.body);
	   await unit.update(conn);
	   success(res, 'Unit updated successfully');
	 } catch (err) {
	   log.error(`Failed to update unit: ${err}`, err);
	   failure(res, 500, 'Unable to update unit');
	 }
   }
 );
 
/**
 * Route for creating a new unit.
 */
 router.post(
   '/addUnit',
   authMiddleware('add units'),
   async (req, res) => {
	 const unitSchema = { type: 'object',
	 required: ['name', 'identifier', 'unitRepresent', 'secInRate', 'typeOfUnit', 'suffix'],
	 properties: {
	   id: { type: 'integer' },
	   name: { type: 'string' },
	   identifier: { type: 'string' },
	   unitRepresent: { type: 'string' },
	   secInRate: { type: 'number' },
	   typeOfUnit: { type: 'string' },
	   suffix: { type: 'string' },
	   displayable: { type: 'boolean' },
	   preferredDisplay: { type: 'boolean' },
	   note: { type: 'string' },
	   minVal: { type: 'number' },
	   maxVal: { type: 'number' },
	   disableChecks: { type: 'boolean' }
	 }};
	 const result = validate(req.body, unitSchema);
	 if (!result.valid) {
	   log.error(`Invalid unit creation payload: ${result.errors}`);
	   return failure(res, 400, `Validation errors: ${result.errors}`);
	 }
 
	 const conn = getConnection();
	 try {
	   await conn.tx(async t => {
		 const newUnit = new Unit(
		   undefined,
		   req.body.name,
		   req.body.identifier,
		   req.body.unitRepresent,
		   req.body.secInRate,
		   req.body.typeOfUnit,
		   req.body.suffix,
		   req.body.displayable,
		   req.body.preferredDisplay,
		   req.body.note
		 );
		 await newUnit.insert(t);
	   });
	   success(res, 'Unit created successfully');
	 } catch (err) {
	   log.error(`Error inserting new unit: ${err}`, err);
	   failure(res, 500, 'Unable to create unit');
	 }
   }
 );
 
/**
 * Route for deleting a unit by ID.
 */
router.post(
	'/delete',
	authMiddleware('delete units'),
	async (req, res) => {
		const paramsSchema = {
			type: 'object',
			required: ['id'],
			properties: { id: { type: 'integer' } }
		};
		const result = validate(req.body, paramsSchema);
		if (!result.valid) {
			log.warn(`Invalid delete-unit payload: ${result.errors}`);
			return failure(res, 400, `Validation errors: ${result.errors}`);
		}

		const conn = getConnection();
		try {
			const unit = await Unit.getById(req.body.id, conn);
			if (unit.typeOfUnit === 'suffix') {
				log.info('Deleting a suffix unit. Now deleting associated units and conversions.');
				await removeAdditionalConversionsAndUnits(unit, conn);
			}
			await Unit.delete(req.body.id, conn);
			success(res, 'Unit deleted successfully');
		} catch (err) {
			log.error(`Error deleting unit: ${err}`, err);
			failure(res, 500, 'Unable to delete unit');
		}
	}
);

module.exports = router;
