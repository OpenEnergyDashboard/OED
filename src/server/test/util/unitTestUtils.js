/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { chai, mocha, expect, app} = require('../common');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const chaiRequest = require('chai').request;
// SHL: Please remove blank line between imports.

const Unit = require('../../models/Unit')
const { getUnitId } = require('../../util/readingsUtils');

const validPayload = {
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

/**
 * Applies a mutation to a base object for testing.
 * @param {Object} base - The base valid object.
 * @param {Object} [mutation={}] - Mutation descriptor.
 * @returns {Object} The mutated object.
 */
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
// SHL: I'm curious why some cases return the value and some set the value. Could they all set the value so one return at end?
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
 * Generates and runs validation test cases for a unit-related API endpoint.
// SHL: See other comments on params.
 * @param {Object} params - Parameters for generating the tests.
 * @param {string} [params.method='post'] - HTTP method to use (e.g., 'post', 'put').
 * @param {string} params.endpoint - API endpoint to test.
 * @param {string} params.unitName - Name of the unit to look up its ID.
 * @param {Object} [params.options={}] - Additional options passed to the base payload generator.
 * @param {Array} params.cases - Array of test cases with name, expectedStatus, and mutation logic.
 */
function generateUnitValidationTests({method = 'post', endpoint, unitName, options = {}, cases }) {
	cases.forEach(({ name, expectedStatus, mutation }) => {
		mocha.it(name, async () => {
			const id = await getUnitId(unitName);
			const basePayload = getBaseValidUnit(id, options); 
			const payload = applyMutation(basePayload, mutation);
			const res = await chaiRequest(app)[method](endpoint).send(payload);
			expect(res).to.have.status(expectedStatus);
		});
	});
}

/**
 * Returns a valid unit payload used as the base for mutation tests.
 * @param {number} id - Unit ID.
 * @param {Object} [options={}] - Additional config like skipId.
 * @returns {Object} A valid unit payload.
 */
function getBaseValidUnit(id, options = {}) {
	if (!options.skipId && id !== undefined) {
		validPayload.id = id;
	}

	return validPayload;
};

module.exports = {
	generateUnitValidationTests,
	getBaseValidUnit
};
