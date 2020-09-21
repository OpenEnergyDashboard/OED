/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Imports. We use the testing TDD testing framework Mocha and the assertion
 * library Chai.
 */

const chai = require('chai');
const mocha = require('mocha');

const expect = chai.expect;

const { sample, sineWave, write_to_csv } = require('../data/generateTestData');

mocha.describe('Trying out mocha', () => {
	mocha.it('should be able to compare two arrays', () => {
		const test_array = [0, 1];
		expect(test_array).deep.to.equal([0, 1]);
	});
});

// Generate a simple set of numbers
mocha.describe('The sample data generator', () => {
	mocha.it('should be able to generate a simple array from 1 to 100 with step 1', () => {
		// https://stackoverflow.com/questions/3746725/how-to-create-an-array-containing-1-n
		const one_to_hundred = Array.from({ length: 100 }, (_, i) => i + 1);
		const sample_array = sample(1, 100, 99);
		expect(one_to_hundred).to.deep.equal(sample_array);
	});
	mocha.it('should be able to generate an array with .2 stepSize', () => {
		const test = [];
		for (i = 0; i <= 100; i++) {
			test[i] = i * .2 + 0;
		}
		const sample_array = sample(0, 20, 100);
		expect(test).to.deep.equal(sample_array);
	});
});

// The sine wave function should work
mocha.describe('The sine wave generator', () => {
	mocha.it('can generate a simple sinewave', () => {
		const simple_sinwave = sample(0, Math.PI, 1000).map(Math.sin);
		const test_sinewave = sineWave(sample(0, Math.PI, 1000));
		expect(simple_sinwave).to.deep.equal(test_sinewave);
	});
});