const express = require('express');
const { getConnection } = require('../db');
const { Unit } = require('../models/Unit');

const router = express.Router();
//help

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
        let query = Unit.getAll;
		res.json(query.map(row => formatUnitForResponse(query)));
    }catch(err){
        log.error(`Error while performing GET all units query: ${err}`, err);
    }
})