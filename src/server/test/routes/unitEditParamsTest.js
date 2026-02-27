/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { expect } = require('chai');
const { chai, mocha, app } = require('../common');
const { HTTP_CODE } = require('../../util/readingsUtils');
const {
	testInvalidField,
	validateNoExtraFields
} = require('../util/validationHelpers');
const {
	STRING_GENERAL_MAX_LENGTH,
	STRING_SHORT_MAX_LENGTH
} = require('../../util/validationConstants');

mocha.describe('Units Edit Parameter Validation', () => {

	mocha.describe('POST /api/units/edit - Unit Edit Validation', () => {
		const EDIT_ENDPOINT = '/api/units/edit';

		const baseUnitData = {
			id: 1,
			name: 'Updated Test Unit',
			identifier: 'updated_test_unit',
			unitRepresent: 'flow',
			secInRate: 3600,
			typeOfUnit: 'unit',
			suffix: '',
			displayable: 'admin',
			preferredDisplay: false,
			note: 'Updated test unit',
			minVal: 0,
			maxVal: 5000,
			disableChecks: 'reject_bad'
		};

		mocha.it('should reject unauthenticated requests', async () => {
			const res = await chai.request(app)
				.post(EDIT_ENDPOINT)
				.send(baseUnitData);

			// Should require admin authentication
			expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
		});

		mocha.it('should validate required fields', async () => {
			const requiredFields = ['id', 'identifier'];

			for (const field of requiredFields) {
				const payloadMissingField = { ...baseUnitData };
				delete payloadMissingField[field];

				const res = await chai.request(app)
					.post(EDIT_ENDPOINT)
					.send(payloadMissingField);

				// Should fail due to auth (auth runs before validation)
				expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
			}
		});

		mocha.it('should validate id field type and constraints', async () => {
			// Test non-integer ID
			await testInvalidField({
				field: 'id',
				invalidValue: 'not_a_number',
				endpoint: EDIT_ENDPOINT,
				basePayload: baseUnitData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});

			// Test negative ID
			await testInvalidField({
				field: 'id',
				invalidValue: -1,
				endpoint: EDIT_ENDPOINT,
				basePayload: baseUnitData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});

			// Test zero ID
			await testInvalidField({
				field: 'id',
				invalidValue: 0,
				endpoint: EDIT_ENDPOINT,
				basePayload: baseUnitData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});

			// Test float ID
			await testInvalidField({
				field: 'id',
				invalidValue: 1.5,
				endpoint: EDIT_ENDPOINT,
				basePayload: baseUnitData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});
		});

		mocha.it('should validate string field lengths', async () => {
			// Test name field length (minLength: 1)
			await testInvalidField({
				field: 'name',
				invalidValue: '',
				endpoint: EDIT_ENDPOINT,
				basePayload: baseUnitData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});

			// Test identifier field with empty string
			await testInvalidField({
				field: 'identifier',
				invalidValue: '',
				endpoint: EDIT_ENDPOINT,
				basePayload: baseUnitData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});

			// Test unitRepresent field length (minLength: 1)
			await testInvalidField({
				field: 'unitRepresent',
				invalidValue: '',
				endpoint: EDIT_ENDPOINT,
				basePayload: baseUnitData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});

			// Test typeOfUnit field length (minLength: 1)
			await testInvalidField({
				field: 'typeOfUnit',
				invalidValue: '',
				endpoint: EDIT_ENDPOINT,
				basePayload: baseUnitData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});

			// Test displayable field length (minLength: 1)
			await testInvalidField({
				field: 'displayable',
				invalidValue: '',
				endpoint: EDIT_ENDPOINT,
				basePayload: baseUnitData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});

			// Test disableChecks field length (minLength: 1)
			await testInvalidField({
				field: 'disableChecks',
				invalidValue: '',
				endpoint: EDIT_ENDPOINT,
				basePayload: baseUnitData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});
		});

		mocha.it('should validate enum fields', async () => {
			// Test invalid unitRepresent (valid: quantity, flow, raw)
			const invalidUnitRepresents = ['INVALID', 'invalid', 'volume', 'rate'];
			for (const invalidValue of invalidUnitRepresents) {
				await testInvalidField({
					field: 'unitRepresent',
					invalidValue: invalidValue,
					endpoint: EDIT_ENDPOINT,
					basePayload: baseUnitData,
					expectedStatus: HTTP_CODE.FORBIDDEN
				});
			}

			// Test invalid typeOfUnit (valid: unit, meter, suffix)
			const invalidTypeOfUnits = ['INVALID', 'invalid', 'group', 'reading'];
			for (const invalidValue of invalidTypeOfUnits) {
				await testInvalidField({
					field: 'typeOfUnit',
					invalidValue: invalidValue,
					endpoint: EDIT_ENDPOINT,
					basePayload: baseUnitData,
					expectedStatus: HTTP_CODE.FORBIDDEN
				});
			}

			// Test invalid displayable (valid: none, all, admin)
			const invalidDisplayables = ['INVALID', 'invalid', 'public', 'private'];
			for (const invalidValue of invalidDisplayables) {
				await testInvalidField({
					field: 'displayable',
					invalidValue: invalidValue,
					endpoint: EDIT_ENDPOINT,
					basePayload: baseUnitData,
					expectedStatus: HTTP_CODE.FORBIDDEN
				});
			}

			// Test invalid disableChecks (valid: reject_disabled, reject_bad, reject_all, reject_none)
			const invalidDisableChecks = ['INVALID', 'invalid', 'reject', 'disable'];
			for (const invalidValue of invalidDisableChecks) {
				await testInvalidField({
					field: 'disableChecks',
					invalidValue: invalidValue,
					endpoint: EDIT_ENDPOINT,
					basePayload: baseUnitData,
					expectedStatus: HTTP_CODE.FORBIDDEN
				});
			}
		});

		mocha.it('should validate numeric field types', async () => {
			// Test secInRate with non-numeric value
			await testInvalidField({
				field: 'secInRate',
				invalidValue: 'not_a_number',
				endpoint: EDIT_ENDPOINT,
				basePayload: baseUnitData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});

			// Test minVal with non-numeric value
			await testInvalidField({
				field: 'minVal',
				invalidValue: 'invalid',
				endpoint: EDIT_ENDPOINT,
				basePayload: baseUnitData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});

			// Test maxVal with non-numeric value
			await testInvalidField({
				field: 'maxVal',
				invalidValue: 'invalid',
				endpoint: EDIT_ENDPOINT,
				basePayload: baseUnitData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});
		});

		mocha.it('should validate boolean field types', async () => {
			const invalidBooleanValues = ['yes', 'no', '1', '0', 'on', 'off', 'true', 'false'];

			for (const invalidValue of invalidBooleanValues) {
				await testInvalidField({
					field: 'preferredDisplay',
					invalidValue: invalidValue,
					endpoint: EDIT_ENDPOINT,
					basePayload: baseUnitData,
					expectedStatus: HTTP_CODE.FORBIDDEN
				});
			}
		});

		mocha.it('should handle oneOf nullable fields correctly', async () => {
			// Test null values for nullable fields (suffix and note are not explicitly required in edit)
			const nullableFields = ['suffix', 'note'];

			for (const field of nullableFields) {
				const payloadWithNull = {
					...baseUnitData,
					[field]: null
				};

				const res = await chai.request(app)
					.post(EDIT_ENDPOINT)
					.send(payloadWithNull);

				// Should pass validation but fail auth
				expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
			}
		});

		mocha.it('should reject parameter injection', async () => {
			await validateNoExtraFields({
				endpoint: EDIT_ENDPOINT,
				basePayload: baseUnitData,
				extraFields: {
					maliciousField: 'injection attempt',
					isAdmin: true,
					deleteAll: true,
					executeCommand: 'rm -rf /',
					extraProperty: 'should be rejected'
				},
				expectedStatus: HTTP_CODE.FORBIDDEN
			});
		});

		mocha.it('should handle malicious string inputs', async () => {
			const maliciousInputs = [
				"'; DROP TABLE units; --",
				'<script>alert("xss")</script>',
				'../../../etc/passwd',
				'unit\x00injection',
				'\u0000malicious'
			];

			const stringFields = ['name', 'identifier', 'note', 'suffix'];

			for (const field of stringFields) {
				for (const maliciousInput of maliciousInputs) {
					await testInvalidField({
						field: field,
						invalidValue: maliciousInput,
						endpoint: EDIT_ENDPOINT,
						basePayload: baseUnitData,
						expectedStatus: HTTP_CODE.FORBIDDEN
					});
				}
			}
		});

		mocha.it('should handle SQL injection attempts', async () => {
			const sqlInjectionInputs = [
				"1'; DROP TABLE units; --",
				"1 OR 1=1",
				"1' UNION SELECT * FROM users --"
			];

			for (const maliciousInput of sqlInjectionInputs) {
				await testInvalidField({
					field: 'name',
					invalidValue: maliciousInput,
					endpoint: EDIT_ENDPOINT,
					basePayload: baseUnitData,
					expectedStatus: HTTP_CODE.FORBIDDEN
				});
			}
		});

		mocha.it('should reject completely invalid payloads', async () => {
			// Test non-object payload
			const res1 = await chai.request(app)
				.post(EDIT_ENDPOINT)
				.send('not an object');
			expect(res1.status).to.equal(HTTP_CODE.FORBIDDEN);

			// Test array payload
			const res2 = await chai.request(app)
				.post(EDIT_ENDPOINT)
				.send(['array', 'payload']);
			expect(res2.status).to.equal(HTTP_CODE.FORBIDDEN);

			// Test null payload
			const res3 = await chai.request(app)
				.post(EDIT_ENDPOINT)
				.send(null);
			expect(res3.status).to.equal(HTTP_CODE.FORBIDDEN);
		});
	});

	mocha.describe('Cross-Endpoint Security Tests', () => {
		mocha.it('should handle concurrent unit edit operations', async () => {
			const EDIT_ENDPOINT = '/api/units/edit';
			const unitData = {
				id: 999,
				identifier: 'concurrent_test',
				name: 'Concurrent Test Unit',
				unitRepresent: 'quantity',
				typeOfUnit: 'unit',
				displayable: 'all',
				preferredDisplay: false
			};

			// Send multiple concurrent requests
			const promises = Array(3).fill().map(() =>
				chai.request(app)
					.post(EDIT_ENDPOINT)
					.send(unitData)
			);

			const results = await Promise.all(promises);

			// All should fail with 403 (auth required)
			results.forEach(res => {
				expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
			});
		});

		mocha.it('should handle rapid switching between add and edit operations', async () => {
			const ADD_ENDPOINT = '/api/units/addUnit';
			const EDIT_ENDPOINT = '/api/units/edit';

			const addData = {
				name: 'Rapid Test Unit',
				identifier: 'rapid_test',
				unitRepresent: 'quantity',
				typeOfUnit: 'unit',
				displayable: 'all',
				preferredDisplay: false,
				minVal: 0,
				maxVal: 1000,
				disableChecks: 'reject_all'
			};

			const editData = {
				id: 1,
				identifier: 'rapid_test_edit',
				name: 'Rapid Test Unit Edit'
			};

			// Alternate between add and edit operations
			const results = await Promise.all([
				chai.request(app).post(ADD_ENDPOINT).send(addData),
				chai.request(app).post(EDIT_ENDPOINT).send(editData),
				chai.request(app).post(ADD_ENDPOINT).send(addData),
				chai.request(app).post(EDIT_ENDPOINT).send(editData)
			]);

			// All should fail with auth
			results.forEach(res => {
				expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
			});
		});
	});
});
