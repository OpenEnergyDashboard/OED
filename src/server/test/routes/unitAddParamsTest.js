/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { expect } = require('chai');
const { chai, mocha, app } = require('../common');
const Unit = require('../../models/Unit');
const { validateString, validateInt, validateBool, validateMinMaxRelation, validateExtraFields, getToken } = require('../util/validationHelpers');

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
// Schema source: src/server/migrations/0.8.0-1.0.0/sql/unit/create_units_table.sql
mocha.describe('Validation - /addUnit', () => {
	mocha.it('should accept a valid payload', async () => {
		const token = await getToken();
		const res = await chai.request(app)
			.post(ADD_UNIT)
			.set('token', token)
			.send(basePayload);

		expect(res).to.have.status(200);
	});
	mocha.it('should validate string fields', async () => {
		await validateString({
			field: 'name',
			endpoint: ADD_UNIT,
			basePayload,
			minLength: 1,
			maxLength: 50,
			required: true,
		});	
		await validateString({
			field: 'identifier',
			endpoint: ADD_UNIT,
			basePayload,
			minLength: 1,
			maxLength: 50,
			required:true
		});
		await validateString({
			field: 'unitRepresent',
			endpoint: ADD_UNIT,
			basePayload,
			enumValues: Object.values(Unit.unitRepresentType),
			minLength: 1,
			required: true,
		});
		await validateString({
			field: 'typeOfUnit',
			endpoint: ADD_UNIT,
			basePayload,
			enumValues: Object.values(Unit.unitType),
			required: true,
		});
		await validateString({
			field: 'suffix',
			endpoint: ADD_UNIT,
			basePayload,
			minLength: 1,
			maxLength: 50,
			required: false
		});
		await validateString({
			field: 'note',
			endpoint: ADD_UNIT,
			basePayload,
			required: false
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
			enumValues: Object.values(Unit.disableChecksType)
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
		await validateExtraFields({
			endpoint: ADD_UNIT,
			basePayload,
			token
		});
	});	
});