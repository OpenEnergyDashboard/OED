/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
const { expect } = require('chai');
const { chai, mocha, app, testDB } = require('../common');
const Unit = require('../../models/Unit');
const { validateString, validateInt, validateBool, validateMinMaxRelation, getToken } = require('../util/vaidationHelpers');

//This is the end point we use to test in this file.
const ADD_UNIT = '/api/units/addUnit';

const basePayload = {
	name: 'Valid Name',
	identifier: 'valid_identifier',
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
		await validateString({
			field: 'name',
			endpoint: ADD_UNIT,
			basePayload,
			minLength: 1,
			maxLength: 50,
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
		await validateString({
			field: 'unitRepresent',
			endpoint: ADD_UNIT,
			basePayload,
			enumValues: Object.values(Unit.unitRepresentType)
		});
		await validateString({
			field: 'typeOfUnit',
			endpoint: ADD_UNIT,
			basePayload,
			enumValues: Object.values(Unit.unitType)
		});
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
	});
	mocha.it('should validate numeric and integer fields', async () => {
        await validateInt({
            field: 'secInRate',
            endpoint: ADD_UNIT,
            basePayload,
            required: false,
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
		const token = await getToken();
		const payloadWithExtra = {
			...basePayload,
			extra: 'not allowed'
		};
		const res = await chai.request(app)
			.post(ADD_UNIT)
			.set('token', token)
			.send(payloadWithExtra);

		expect(res).to.have.status(400);
	});
});
