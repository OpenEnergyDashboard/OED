const { expect } = require('chai');
const chaiHttp = require('chai-http');
const { chai, app } = require('../common');

chai.use(chaiHttp);

/**
 * Sends a POST request with a modified payload to test a specific invalid field.
// SHL: I don't see options as a parameter.
 * @param {Object} options - Test options.
 * @param {string} options.field - The field name to test.
 * @param {*} options.invalidValue - The invalid value to test with.
 * @param {string} options.endpoint - The API endpoint to test against.
 * @param {Object} options.basePayload - The base valid payload.
// SHL: Unsure why this is in [ ]. Is it to show the default? If so, maybe give default in the description as JSDoc does not seem to support default values directly.
 * @param {number} [options.expectedStatus=400] - Expected HTTP response status.
 */
async function testInvalidField({ field, invalidValue, endpoint, basePayload, expectedStatus = 400 }) {
	const payload = { ...basePayload, [field]: invalidValue };
	const res = await chai.request(app).post(endpoint).send(payload);
	expect(res).to.have.status(expectedStatus);
}

/**
 * Tests that the API rejects when maxVal is less than minVal
  // SHL: See above on param comments.
* @param {Object} params
 * @param {string} params.endpoint - API endpoint to test
 * @param {Object} params.basePayload - Base payload with valid values
 */
// SHL: I'm stopping commenting on formatting and non-tab indenting but all files should be checked.
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
 * Validates string field behavior for required, length, and enum constraints.
 // SHL: See above on param comments.
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
// SHL: Is this a debug statement?
	console.log(`Validating string field: ${field}`);

	if (required) {
		await testInvalidField({ field, invalidValue: undefined, endpoint, basePayload });
	}

// SHL: Would it be better to create a string one less than min as value similar to max?
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
// SHL: Extra space at start of line. Probably should use format document in VSC on all files.
// SHL: Would null or undefined be better?
 async function validateInt({ field, endpoint, basePayload, required = true, min = null, max = null }) {
	if (required) {
// SHL: If I understand the code, the test is sending the field in the route with undefined.
// This seems different than it being absent when required.
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
 * Validates boolean field by checking undefined and non-boolean inputs.
 * @param {Object} options - Validation options.
 * @param {string} options.field - The field to validate.
 * @param {string} options.endpoint - The API endpoint.
 * @param {Object} options.basePayload - The base valid request payload.
 * @param {boolean} [options.required=true] - Whether the field is required.
 */
async function validateBool({ field, endpoint, basePayload, required = true }) {
// SHL: Is this a debug statement?
	console.log(`Validating boolean field: ${field}`);

	if (required) {
		await testInvalidField({ field, invalidValue: undefined, endpoint, basePayload });
	}

	await testInvalidField({ field, invalidValue: 'notABool', endpoint, basePayload });
}

module.exports = {
	validateString,
	validateInt,
	validateBool,
	validateMinMaxRelation
};
