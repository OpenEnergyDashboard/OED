/* This Source Code Form is subject to the terms of the Mozilla Public
  * License, v. 2.0. If a copy of the MPL was not distributed with this
  * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { log } = require('../log');
const { getConnection } = require('../db');
const Unit = require('../models/Unit');

const router = express.Router();

function formatUnitForResponse(item) {
    return { id: item.id, name: item.name, identifier: item.identifier, unitRepresent: item.unitRepresent, 
        secInRate: item.secInRate, typeOfUnit: item.typeOfUnit, unitIndex: item.unitIndex, suffix: item.suffix, 
        displayable: item.displayable, preferredDisplay: item.preferredDisplay, note: item.note };
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

router.post('/addUnit', async (req,res) => {
	const validUnit = {
		type: 'object',
		required: ['name', 'identifier', 'unitRepresent', 'typeOfUnit', 'displayable', 'preferredDisplay'],
		properties: {
			name: {
				type: 'string',
				minLength: 1
			},
			identifier: {
				type: 'string',
				minLength: 1
			},
			// not sure if you need to check based on enum
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
				type: 'string',
				minLength: 1
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
					{type: 'string'},
					{ type: 'null'}
				]
			}
		}
	};
	console.log(req.body)
	//Could change the function here 
	const validationResult = validate(req.body, validUnit);
	if(!validationResult.valid){
		log.error(`Invalid input for unitsAPI. ${validationResult.error}`);
		res.sendStatus(400);
	}else{
		const conn = getConnection();
		try{
			await conn.tx(async t => {
				const newUnit = new Unit(
					undefined,
					req.body.name,
					req.body.identifier,
					req.body.unitRepresent,
					req.body.secInRate,
					req.body.typeOfUnit,
					req.body.unitIndex,
					req.body.suffix,
					req.body.displayable,
					req.body.preferredDisplay,
					req.body.note
				);
				await newUnit.insert(t);
			});
			res.sendStatus(200);
		}catch(err){
			log.error(`Error while inserting new unit ${err}`, err);
			res.sendStatus(500);
		}
	}
});

module.exports = router;