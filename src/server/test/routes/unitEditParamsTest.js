const { chai, mocha, app, testDB, recreateDB } = require('../common');
const { generateUnitValidationTests } = require('../util/unitTestUtils');
const Unit = require('../../models/Unit');
const { validateString, validateInt, validateBool } = require('../util/vaidationHelpers')
const EDIT_UNIT = '/api/units/edit';
const { insertUnits } = require('../../util/insertData');
const { getUnitId} = require('../../util/readingsUtils');

mocha.describe('Unit Routes - /edit Validation', () => {
  let unitId;

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
    Unit,
    getId: async () => unitId,
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
