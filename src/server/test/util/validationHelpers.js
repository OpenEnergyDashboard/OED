/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { expect } = require('chai');
const chaiHttp = require('chai-http');
const { chai, app } = require('../common');
const { HTTP_CODE } = require('../../util/readingsUtils');

chai.use(chaiHttp);

/**
 * Sends a POST request to the specified API endpoint with a test payload,
 * setting the given field to an invalid value or removing it entirely
 * if undefined, to test validation errors.
 *
 * @param field the field name in the payload to invalidate
 * @param invalidValue the value to assign to the field for testing; if undefined, the field is removed
 * @param endpoint the API endpoint URL to test (e.g., /api/units/addUnit)
 * @param basePayload the base valid payload object to clone and modify
 * @param expectedStatus the expected HTTP status code (default 400 for validation errors)
 */
async function testInvalidField({ field, invalidValue, endpoint, basePayload, expectedStatus = HTTP_CODE.BAD_REQUEST }) {
	const payload = { ...basePayload };
	if (invalidValue === undefined) {
		delete payload[field]; // remove field to simulate required check
	} else {
		payload[field] = invalidValue;
	}
	const res = await chai.request(app).post(endpoint).send(payload);
	const expectedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
	expect(expectedStatuses).to.include(res.status);
}

/**
 * Validates that the API rejects payloads where minVal is greater than maxVal.
 *
 * @param endpoint the API endpoint URL to test (e.g., /api/units/addUnit)
 * @param basePayload a valid payload object to use as the base for testing
 */
async function validateMinMaxRelation({ endpoint, basePayload }) {
	// Create invalid payload where minVal > maxVal
	const invalidPayload = {
		...basePayload,
		minVal: (basePayload.minVal || 10) + 1,
		maxVal: basePayload.minVal || 10
	};
	const res = await chai.request(app)
		.post(endpoint)
		.send(invalidPayload);

	expect(res).to.have.status(400);
}

/**
 * Validates a string field by testing required presence, min/max length, and enum constraints.
 *
 * @param field the name of the string field to validate
 * @param endpoint the API endpoint to test (e.g., /api/units/addUnit)
 * @param basePayload a valid payload object to start from
 * @param required whether the field is required (default: true)
 * @param minLength the minimum length allowed for the string (default: 1)
 * @param maxLength the maximum length allowed for the string (default: 255)
 * @param enumValues optional array of valid enum values to test against
 */
async function validateString({ field, endpoint, basePayload, required = true, minLength = 1, maxLength = 255, enumValues = null }) {

	if (required) {
		await testInvalidField({ field, invalidValue: undefined, endpoint, basePayload });
	}

	if (minLength > 0) {
		await testInvalidField({ field, invalidValue: 'x'.repeat(minLength - 1), endpoint, basePayload });
	}

	await testInvalidField({ field, invalidValue: 'x'.repeat(maxLength + 1), endpoint, basePayload });

	if (enumValues) {
		await testInvalidField({ field, invalidValue: 'INVALID_ENUM', endpoint, basePayload });
	}
}

/**
 * Validates an integer field by testing for presence (if required), 
 * numeric bounds (min and max), and type correctness.
 *
 * @param field the name of the integer field to validate
 * @param endpoint the API endpoint to test (e.g., /api/units/addUnit)
 * @param basePayload a valid base object used to construct requests
 * @param required whether the field is required (default: true)
 * @param min the minimum allowed integer value (optional)
 * @param max the maximum allowed integer value (optional)
 */
async function validateInt({ field, endpoint, basePayload, required = true, min = null, max = null }) {

	if (required) {
		await testInvalidField({ field, invalidValue: undefined, endpoint, basePayload });
	}

	if (typeof min === 'number') {
		await testInvalidField({ field, invalidValue: min - 1, endpoint, basePayload });
	}

	if (typeof max === 'number') {
		await testInvalidField({ field, invalidValue: max + 1, endpoint, basePayload });
	}

	await testInvalidField({ field, invalidValue: 'notAnInteger', endpoint, basePayload });
}

/**
 * Validates a boolean field by checking for presence (if required)
 * and ensuring the value is a valid boolean.
 *
 * @param field the name of the boolean field to validate
 * @param endpoint the API endpoint to test (e.g., /api/units/addUnit)
 * @param basePayload a valid base object used to construct requests
 * @param required whether the field is required (default: true)
 */
async function validateBool({ field, endpoint, basePayload, required = true }) {
	if (required) {
		await testInvalidField({ field, invalidValue: undefined, endpoint, basePayload });
	}

	await testInvalidField({ field, invalidValue: 'notABool', endpoint, basePayload });
}

/**
 * Tests token validation by sending requests with various invalid token formats.
 *
 * @param endpoint the API endpoint to test
 * @param method the HTTP method (default: 'post')
 * @param sendTokenIn where to send the token ('header', 'body', or 'query')
 */
async function validateToken({ endpoint, method = 'post', sendTokenIn = 'header' }) {
	// Test extremely long token (DoS attack)
	const hugeToken = 'x'.repeat(3000);
	let request = chai.request(app)[method](endpoint);

	if (sendTokenIn === 'header') {
		request = request.set('token', hugeToken);
	} else if (sendTokenIn === 'body') {
		request = request.send({ token: hugeToken });
	} else if (sendTokenIn === 'query') {
		request = request.query({ token: hugeToken });
	}

	const res = await request;
	expect(res).to.have.status(403);

	// Test invalid token format
	request = chai.request(app)[method](endpoint);
	if (sendTokenIn === 'header') {
		request = request.set('token', 12345); // Non-string token
	} else if (sendTokenIn === 'body') {
		request = request.send({ token: 12345 });
	} else if (sendTokenIn === 'query') {
		request = request.query({ token: 12345 });
	}

	const res2 = await request;
	expect(res2).to.have.status(403);
}

/**
 * Validates that endpoints reject malformed comma-separated identifier lists.
 *
 * @param baseEndpoint the base endpoint path before the id segment
 * @param invalidValues array of invalid id strings to test
 * @param query optional query parameters to include (for GET requests)
 * @param method HTTP method (default 'get')
 * @param expectedStatus expected status code (default 400)
 */
async function validateCommaSeparatedIdPatterns({
	baseEndpoint,
	invalidValues,
	query = {},
	method = 'get',
	expectedStatus = HTTP_CODE.BAD_REQUEST
}) {
	for (const invalidValue of invalidValues) {
		let request = chai.request(app)[method](`${baseEndpoint}/${invalidValue}`);

		if (method.toLowerCase() === 'get') {
			request = request.query(query);
		} else {
			request = request.send(query);
		}

		const res = await request;
		expect(res.status).to.equal(expectedStatus);
	}
}

/**
 * Verifies that endpoints accept valid comma-separated identifier lists.
 *
 * @param baseEndpoint the base endpoint path before the id segment
 * @param validValues array of valid id strings to test
 * @param query optional query parameters to include (for GET requests)
 * @param method HTTP method (default 'get')
 * @param expectedStatuses allowable response status codes (defaults to 200/500)
 */
async function expectValidCommaSeparatedIds({
	baseEndpoint,
	validValues,
	query = {},
	method = 'get',
	expectedStatuses = [HTTP_CODE.OK, HTTP_CODE.INTERNAL_SERVER_ERROR]
}) {
	for (const value of validValues) {
		let request = chai.request(app)[method](`${baseEndpoint}/${value}`);

		if (method.toLowerCase() === 'get') {
			request = request.query(query);
		} else {
			request = request.send(query);
		}

		const res = await request;
		expect(expectedStatuses).to.include(res.status);
	}
}

/**
 * Validates that additional properties are rejected when payloads exceed
 * the defined schema.
 *
 * @param endpoint the API endpoint URL to test
 * @param basePayload a baseline valid payload object
 * @param extraFields an object containing the extra fields to send
 * @param expectedStatus expected HTTP status code (default 400)
 */
async function validateNoExtraFields({ endpoint, basePayload, extraFields = {}, expectedStatus = HTTP_CODE.BAD_REQUEST }) {
	const payload = {
		...basePayload,
		...extraFields
	};
	const res = await chai.request(app).post(endpoint).send(payload);
	const expectedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
	expect(expectedStatuses).to.include(res.status);
}

module.exports = {
	testInvalidField,
	validateString,
	validateInt,
	validateBool,
	validateMinMaxRelation,
	validateToken,
	validateCommaSeparatedIdPatterns,
	expectValidCommaSeparatedIds,
	validateNoExtraFields
};
