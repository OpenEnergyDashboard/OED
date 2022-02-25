const express = require('express');
const { getConnection } = require('../db');
const { Unit } = require('../models/Unit');
const User = require('../models/User');
const { isTokenAuthorized } = require('../util/userRoles') 
const adminAuthenticator = require('./authenticator').adminAuthMiddleware;

const router = express.Router();
router.use(optionalAuthenticator);

function formatUnitForResponse(unit){
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
        const token = req.headers.token || req.body.token || req.query.token;
        if (req.hasValidAuthToken && (await isTokenAuthorized(token, User.role.ADMIN))) {
			query = Unit.getAll; // only admins can see disabled maps;
		} else {
			query = Unit.getDisplayable;
		}
		const rows = await query(conn);
		res.json(rows.map(row => formatUnitForResponse(row)));
    }catch(err){
        log.error(`Error while performing GET all units query: ${err}`, err);
    }
})