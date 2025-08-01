/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

//
const { expect } = require('chai');
// SHL: recreateDB does not seem to be used.
// BM: recreateDB deleted
const { chai, mocha, app, testDB } = require('../common');
const Unit = require('../../models/Unit');
// SHL: This does not seem to be used.
// BM: THis is for the first way to test the params
//This is the first way to test endpoint
const { validateString, validateInt, validateBool, validateMinMaxRelation } = require('../util/vaidationHelpers');

//This is the end point we use to test in this file.
const ADD_UNIT = '/api/units/addUnit';

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

// SHL: I'm curious why these tests are so different than the edit verify and seem to cover different tests.
// BM: In this 2nd way, I have the validation function series to auto apply some incorrect params and test it.
mocha.describe('Validation - /addUnit', () => {
	mocha.it('should validate string fields', async () => {
		// Based on schema: name VARCHAR(50), NOT NULL
		await validateString({
			field: 'name',
			endpoint: ADD_UNIT,
			basePayload,
// SHL: name also has a min of 1 similar to identifier.
// BM: changed
			maxLength: 50,
			minLength: 1,
			required: true,
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
			// I am working on this
// SHL: It is raw not pressure. More generally, could the values be gotten from the Object so it always matches the intended "enum" values?
			enumValues: Object.values(Unit.unitRepresentType) // Update with actual enum values in Unit.unitRepresentType
		});

		await validateString({
			field: 'typeOfUnit',
			endpoint: ADD_UNIT,
			basePayload,
// SHL: The enum values are wrong.
			enumValues: Object.values(Unit.unitType) // Update based on Unit.unitType
		});
// SHL: Remove extra blank line.


		await validateString({
            field: 'displayable',
            endpoint: ADD_UNIT,
            basePayload,
            enumValues: Object.values(Unit.displayableType)
        });        

		await validateString({
			field: 'disableChecks',
			endpoint: ADD_UNIT,
			basePayload,
			enumValues:  Object.values(Unit.disableChecksType)
		});

		await validateString({
			field: 'suffix',
			endpoint: ADD_UNIT,
			basePayload,
			minLength: 1,
			maxLength: 50,
			required : false
		});
// SHL: I don't see a test on suffix which is limited to 50.
// SHL: While there is no limit on note in the DB, I think the route should limit to some upper limit of say 1000 and this should test that.
	});

	mocha.it('should validate numeric and integer fields', async () => {
        await validateInt({
            field: 'secInRate',
            endpoint: ADD_UNIT,
            basePayload,
            required: false,
// SHL: Zero is not allowed. It must be positive. Test should check 0 does not work.
// Changed
            min: 1,
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
	mocha.it('should reject payloads with extra fields', async () => {
		const payloadWithExtra = {
			...basePayload,
			extra: 'not allowed'
		};

		const res = await chai.request(app)
			.post(ADD_UNIT)
			.send(payloadWithExtra);

		expect(res).to.have.status(400);
	});
});
