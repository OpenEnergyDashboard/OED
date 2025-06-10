/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { chai, mocha, app, testDB, recreateDB } = require('../common');
const { generateUnitValidationTests } = require('../util/unitTestUtils');
const { insertUnits } = require('../../util/insertData');
const { getUnitId } = require('../../util/readingsUtils');
const Unit = require('../../models/Unit');

const EDIT_UNIT = '/api/units/edit';

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

	// SHL: I put a lot of comment in unitParamsTest.js which probably is now obsolete but some apply here.
	mocha.beforeEach(async () => {
		const conn = testDB.getConnection();
		await recreateDB(conn);

		await insertUnits([INSERT_UNIT], true, conn);
	});

	generateUnitValidationTests({
		endpoint: EDIT_UNIT,
		unitName: INSERT_UNIT.name,
		options: { skipId: false },
		cases: [
			{ name: 'valid default unit', expectedStatus: 200 },
			{ name: 'nonexistent id', expectedStatus: 500, mutation: { type: 'change', field: 'id', value: 2 } },
			{ name: 'missing id', expectedStatus: 400, mutation: { type: 'remove', field: 'id' } },
			{ name: 'missing identifier', expectedStatus: 400, mutation: { type: 'remove', field: 'identifier' } },
			{ name: 'empty name', expectedStatus: 400, mutation: { type: 'change', field: 'name', value: '' } },
			{ name: 'invalid unitRepresent', expectedStatus: 400, mutation: { type: 'change', field: 'unitRepresent', value: 'INVALID' } },
			{ name: 'invalid displayable', expectedStatus: 400, mutation: { type: 'change', field: 'displayable', value: 'sometimes' } },
			{ name: 'missing all fields', expectedStatus: 400, mutation: { type: 'custom', body: {} } }
		]
	});
});