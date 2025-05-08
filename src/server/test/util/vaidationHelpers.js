const { expect } = require('chai');
const chaiHttp = require('chai-http');
const { chai, app } = require('../common');

chai.use(chaiHttp);

async function testInvalidField({ field, invalidValue, endpoint, basePayload, expectedStatus = 400 }) {
    const payload = { ...basePayload, [field]: invalidValue };
    const res = await chai.request(app).post(endpoint).send(payload);
    expect(res).to.have.status(expectedStatus);
}

async function validateString({ field, endpoint, basePayload, required = true, minLength = 1, maxLength = 255, enumValues = null }) {
    console.log(`Validating string field: ${field}`);

    if (required) await testInvalidField({ field, invalidValue: undefined, endpoint, basePayload });

    if (minLength > 0) await testInvalidField({ field, invalidValue: '', endpoint, basePayload });

    await testInvalidField({ field, invalidValue: 'x'.repeat(maxLength + 1), endpoint, basePayload });

    if (enumValues) {
        await testInvalidField({ field, invalidValue: 'INVALID_ENUM', endpoint, basePayload });
    }
}

async function validateInt({ field, endpoint, basePayload, required = true, min = 0, max = 999999 }) {
    console.log(`Validating integer field: ${field}`);

    if (required) await testInvalidField({ field, invalidValue: undefined, endpoint, basePayload });

    await testInvalidField({ field, invalidValue: min - 1, endpoint, basePayload });

    await testInvalidField({ field, invalidValue: max + 1, endpoint, basePayload });

    await testInvalidField({ field, invalidValue: 'notAnInteger', endpoint, basePayload });
}

async function validateBool({ field, endpoint, basePayload, required = true }) {
    if (required) await testInvalidField({ field, invalidValue: undefined, endpoint, basePayload });

    await testInvalidField({ field, invalidValue: 'notABool', endpoint, basePayload });
}

module.exports = {
    validateString,
    validateInt,
    validateBool
};
