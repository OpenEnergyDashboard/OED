const chaiHttp = require('chai-http');
const { getUnitId, expectStatusToEqual } = require('../../util/readingsUtils');
const { chai, mocha, expect, app, testDB, testUser, recreateDB } = require('../common');
chai.use(chaiHttp);

const EDIT_UNIT = '/api/units/edit';
const ADD_UNIT = '/api/units/addUnit';
const Unit = require('../../models/Unit');
const { insertUnits } = require('../../util/insertData');


//Test case for '/edit'
mocha.describe('Unit Routes - /edit Validation and Error Cases', () => {
	let unitId;
	mocha.beforeEach(async () => {
		const conn = testDB.getConnection();
		await recreateDB(conn);
		await insertUnits([
			{
				name: 'kWh',
				identifier: '',
				unitRepresent: Unit.unitRepresentType.QUANTITY,
				secInRate: 3600,
				typeOfUnit: Unit.unitType.UNIT,
				suffix: '',
				displayable: Unit.displayableType.ALL,
				preferredDisplay: true,
				note: 'OED created standard unit'
			}
		], true, conn);

		unitId = await getUnitId('kWh');
	});

	const basePayload = {
		name: 'Water Flow Unit',
		identifier: 'energy_unit',
		unitRepresent: 'flow',
		secInRate: 60,
		typeOfUnit: 'unit',
		suffix: 'L/s',
		displayable: 'all',
		preferredDisplay: true,
		note: 'Used to measure water flow',
		minVal: 1,
		maxVal: 100,
		disableChecks: 'reject_bad'
	};

	const testCases = [
		{
			name: 'valid defaultTestUnit',
			status: 200,
			body: { ...basePayload, id: unitId }
		},
		{
			name: 'nonexistent id',
			status: 500,
			body: () => ({ ...basePayload, id: unitId + 1 })
		},
		{
			name: 'missing id',
			status: 400,
			body: () => ({ ...basePayload, id: undefined })
		},
		{
			name: 'missing identifier',
			status: 400,
			body: () => ({ ...basePayload, id: unitId, identifier: undefined })
		},
		{
			name: 'empty name',
			status: 400,
			body: () => ({ ...basePayload, id: unitId, name: '' })
		},
		{
			name: 'invalid unitRepresent',
			status: 400,
			body: () => ({ ...basePayload, id: unitId, unitRepresent: 'INVALID' })
		},
		{
			name: 'invalid displayable',
			status: 400,
			body: () => ({ ...basePayload, id: unitId, displayable: 'SOMETIMES' })
		},
		{
			name: 'missing multiple fields',
			status: 400,
			body: () => ({})
		}
	];

	testCases.forEach(({ name, status, body }) => {
		it(`should return ${status} when ${name}`, async () => {
			const requiredKeys = ['name', 'status', 'body'];
			// requiredKeys.forEach(key => {
			//   if (testCase.hasOwnProperty {
			//     console.log('Missing key');
			//   }
			// });
			const defaultTestUnit = body();
			const res = await chai.request(app).post(EDIT_UNIT).send(defaultTestUnit);

			expect(res).to.have.status(status);
		});
	});
});


//Invalid case for '/addUnit'
mocha.describe('Unit Routes - /addUnit Validation Fails', () => {
	mocha.beforeEach(async () => {
		await recreateDB();
	});
	const invalidAddUnitTestCases = [
		{
			name: 'missing required "name"',
			body: {
				identifier: 'unit1',
				unitRepresent: 'quantity',
				typeOfUnit: 'unit',
				displayable: 'all',
				preferredDisplay: true,
				minVal: 0,
				maxVal: 100,
				disableChecks: 'reject_none'
			}
		},
		{
			name: 'missing required "identifier"',
			body: {
				name: 'Test Unit',
				unitRepresent: 'quantity',
				typeOfUnit: 'unit',
				displayable: 'all',
				preferredDisplay: true,
				minVal: 0,
				maxVal: 100,
				disableChecks: 'reject_none'
			}
		},
		{
			name: 'empty string "unitRepresent"',
			body: {
				name: 'Test Unit',
				identifier: 'unit1',
				unitRepresent: '',
				typeOfUnit: 'unit',
				displayable: 'all',
				preferredDisplay: true,
				minVal: 0,
				maxVal: 100,
				disableChecks: 'reject_none'
			}
		},
		{
			name: 'invalid enum for "unitRepresent"',
			body: {
				name: 'Test Unit',
				identifier: 'unit1',
				unitRepresent: 'invalid_value',
				typeOfUnit: 'unit',
				displayable: 'all',
				preferredDisplay: true,
				minVal: 0,
				maxVal: 100,
				disableChecks: 'reject_none'
			}
		},
		{
			name: 'invalid enum for "typeOfUnit"',
			body: {
				name: 'Test Unit',
				identifier: 'unit1',
				unitRepresent: 'quantity',
				typeOfUnit: 'wrong_type',
				displayable: 'all',
				preferredDisplay: true,
				minVal: 0,
				maxVal: 100,
				disableChecks: 'reject_none'
			}
		},
		{
			name: 'invalid enum for "displayable"',
			body: {
				name: 'Test Unit',
				identifier: 'unit1',
				unitRepresent: 'quantity',
				typeOfUnit: 'unit',
				displayable: 'sometimes',
				preferredDisplay: true,
				minVal: 0,
				maxVal: 100,
				disableChecks: 'reject_none'
			}
		},
		{
			name: 'missing "preferredDisplay"',
			body: {
				name: 'Test Unit',
				identifier: 'unit1',
				unitRepresent: 'quantity',
				typeOfUnit: 'unit',
				displayable: 'all',
				minVal: 0,
				maxVal: 100,
				disableChecks: 'reject_none'
			}
		},
		{
			name: 'non-boolean "preferredDisplay"',
			body: {
				name: 'Test Unit',
				identifier: 'unit1',
				unitRepresent: 'quantity',
				typeOfUnit: 'unit',
				displayable: 'all',
				preferredDisplay: 'abc',
				minVal: 0,
				maxVal: 100,
				disableChecks: 'reject_none'
			}
		},
		{
			name: 'missing "minVal"',
			body: {
				name: 'Test Unit',
				identifier: 'unit1',
				unitRepresent: 'quantity',
				typeOfUnit: 'unit',
				displayable: 'all',
				preferredDisplay: true,
				maxVal: 100,
				disableChecks: 'reject_none'
			}
		},
		{
			name: 'missing "disableChecks"',
			body: {
				name: 'Test Unit',
				identifier: 'unit1',
				unitRepresent: 'quantity',
				typeOfUnit: 'unit',
				displayable: 'all',
				preferredDisplay: true,
				minVal: 0,
				maxVal: 100
			}
		},
		{
			name: 'invalid enum for "disableChecks"',
			body: {
				name: 'Test Unit',
				identifier: 'unit1',
				unitRepresent: 'quantity',
				typeOfUnit: 'unit',
				displayable: 'all',
				preferredDisplay: true,
				minVal: 0,
				maxVal: 100,
				disableChecks: 'reject_something_else'
			}
		}
	];
	invalidAddUnitTestCases.forEach(({ name, body }) => {
		mocha.it(`should return 400 when ${name}`, async () => {
			const res = await chai.request(app).post(ADD_UNIT).send(body);
			expect(res).to.have.status(400);
		});
	});
})

//Valid case for '/addUnit'
mocha.describe('Unit Routes - /addUnit Validation Success', () => {
	mocha.beforeEach(async () => {
		await recreateDB();
	});

	mocha.it('should not return 400 when valid', async () => {
		const validUnit = {
			name: 'Energy Unit',
			identifier: 'energy_unit',
			unitRepresent: 'quantity',
			secInRate: 60,
			typeOfUnit: 'unit',
			suffix: null,
			displayable: 'all',
			preferredDisplay: true,
			note: 'This is a test unit.',
			minVal: 0,
			maxVal: 100,
			disableChecks: 'reject_none'
		};
		const res = await chai.request(app).post(ADD_UNIT).send(validUnit);
		expect(res).to.have.status(200);
	});
});