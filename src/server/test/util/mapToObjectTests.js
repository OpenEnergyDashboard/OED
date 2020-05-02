/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const chai = require('chai');

const expect = chai.expect;
const mocha = require('mocha');

const { mapToObject } = require('../../util');


mocha.describe('mapToObject', () => {
	mocha.it('Maps array elements to objects keyed by them', () => {
		const array = [1, 2, 3];
		expect(mapToObject(array, elem => elem * elem)).to.deep.equal({ 1: 1, 2: 4, 3: 9 });
	});

	mocha.it('Maps empty arrays to empty objects', () => {
		expect(mapToObject([], elem => elem)).to.deep.equal({});
	});
});

