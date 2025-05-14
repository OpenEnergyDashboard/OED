const { chai, mocha, app, testDB, recreateDB } = require('../common');
const { generateUnitValidationTests } = require('../util/unitTestUtils');
const Unit = require('../../models/Unit');
const { validateString, validateInt, validateBool } = require('../util/vaidationHelpers')
const ADD_UNIT = '/api/units/addUnit';

mocha.describe('Unit Routes - /addUnit Validation', () => {
    mocha.beforeEach(async () => {
        const conn = testDB.getConnection();
        await recreateDB(conn);
    });

    generateUnitValidationTests({
        app,
        endpoint: ADD_UNIT,
        Unit,
        getId: async () => undefined,
        options: { skipId: true },
        cases: [
            { name: 'should succeed with valid payload', expectedStatus: 200 },
            { name: 'missing name', expectedStatus: 400, mutation: { type: 'remove', field: 'name' } },
            { name: 'empty identifier', expectedStatus: 400, mutation: { type: 'change', field: 'identifier', value: '' } },
            { name: 'invalid displayable', expectedStatus: 400, mutation: { type: 'change', field: 'displayable', value: 'maybe' } },
            { name: 'missing all required fields', expectedStatus: 400, mutation: { type: 'custom', body: {} } }
        ]
    });
});

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
        await validateString({ field: 'name', endpoint: ADD_UNIT, basePayload, maxLength: 255 });
        await validateString({ field: 'identifier', endpoint: ADD_UNIT, basePayload, maxLength: 100 });
        await validateString({ field: 'unitRepresent', endpoint: ADD_UNIT, basePayload, enumValues: ['flow', 'quantity', 'pressure'] }); 
    });

    mocha.it('should validate numeric fields', async () => {
        await validateInt({ field: 'secInRate', endpoint: ADD_UNIT, basePayload, min: 1, max: 10000 });
        await validateInt({ field: 'minVal', endpoint: ADD_UNIT, basePayload });
        await validateInt({ field: 'maxVal', endpoint: ADD_UNIT, basePayload });
      });
});
