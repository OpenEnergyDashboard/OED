const { expect } = require('chai');
const chaiHttp = require('chai-http');
const { chai, app } = require('../common');

chai.use(chaiHttp);

/**
 * Sends a POST request with a modified payload to test a specific invalid field.
 * @param {Object} options - Test options.
 * @param {string} options.field - The field name to test.
 * @param {*} options.invalidValue - The invalid value to test with.
 * @param {string} options.endpoint - The API endpoint to test against.
 * @param {Object} options.basePayload - The base valid payload.
 * @param {number} [options.expectedStatus=400] - Expected HTTP response status.
 */
async function testInvalidField({ field, invalidValue, endpoint, basePayload, expectedStatus = 400 }) {
	const payload = { ...basePayload, [field]: invalidValue };
	const res = await chai.request(app).post(endpoint).send(payload);
	expect(res).to.have.status(expectedStatus);
}

/**
 * Validates string field behavior for required, length, and enum constraints.
 * @param {Object} options - Validation options.
 * @param {string} options.field - The name of the field to validate.
 * @param {string} options.endpoint - The endpoint to send the test request to.
 * @param {Object} options.basePayload - The base valid payload.
 * @param {boolean} [options.required=true] - Whether the field is required.
 * @param {number} [options.minLength=1] - Minimum allowed string length.
 * @param {number} [options.maxLength=255] - Maximum allowed string length.
 * @param {string[]|null} [options.enumValues=null] - Valid enum values for the field.
 */
async function validateString({ field, endpoint, basePayload, required = true, minLength = 1, maxLength = 255, enumValues = null }) {
	console.log(`Validating string field: ${field}`);

	if (required) {
		await testInvalidField({ field, invalidValue: undefined, endpoint, basePayload });
	}

	if (minLength > 0) {
		await testInvalidField({ field, invalidValue: '', endpoint, basePayload });
	}

	await testInvalidField({ field, invalidValue: 'x'.repeat(maxLength + 1), endpoint, basePayload });

	if (enumValues) {
		await testInvalidField({ field, invalidValue: 'INVALID_ENUM', endpoint, basePayload });
	}
}

/**
 * Validates integer field behavior including range and type constraints.
 * @param {Object} options - Validation options.
 * @param {string} options.field - The field to test.
 * @param {string} options.endpoint - API endpoint to test.
 * @param {Object} options.basePayload - The base valid request payload.
 * @param {boolean} [options.required=true] - Whether the field is required.
 * @param {number} [options.min=0] - Minimum valid integer.
 * @param {number} [options.max=999999] - Maximum valid integer.
 */
async function validateInt({ field, endpoint, basePayload, required = true, min = 0, max = 999999 }) {
	console.log(`Validating integer field: ${field}`);

	if (required) {
		await testInvalidField({ field, invalidValue: undefined, endpoint, basePayload });
	}

	await testInvalidField({ field, invalidValue: min - 1, endpoint, basePayload });
	await testInvalidField({ field, invalidValue: max + 1, endpoint, basePayload });
	await testInvalidField({ field, invalidValue: 'notAnInteger', endpoint, basePayload });
}

/**
 * Validates boolean field by checking undefined and non-boolean inputs.
 * @param {Object} options - Validation options.
 * @param {string} options.field - The field to validate.
 * @param {string} options.endpoint - The API endpoint.
 * @param {Object} options.basePayload - The base valid request payload.
 * @param {boolean} [options.required=true] - Whether the field is required.
 */
async function validateBool({ field, endpoint, basePayload, required = true }) {
	console.log(`Validating boolean field: ${field}`);

	if (required) {
		await testInvalidField({ field, invalidValue: undefined, endpoint, basePayload });
	}

	await testInvalidField({ field, invalidValue: 'notABool', endpoint, basePayload });
}

module.exports = {
	validateString,
	validateInt,
	validateBool
};
