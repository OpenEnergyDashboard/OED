/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

//
const { expect } = require('chai');
const { chai, mocha, app, testDB, recreateDB } = require('../common');
//This is the first way to test endpoint
const { generateUnitValidationTests } = require('../util/unitTestUtils');
//2nd way
const { validateString, validateInt, validateBool, validateMinMaxRelation } = require('../util/vaidationHelpers');

//This is the end point we use to test in this file.
const ADD_UNIT = '/api/units/addUnit';

// mocha.describe('Unit Routes - /addUnit Validation', () => {
//     mocha.beforeEach(async () => {
//         const conn = testDB.getConnection();
//     });

//     generateUnitValidationTests({
//         endpoint: ADD_UNIT,
//         getId: async () => undefined,
//         options: { skipId: true },
//         cases: [
//             { name: 'should succeed with valid payload', expectedStatus: 200 },
//             { name: 'missing name', expectedStatus: 400, mutation: { type: 'remove', field: 'name' } },
//             { name: 'empty identifier', expectedStatus: 400, mutation: { type: 'change', field: 'identifier', value: '' } },
//             { name: 'invalid displayable', expectedStatus: 400, mutation: { type: 'change', field: 'displayable', value: 'maybe' } },
//             { name: 'missing all required fields', expectedStatus: 400, mutation: { type: 'custom', body: {} } }
//         ]
//     });
// });


const basePayload = {
	name: 'Valid Name',
	identifier: 'valid_id',
	unitRepresent: 'flow',
	secInRate: 60,
	typeOfUnit: 'unit',
	suffix: 'L/s',
	displayable: 'all',
	preferredDisplay: true,
	note: 'Note text',
	minVal: 0,
	maxVal: 100,
	disableChecks: 'reject_bad'
};

mocha.describe('Validation - /addUnit', () => {
	mocha.it('should validate string fields', async () => {
		// Based on schema: name VARCHAR(50), NOT NULL
		await validateString({
			field: 'name',
			endpoint: ADD_UNIT,
			basePayload,
			maxLength: 50
		});

		// identifier VARCHAR(50), NOT NULL, with check char_length >= 1
		await validateString({
			field: 'identifier',
			endpoint: ADD_UNIT,
			basePayload,
			minLength: 1,
			maxLength: 50
		});

		// unitRepresent ENUM (unitRepresentType), NOT NULL
		await validateString({
			field: 'unitRepresent',
			endpoint: ADD_UNIT,
			basePayload,
			enumValues: ['flow', 'quantity', 'pressure'] // Update with actual enum values in Unit.unitRepresentType
		});

		await validateString({
			field: 'typeOfUnit',
			endpoint: ADD_UNIT,
			basePayload,
			enumValues: ['unit', 'conversion'] // Update based on Unit.unitType
		});


		await validateString({
            field: 'displayable',
            endpoint: ADD_UNIT,
            basePayload,
            enumValues: ['all', 'none', 'admin'] 
        });        

		await validateString({
			field: 'disableChecks',
			endpoint: ADD_UNIT,
			basePayload,
			enumValues: ['reject_bad', 'reject_all', 'reject_none']
		});
	});

	mocha.it('should validate numeric and integer fields', async () => {
        await validateInt({
            field: 'secInRate',
            endpoint: ADD_UNIT,
            basePayload,
            required: false,
            min: 0,
        });
        
        await validateInt({
            field: 'minVal',
            endpoint: ADD_UNIT,
            basePayload,
            required: true
        });
    
        await validateInt({
            field: 'maxVal',
            endpoint: ADD_UNIT,
            basePayload,
            required: true
        });

		await validateMinMaxRelation({
			endpoint: ADD_UNIT,
			basePayload
		});
    });
    
	mocha.it('should validate boolean fields', async () => {
		await validateBool({
			field: 'preferredDisplay',
			endpoint: ADD_UNIT,
			basePayload
		});
	});
});
