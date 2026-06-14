/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { expect } = require('chai');
const chaiHttp = require('chai-http');
const { chai, app } = require('../common');
const { HTTP_CODES } = require('../../util/httpCodes');

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
 * @param {number|number[]} [expectedStatus=HTTP_CODES.BAD_REQUEST] expected status or list of acceptable statuses
 */
async function testInvalidField({ field, invalidValue, endpoint, basePayload, expectedStatus = HTTP_CODES.BAD_REQUEST }) {
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

	expect(res).to.have.status(HTTP_CODES.BAD_REQUEST);
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
 * @param enumValues optional array of valid enum values (documents allowed set; tests a bogus enum value)
 * @param additionalInvalidEnumValues optional extra invalid values to POST when enumValues is set
 * @param {number|number[]} [expectedStatus=HTTP_CODES.BAD_REQUEST] expected status or list of acceptable statuses
 */
async function validateString({
	field,
	endpoint,
	basePayload,
	required = true,
	minLength = 1,
	maxLength = 255,
	enumValues = null,
	additionalInvalidEnumValues = null,
	expectedStatus = HTTP_CODES.BAD_REQUEST
}) {

	if (required) {
		await testInvalidField({ field, invalidValue: undefined, endpoint, basePayload, expectedStatus });
	}

	if (minLength > 0) {
		await testInvalidField({ field, invalidValue: 'x'.repeat(minLength - 1), endpoint, basePayload, expectedStatus });
	}

	await testInvalidField({ field, invalidValue: 'x'.repeat(maxLength + 1), endpoint, basePayload, expectedStatus });

	if (enumValues) {
		await testInvalidField({ field, invalidValue: 'INVALID_ENUM', endpoint, basePayload, expectedStatus });
		if (additionalInvalidEnumValues) {
			for (const invalidValue of additionalInvalidEnumValues) {
				await testInvalidField({ field, invalidValue, endpoint, basePayload, expectedStatus });
			}
		}
	}
}

/**
 * Validates an integer field by testing for presence (if required),
 * numeric bounds (min and max), type correctness, and common boundary mistakes.
 *
 * @param field the name of the integer field to validate
 * @param endpoint the API endpoint to test (e.g., /api/units/addUnit)
 * @param basePayload a valid base object used to construct requests
 * @param required whether the field is required (default: true)
 * @param min the minimum allowed integer value (optional)
 * @param max the maximum allowed integer value (optional)
 * @param {number|number[]} [expectedStatus=HTTP_CODES.BAD_REQUEST] expected status or list of acceptable statuses
 */
async function validateInt({ field, endpoint, basePayload, required = true, min = null, max = null, expectedStatus = HTTP_CODES.BAD_REQUEST }) {

	if (required) {
		await testInvalidField({ field, invalidValue: undefined, endpoint, basePayload, expectedStatus });
	}

	if (typeof min === 'number') {
		await testInvalidField({ field, invalidValue: min - 1, endpoint, basePayload, expectedStatus });
		if (min > 0) {
			await testInvalidField({ field, invalidValue: -1, endpoint, basePayload, expectedStatus });
		}
		if (min > 1) {
			await testInvalidField({ field, invalidValue: 0, endpoint, basePayload, expectedStatus });
		}
	}

	if (typeof max === 'number') {
		await testInvalidField({ field, invalidValue: max + 1, endpoint, basePayload, expectedStatus });
	}

	await testInvalidField({ field, invalidValue: 'notAnInteger', endpoint, basePayload, expectedStatus });
	await testInvalidField({ field, invalidValue: 1.5, endpoint, basePayload, expectedStatus });
	await testInvalidField({ field, invalidValue: Number.MAX_SAFE_INTEGER + 1, endpoint, basePayload, expectedStatus });
}

/**
 * Validates a boolean field by checking for presence (if required)
 * and ensuring the value is a valid boolean.
 *
 * @param field the name of the boolean field to validate
 * @param endpoint the API endpoint to test (e.g., /api/units/addUnit)
 * @param basePayload a valid base object used to construct requests
 * @param required whether the field is required (default: true)
 * @param {number|number[]} [expectedStatus=HTTP_CODES.BAD_REQUEST] expected status or list of acceptable statuses
 * @param verifyValidBooleanValues if true, also sends true and false and asserts they match expectedStatus (e.g. pass validation, fail auth)
 */
async function validateBool({
	field,
	endpoint,
	basePayload,
	required = true,
	expectedStatus = HTTP_CODES.BAD_REQUEST,
	verifyValidBooleanValues = false
}) {
	if (required) {
		await testInvalidField({ field, invalidValue: undefined, endpoint, basePayload, expectedStatus });
	}

	const invalidBools = ['notABool', 'true', 'false', 'yes', 'no', '', 1, 0, 2];
	for (const invalidValue of invalidBools) {
		await testInvalidField({ field, invalidValue, endpoint, basePayload, expectedStatus });
	}

	if (verifyValidBooleanValues) {
		const expectedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
		for (const validValue of [true, false]) {
			const res = await chai.request(app)
				.post(endpoint)
				.send({ ...basePayload, [field]: validValue });
			expect(expectedStatuses).to.include(res.status);
		}
	}
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
	expect(res).to.have.status(HTTP_CODES.FORBIDDEN);

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
	expect(res2).to.have.status(HTTP_CODES.FORBIDDEN);
}

/**
 * Shared implementation: request baseEndpoint/:invalidValue with optional query/body and
 * assert the response status is one of the expected values.
 *
 * @param baseEndpoint the base endpoint path before the id segment
 * @param invalidValues array of invalid id strings to test
 * @param query optional query parameters to include (for GET requests)
 * @param method HTTP method (default 'get')
 * @param {number|number[]} [expectedStatus=HTTP_CODES.BAD_REQUEST] expected status or list of acceptable statuses
 */
async function validatePathIdSegmentPatterns({
	baseEndpoint,
	invalidValues,
	query = {},
	method = 'get',
	expectedStatus = HTTP_CODES.BAD_REQUEST
}) {
	const expectedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
	for (const invalidValue of invalidValues) {
		let request = chai.request(app)[method](`${baseEndpoint}/${invalidValue}`);

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
 * Validates that endpoints reject malformed comma-separated identifier lists in a path segment.
 *
 * @param baseEndpoint the base endpoint path before the id segment
 * @param invalidValues array of invalid id strings to test
 * @param query optional query parameters to include (for GET requests)
 * @param method HTTP method (default 'get')
 * @param {number|number[]} [expectedStatus=HTTP_CODES.BAD_REQUEST] expected status or list of acceptable statuses
 */
async function validateCommaSeparatedIdPatterns(opts) {
	return validatePathIdSegmentPatterns(opts);
}

/**
 * Validates that endpoints reject invalid single numeric IDs in path parameters
 * (same request pattern as comma-separated lists: one path segment after baseEndpoint).
 *
 * @param baseEndpoint the base endpoint path before the id segment (e.g., '/api/maps')
 * @param invalidValues array of invalid id strings to test
 * @param query optional query parameters to include (for GET requests)
 * @param method HTTP method (default 'get')
 * @param {number|number[]} [expectedStatus=HTTP_CODES.BAD_REQUEST] expected status or list of acceptable statuses
 */
async function validateNumericIdInPath(opts) {
	return validatePathIdSegmentPatterns(opts);
}

/**
 * Verifies that endpoints accept valid comma-separated identifier lists.
 *
 * @param baseEndpoint the base endpoint path before the id segment
 * @param validValues array of valid id strings to test
 * @param query optional query parameters to include (for GET requests)
 * @param method HTTP method (default 'get')
 * @param expectedStatuses allowable response status codes (defaults to HTTP_CODES.OK / INTERNAL_SERVER_ERROR)
 */
async function expectValidCommaSeparatedIds({
	baseEndpoint,
	validValues,
	query = {},
	method = 'get',
	expectedStatuses = [HTTP_CODES.OK, HTTP_CODES.INTERNAL_SERVER_ERROR]
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
 * Verifies that endpoints accept valid single numeric IDs in path parameters.
 * Delegates to expectValidCommaSeparatedIds (one URL segment, same HTTP shape).
 *
 * @param baseEndpoint the base endpoint path before the id segment
 * @param validValues array of valid id strings to test
 * @param query optional query parameters to include (for GET requests)
 * @param method HTTP method (default 'get')
 * @param expectedStatuses allowable response status codes (defaults to OK / NOT_FOUND / INTERNAL_SERVER_ERROR)
 */
async function expectValidNumericIdInPath({
	baseEndpoint,
	validValues,
	query = {},
	method = 'get',
	expectedStatuses = [HTTP_CODES.OK, HTTP_CODES.NOT_FOUND, HTTP_CODES.INTERNAL_SERVER_ERROR]
}) {
	return expectValidCommaSeparatedIds({ baseEndpoint, validValues, query, method, expectedStatuses });
}

/**
 * Validates that GET endpoints require specified query parameters.
 *
 * @param endpoint the full endpoint URL including path (e.g., '/api/readings/line/count/meters/1')
 * @param baseQuery object with all valid query parameters
 * @param requiredParams array of param names that must be present
 * @param method HTTP method (default 'get')
 * @param {number|number[]} [expectedStatus=HTTP_CODES.BAD_REQUEST] expected status or list of acceptable statuses when a param is omitted
 */
async function validateRequiredQueryParams({
	endpoint,
	baseQuery,
	requiredParams,
	method = 'get',
	expectedStatus = HTTP_CODES.BAD_REQUEST
}) {
	for (const param of requiredParams) {
		const incompleteQuery = { ...baseQuery };
		delete incompleteQuery[param];

		let request = chai.request(app)[method](endpoint);
		if (method.toLowerCase() === 'get') {
			request = request.query(incompleteQuery);
		} else {
			request = request.send(incompleteQuery);
		}

		const res = await request;
		const expectedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
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
 * @param {number|number[]} [expectedStatus=HTTP_CODES.BAD_REQUEST] expected status or list of acceptable statuses
 */
async function validateNoExtraFields({ endpoint, basePayload, extraFields = {}, expectedStatus = HTTP_CODES.BAD_REQUEST }) {
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
	validateNumericIdInPath,
	expectValidNumericIdInPath,
	validateRequiredQueryParams,
	validateNoExtraFields
};
