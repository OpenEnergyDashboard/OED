const { chai, mocha, expect, app, testDB, testUser, recreateDB } = require('../common');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const chaiRequest = require('chai').request;

/**
 * Applies a mutation to a base object for testing.
 * @param {Object} base - The base valid object.
 * @param {Object} [mutation={}] - Mutation descriptor.
 * @returns {Object} The mutated object.
 */
// SHL: Should mutation have a default value?
// BM: I think it shouldn't have default value because just in case in the future, there is different base payload and this function could potentially reuse.
function applyMutation(base, mutation = {}) {
	const mutated = { ...base };

	switch (mutation.type) {
		case 'remove':
			delete mutated[mutation.field];
			break;
		case 'change':
			mutated[mutation.field] = mutation.value;
			break;
		case 'custom':
			return mutation.body;
		case undefined:
			// No mutation provided, return original
			return base;
		default:
			throw new Error(`Unknown mutation type: ${mutation.type}`);
	}

	return mutated;
}

/**
 * Generates Mocha tests based on mutation cases to validate a unit endpoint.
 * @param {Object} options - Configuration object.
 * @param {Object} options.app - Express app instance.
 * @param {string} [options.method='post'] - HTTP method.
 * @param {string} options.endpoint - API endpoint.
 * @param {Object} options.Unit - Unit model reference.
 * @param {Function} options.getId - Async function to retrieve a valid ID.
 * @param {Object} [options.options={}] - Additional config like skipId.
 * @param {Array} options.cases - Array of test case descriptors.
 */
function generateUnitValidationTests({ app, method = 'post', endpoint, Unit, getId, options = {}, cases }) {
	cases.forEach(({ name, expectedStatus, mutation }) => {
		mocha.it(name, async () => {
			const id = await getId();
			const basePayload = getBaseValidUnit(id, Unit, options);
			const payload = applyMutation(basePayload, mutation);
			const res = await chaiRequest(app)[method](endpoint).send(payload);
			expect(res).to.have.status(expectedStatus);
		});
	});
}

/**
 * Returns a valid unit payload used as the base for mutation tests.
 * @param {number} id - Unit ID.
 * @param {Object} Unit - Unit model reference.
 * @param {Object} [options={}] - Additional config like skipId.
 * @returns {Object} A valid unit payload.
 */
function getBaseValidUnit(id, Unit, options = {}) {
	const payload = {
		name: 'Water Flow Unit',
		identifier: 'energy_unit',
		unitRepresent: Unit.unitRepresentType.FLOW,
		secInRate: 60,
		typeOfUnit: Unit.unitType.UNIT,
		suffix: 'L/s',
		displayable: Unit.displayableType.ALL,
		preferredDisplay: true,
		note: 'Used to measure water flow',
		minVal: 1,
		maxVal: 100,
		disableChecks: Unit.disableChecksType.REJECT_BAD
	};

	if (!options.skipId && id !== undefined) {
		payload.id = id;
	}

	return payload;
}
// SHL: only 1 blank line - do everywhere
// BM: fixed

module.exports = {
	generateUnitValidationTests,
	getBaseValidUnit
};
