/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const chai = require('chai');

const expect = chai.expect;
const mocha = require('mocha');

const { estimateRawExportSizeMB } = require('../../../common/RawExportFileSize');

mocha.describe('Raw Export File Size Estimator', () => {
    mocha.it('returns zero for zero readings', () => {
        expect(estimateRawExportSizeMB(0)).to.be.closeTo(0, 0.001);
    });

    mocha.it('returns 0.082 MB for 1000 readings', () => {
        expect(estimateRawExportSizeMB(1000)).to.be.closeTo(0.082, 0.001);
    });

    mocha.it('returns 0.11808 MB for 1440 readings', () => {
        expect(estimateRawExportSizeMB(1440)).to.be.closeTo(0.11808, 0.001);
    });

    mocha.it('returns 0.71832 MB for 8760 readings', () => {
        expect(estimateRawExportSizeMB(8760)).to.be.closeTo(0.71832, 0.001);
    });
});