const express = require('express');
const Unit = require('../models/Unit');
const User = require('../models/User');
const { getConnection } = require('../db');
const { isTokenAuthorized } = require('../util/userRoles');
const { log } = require('../log');
const validate = require('jsonschema').validate;
const adminAuthenticator = require('./authenticator').adminAuthMiddleware;
const optionalAuthenticator = require('./authenticator').optionalAuthMiddleware;


const router = express.Router();

/**
 * Defines the format in which we want to send meters and controls what information we send to the client, if logged in and an Admin or not.
 * @param meter
 * @param loggedInAsAdmin
 * @returns {{id, name}}
 */
router.use(optionalAuthenticator)
//help

function formatUnitForResponse(unit){
	//some of these values should be NULL
    const formattedUnit = {
        id:  unit.id,
		name:  unit.name,
		identifier:  unit.identifier,
		unitRepresent:  unit.unitRepresent,
		secInRate:  unit.secInRate,
		typeOfUnit:  unit.typeOfUnit,
		unitIndex:  unit.unitIndex,
		suffix:  unit.suffix,
		displayable:  unit.displayable,
		preferredDisplay:  unit.preferredDisplay,
		note:  unit.note
    };
    return formattedUnit;
}

router.get('/', async(req,res) => {
    try{
        const conn = getConnection();
		let query;
        query = Unit.getAll;

		const token = req.headers.token || req.body.token || req.query.token;
		const loggedInAsAdmin = req.hasValidAuthToken && (await isTokenAuthorized(token, User.role.ADMIN));
		if(loggedInAsAdmin){
			query = Unit.getAll;
			const rows = await query(conn);
			res.json(rows.map(row => formatUnitForResponse(row)));
		}else{
			res.json("");
		}
    }catch(err){
        log.error(`Error while performing GET all units query: ${err}`, err);
    }
})

router.post('/addUnit', adminAuthenticator('create unit'), async (req,res) => {
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
				const note = (req.body.note) ? '' : req.body.note;
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
					note
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