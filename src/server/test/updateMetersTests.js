/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const chai = require('chai');
const mocha = require('mocha');
const sinon = require('sinon');
const { log } = require('../log');
const updateMeters = require('../services/updateMeters');

const expect = chai.expect;

mocha.describe('updateMeters', () => {
	mocha.it('returns successful data-reader results and omits failures', async () => {
		const infoStub = sinon.stub(log, 'info');
		const errorStub = sinon.stub(log, 'error');
		const meters = [{ id: 1 }, { id: 2 }, { id: 3 }];
		const dataReader = async meter => {
			if (meter.id === 2) {
				throw new Error('expected test failure');
			}
			return { meterId: meter.id };
		};

		try {
			const results = await updateMeters(dataReader, meters, {});
			expect(results).to.deep.equal([{ meterId: 1 }, { meterId: 3 }]);
			expect(errorStub.calledOnce).to.equal(true);
		} finally {
			infoStub.restore();
			errorStub.restore();
		}
	});
});
