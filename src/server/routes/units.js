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
 
/**
 * Route for listing all units.
 */
 router.get(
   '/',
   authMiddleware('manage units'),
   async (req, res) => {
	 const conn = getConnection();
	 try {
	   const rows = await Unit.getAll(conn);
	   res.json(rows.map(item => ({
		 id: item.id,
		 name: item.name,
		 identifier: item.identifier,
		 unitRepresent: item.unitRepresent,
		 secInRate: item.secInRate,
		 typeOfUnit: item.typeOfUnit,
		 suffix: item.suffix,
		 displayable: item.displayable,
		 preferredDisplay: item.preferredDisplay,
		 note: item.note
	   })));
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
   authMiddleware('manage units'),
   async (req, res) => {
	 const unitSchema = { /* ... your schema ... */ };
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
   authMiddleware('manage units'),
   async (req, res) => {
	 const unitSchema = { /* ... your schema ... */ };
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
	adminAuthMiddleware('delete units'),
	async (req, res) => {
		const validParams = {
			type: 'object',
			maxProperties: 1,
			required: ['id'],
			properties: {
				id: { type: 'integer' }
			}
		};

		// Ensure delete request is valid
		const validatorResult = validate(req.body, validParams);
		if (!validatorResult.valid) {
			const errorMsg = `Got request to delete a unit with invalid data, error(s):  ${validatorResult.errors}`;
			log.warn(errorMsg);
			failure(res, 400, errorMsg);
		} else {
			const conn = getConnection();
			try {
				const unit = await Unit.getById(req.body.id, conn);
				if (unit.typeOfUnit === 'suffix') {
					log.info('Deleting a suffix unit. Now deleting associated units and conversions.');
					await removeAdditionalConversionsAndUnits(unit, conn);
				}
				// Don't worry about checking if the unit already exists
				// Just try to delete it to save the extra database call, since the database will return an error anyway if the row does not exist
				await Unit.delete(req.body.id, conn);
				success(res, 'Successfully deleted unit');
			} catch (err) {
				const errorMsg = `Error while deleting unit with error(s): ${err}`;
				log.error(errorMsg);
				failure(res, 500, errorMsg);
			}
		}
	}
);

module.exports = router;
