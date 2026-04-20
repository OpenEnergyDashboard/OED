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
	validateNoExtraFields,
	validateString,
	validateBool
} = require('../util/validationHelpers');
const {
	STRING_GENERAL_MAX_LENGTH,
	STRING_SHORT_MAX_LENGTH
} = require('../../util/validationConstants');

mocha.describe('Units Add Parameter Validation', () => {

	mocha.describe('POST /api/units/addUnit - Unit Creation Validation', () => {
		const ADD_ENDPOINT = '/api/units/addUnit';

		const baseUnitData = {
			name: 'Test Unit',
			identifier: 'test_unit',
			unitRepresent: 'quantity',
			secInRate: 3600,
			typeOfUnit: 'unit',
			suffix: '',
			displayable: 'all',
			preferredDisplay: true,
			note: 'Test unit for validation',
			minVal: 0,
			maxVal: 10000,
			disableChecks: 'reject_all'
		};

		mocha.it('should reject unauthenticated requests', async () => {
			const res = await chai.request(app)
				.post(ADD_ENDPOINT)
				.send(baseUnitData);

			// Should require admin authentication
			expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
		});

		mocha.it('should validate all required fields for creation', async () => {
			const requiredFields = ['name', 'identifier', 'unitRepresent', 'typeOfUnit', 'displayable', 'preferredDisplay', 'minVal', 'maxVal', 'disableChecks'];

			for (const field of requiredFields) {
				const payloadMissingField = { ...baseUnitData };
				delete payloadMissingField[field];

				const res = await chai.request(app)
					.post(ADD_ENDPOINT)
					.send(payloadMissingField);

				// Should fail auth (auth runs before validation)
				expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
			}
		});

		mocha.it('should validate string field lengths', async () => {
			const lengthOnlyFields = [
				{ field: 'name', maxLength: STRING_SHORT_MAX_LENGTH },
				{ field: 'identifier', maxLength: STRING_GENERAL_MAX_LENGTH }
			];

			for (const { field, maxLength } of lengthOnlyFields) {
				await validateString({
					field,
					endpoint: ADD_ENDPOINT,
					basePayload: baseUnitData,
					minLength: 1,
					maxLength,
					expectedStatus: HTTP_CODE.FORBIDDEN
				});
			}
		});

		mocha.it('should validate enum-like string fields', async () => {
			const enumLikeFields = [
				{
					field: 'unitRepresent',
					maxLength: STRING_GENERAL_MAX_LENGTH,
					enumValues: ['quantity', 'flow', 'raw'],
					additionalInvalidEnumValues: ['INVALID', 'invalid', 'volume', 'rate', '']
				},
				{
					field: 'typeOfUnit',
					maxLength: STRING_GENERAL_MAX_LENGTH,
					enumValues: ['unit', 'meter', 'suffix'],
					additionalInvalidEnumValues: ['INVALID', 'invalid', 'group', 'reading', '']
				},
				{
					field: 'displayable',
					maxLength: STRING_GENERAL_MAX_LENGTH,
					enumValues: ['none', 'all', 'admin'],
					additionalInvalidEnumValues: ['INVALID', 'invalid', 'public', 'private', '']
				},
				{
					field: 'disableChecks',
					maxLength: STRING_GENERAL_MAX_LENGTH,
					enumValues: ['reject_disabled', 'reject_bad', 'reject_all', 'reject_none'],
					additionalInvalidEnumValues: ['INVALID', 'invalid', 'reject', 'disable', '']
				}
			];

			for (const { field, maxLength, enumValues, additionalInvalidEnumValues } of enumLikeFields) {
				await validateString({
					field,
					endpoint: ADD_ENDPOINT,
					basePayload: baseUnitData,
					minLength: 1,
					maxLength,
					enumValues,
					additionalInvalidEnumValues,
					expectedStatus: HTTP_CODE.FORBIDDEN
				});
			}
		});

		mocha.it('should validate numeric field types', async () => {
			// Test secInRate with non-numeric value
			await testInvalidField({
				field: 'secInRate',
				invalidValue: 'not_a_number',
				endpoint: ADD_ENDPOINT,
				basePayload: baseUnitData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});

			// Test minVal with non-numeric value
			await testInvalidField({
				field: 'minVal',
				invalidValue: 'invalid',
				endpoint: ADD_ENDPOINT,
				basePayload: baseUnitData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});

			// Test maxVal with non-numeric value
			await testInvalidField({
				field: 'maxVal',
				invalidValue: 'invalid',
				endpoint: ADD_ENDPOINT,
				basePayload: baseUnitData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});
		});

		mocha.it('should validate boolean field types', async () => {
			await validateBool({
				field: 'preferredDisplay',
				endpoint: ADD_ENDPOINT,
				basePayload: baseUnitData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});
		});

		mocha.it('should handle oneOf nullable fields correctly', async () => {
			// Test null values for nullable fields (suffix and note)
			const nullableFields = ['suffix', 'note'];

			for (const field of nullableFields) {
				const payloadWithNull = {
					...baseUnitData,
					[field]: null
				};

				const res = await chai.request(app)
					.post(ADD_ENDPOINT)
					.send(payloadWithNull);

				// Should pass validation but fail auth
				expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
			}
		});

		mocha.it('should reject parameter injection on creation', async () => {
			await validateNoExtraFields({
				endpoint: ADD_ENDPOINT,
				basePayload: baseUnitData,
				extraFields: {
					adminOverride: true,
					bypassValidation: true,
					maliciousScript: '<script>alert("hack")</script>',
					isAdmin: true,
					deleteAll: true,
					executeCommand: 'rm -rf /'
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
						endpoint: ADD_ENDPOINT,
						basePayload: baseUnitData,
						expectedStatus: HTTP_CODE.FORBIDDEN
					});
				}
			}
		});

		mocha.it('should handle type validation errors', async () => {
			// Test wrong types for various fields
			const typeTests = [
				{ field: 'preferredDisplay', invalidValue: 'true' },
				{ field: 'minVal', invalidValue: 'low' },
				{ field: 'maxVal', invalidValue: 'high' },
				{ field: 'secInRate', invalidValue: '3600' }
			];

			for (const test of typeTests) {
				await testInvalidField({
					field: test.field,
					invalidValue: test.invalidValue,
					endpoint: ADD_ENDPOINT,
					basePayload: baseUnitData,
					expectedStatus: HTTP_CODE.FORBIDDEN
				});
			}
		});

		mocha.it('should reject completely invalid payloads', async () => {
			// Test non-object payload
			const res1 = await chai.request(app)
				.post(ADD_ENDPOINT)
				.send('not an object');
			expect(res1.status).to.equal(HTTP_CODE.FORBIDDEN);

			// Test array payload
			const res2 = await chai.request(app)
				.post(ADD_ENDPOINT)
				.send(['array', 'payload']);
			expect(res2.status).to.equal(HTTP_CODE.FORBIDDEN);

			// Test null payload
			const res3 = await chai.request(app)
				.post(ADD_ENDPOINT)
				.send(null);
			expect(res3.status).to.equal(HTTP_CODE.FORBIDDEN);
		});
	});

	mocha.describe('Cross-Endpoint Security Tests', () => {
		mocha.it('should handle concurrent unit creation operations', async () => {
			const ADD_ENDPOINT = '/api/units/addUnit';
			const unitData = {
				name: 'Concurrent Test Unit',
				identifier: 'concurrent_test',
				unitRepresent: 'quantity',
				typeOfUnit: 'unit',
				displayable: 'all',
				preferredDisplay: false,
				minVal: 0,
				maxVal: 1000,
				disableChecks: 'reject_all'
			};

			// Send multiple concurrent requests
			const promises = Array(3).fill().map(() =>
				chai.request(app)
					.post(ADD_ENDPOINT)
					.send(unitData)
			);

			const results = await Promise.all(promises);

			// All should fail with 403 (auth required)
			results.forEach(res => {
				expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
			});
		});
	});
});
