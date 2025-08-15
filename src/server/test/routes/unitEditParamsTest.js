/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { expect } = require('chai');
const { chai, mocha, app, testDB } = require('../common');
const Unit = require('../../models/Unit');
const { insertUnits } = require('../../util/insertData');
const {validateString, validateInt, validateBool, validateMinMaxRelation, getToken} = require('../util/vaidationHelpers');

const EDIT_UNIT = '/api/units/edit';

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

const INSERT_UNIT = {
	name: 'kWh',
	identifier: '',
	unitRepresent: Unit.unitRepresentType.QUANTITY,
	secInRate: 3600,
	typeOfUnit: Unit.unitType.UNIT,
	suffix: '',
	displayable: Unit.displayableType.ALL,
	preferredDisplay: true,
	note: 'OED created standard unit'
};

mocha.describe('Unit Routes - /edit Validation', () => {
	mocha.beforeEach(async () => {
		const conn = testDB.getConnection();

		await insertUnits([INSERT_UNIT], true, conn);
	});
	mocha.it('should validate string fields', async () => {
		await validateString({
			field: 'name',
			endpoint: EDIT_UNIT,
			basePayload,
			minLength: 1,
			maxLength: 50
		});
		await validateString({
			field: 'identifier',
			endpoint: EDIT_UNIT,
			basePayload,
			minLength: 1,
			maxLength: 50,
			required: true
		});
		await validateString({
			field: 'unitRepresent',
			endpoint: EDIT_UNIT,
			basePayload,
			enumValues: Object.values(Unit.unitRepresentType),
			minLength: 1
		});
		await validateString({
			field: 'typeOfUnit',
			endpoint: EDIT_UNIT,
			basePayload,
			enumValues: Object.values(Unit.unitType),
			minLength: 1
		});
		await validateString({
			field: 'suffix',
			endpoint: EDIT_UNIT,
			basePayload,
			minLength: 1,
			maxLength: 50,
			required: false
		});
		await validateString({
			field: 'displayable',
			endpoint: EDIT_UNIT,
			basePayload,
			enumValues: Object.values(Unit.displayableType),
			minLength: 1
		});
		await validateString({
			field: 'disableChecks',
			endpoint: EDIT_UNIT,
			basePayload,
			enumValues: Object.values(Unit.disableChecksType),
			minLength: 1
		});
		await validateString({
			field: 'note',
			endpoint: EDIT_UNIT,
			basePayload,
			maxLength: 1000
		});
	});
	mocha.it('should validate numeric and integer fields', async () => {
		await validateInt({
			field: 'secInRate',
			endpoint: EDIT_UNIT,
			basePayload,
			required: false
		});
		await validateInt({
			field: 'minVal',
			endpoint: EDIT_UNIT,
			basePayload
		});
		await validateInt({
			field: 'maxVal',
			endpoint: EDIT_UNIT,
			basePayload
		});
		await validateMinMaxRelation({
			endpoint: EDIT_UNIT,
			basePayload
		});
	});
	mocha.it('should validate boolean fields', async () => {
		await validateBool({
			field: 'preferredDisplay',
			endpoint: EDIT_UNIT,
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
			.post(EDIT_UNIT)
			.set('token', token)
			.send(payloadWithExtra);
		expect(res).to.have.status(400);
	});
});
