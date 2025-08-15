/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { expect } = require('chai');
const chaiHttp = require('chai-http');
const { chai, app, testDB, testUser } = require('../common');
chai.use(chaiHttp);


async function getToken() {
	let res = await chai.request(app).post('/api/login').send({ username: testUser.username, password: testUser.password });
	token = res.body.token;
	return token;
}

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
 async function testInvalidField({ field, invalidValue, endpoint, basePayload }) {
	const token = await getToken(); 
	const payload = { ...basePayload };
	if (invalidValue === undefined) {
		delete payload[field];
	} else {
		payload[field] = invalidValue;
	}
	const res = await chai.request(app)
		.post(endpoint)
		.set('token', token) 
		.send(payload);

	expect(res).to.have.status(400);
}

/**
 * Validates that the API rejects payloads where minVal is greater than maxVal.
 *
 * @param endpoint the API endpoint URL to test (e.g., /api/units/addUnit)
 * @param basePayload a valid payload object to use as the base for testing
 */
async function validateMinMaxRelation({ endpoint, basePayload }) {
	const token = await getToken(); 
    const invalidPayload = {
        ...basePayload,
        minVal: (basePayload.minVal || 10) + 1,  
        maxVal: basePayload.minVal || 10 
    };
    const res = await chai.request(app)
        .post(endpoint)
		.set('token', token) 
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

module.exports = {
	validateString,
	validateInt,
	validateBool,
	validateMinMaxRelation,
	getToken
};
