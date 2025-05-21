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

mocha.describe('Unit Routes - /edit Validation', () => {
  let unitId;

  // SHL: I put a lot of comment in unitParamsTest.js which probably is now obsolete but some apply here.
  mocha.beforeEach(async () => {
    const conn = testDB.getConnection();
    await recreateDB(conn);

    await insertUnits([{
      name: 'kWh',
      identifier: '',
      unitRepresent: Unit.unitRepresentType.QUANTITY,
      secInRate: 3600,
      typeOfUnit: Unit.unitType.UNIT,
      suffix: '',
      displayable: Unit.displayableType.ALL,
      preferredDisplay: true,
      note: 'OED created standard unit'
    }], true, conn);

    unitId = await getUnitId('kWh');
  });

  generateUnitValidationTests({
    app,
    endpoint: EDIT_UNIT,
    // SHL: Can't this include be done locally? 
	// BM: Yes, Unit can be imported inside this function, but as creating this function, I try my best to make it as general and reuseable for other endpoints as possible.
    Unit,
    // SHL: Why is a function needed here?
	// BM: I use a function so the ID is fetched at test runtime, ensuring the ID is always fresh (because beforeEach hook is used in this test) in each test.
    getId: async () => unitId,
    options: { skipId: false },
    // SHL: could some of these variations be done automatically?
	// BM: Could you elaborate more about this question?

    // SHL: one case has error as pointed out elsewhere on bad case to try to clean up.
	// The test case has error is 'nonexistent id' - about write log in the data base and it said "relation "logmsg" does not exist", could you tell me more about what logmsg in the project is?
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