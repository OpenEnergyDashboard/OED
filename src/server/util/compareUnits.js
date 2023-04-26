/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { expect } = require('../test/common');
const Unit = require('../models/Unit');

/**
 * Compares the expected and actual units.
 * @param {*} expected The expected unit.
 * @param {*} actual The actual unit.
 */
function expectUnitToBeEquivalent(expected, actual) {
    expect(actual).to.have.property('id', expected.id);
    expect(actual).to.have.property('name', expected.name);
    expect(actual).to.have.property('identifier', expected.identifier);
    expect(actual).to.have.property('unitRepresent', expected.unitRepresent);
    expect(actual).to.have.property('secInRate', expected.secInRate);
    expect(actual).to.have.property('typeOfUnit', expected.typeOfUnit);
    expect(actual).to.have.property('unitIndex', expected.unitIndex);
    expect(actual).to.have.property('suffix', expected.suffix);
    expect(actual).to.have.property('displayable', expected.displayable);
    expect(actual).to.have.property('preferredDisplay', expected.preferredDisplay);
    expect(actual).to.have.property('note', expected.note);
}

/**
 * Compares the expected and actual lists of units.
 * @param {*} expected The expected list of unit.
 * @param {*} actual The actual list of unit.
 */
function expectArrayOfUnitsToBeEquivalent(expected, actual) {
    expect(expected.length).to.be.equal(actual.length);
    // Need to sort before comparing.
    expected.sort((a, b) => a.id - b.id);
    actual.sort((a, b) => a.id - b.id);

    for (let i = 0; i < expected.length; ++i) {
        expectUnitToBeEquivalent(expected[i], actual[i]);
    }
}

module.exports = {
    expectUnitToBeEquivalent,
    expectArrayOfUnitsToBeEquivalent
};
