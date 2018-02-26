/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const chai = require('chai');

const expect = chai.expect;
const mocha = require('mocha');

const { findMaxSemanticVersion, compareSemanticVersion } = require('../../util');

mocha.describe('compareTwoSemanticVersion', () => {
	mocha.it('should compare two version to determine which one is greater', () => {
		const a = '0.2.2';
		const b = '0.2.11';
		expect(compareSemanticVersion(a, b)).to.equal(-1);
	});
});

mocha.describe('findMaxSemanticVersion', () => {
	mocha.it('should find max version in an array of version', () => {
		const array = ['0.1.0', '0.2.2', '0.2.11', '0.4.0'];
		expect(findMaxSemanticVersion(array)).to.equal('0.4.0');
	});
});
