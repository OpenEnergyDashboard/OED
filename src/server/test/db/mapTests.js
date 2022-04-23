/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { mocha, expect, testDB } = require('../common');
const { Map } = require('../../models/Map');
const Point = require('../../models/Point');
const day = require('day');

function expectPointsToBeEquivalent(expected, actual) {
	expect(actual).to.have.property('longitude', expected.longitude);
	expect(actual).to.have.property('latitude', expected.latitude);
}

function expectMapsToBeEquivalent(expected, actual) {
	expect(actual).to.have.property('id', expected.id);
	expect(actual).to.have.property('name', expected.name);
	expect(actual).to.have.property('displayable', expected.displayable);
	expect(actual).to.have.property('note', expected.note);
	expect(actual).to.have.property('filename', expected.filename);
	expect(actual.modifiedDate.isSame(expected.modifiedDate)).to.equal(true);
	expectPointsToBeEquivalent(expected.origin, actual.origin);
	expectPointsToBeEquivalent(expected.opposite, actual.opposite);
	expect(actual).to.have.property('mapSource', expected.mapSource);
	expect(actual).to.have.property('northAngle', expected.northAngle);
	expect(actual).to.have.property('circleSize', expected.circleSize);
}

mocha.describe('Maps', () => {
	mocha.beforeEach(async () => {
		conn = await testDB.getConnection();
	});

	mocha.it('can be saved and retrieved', async () => {
		const conn = testDB.getConnection();
		const origin = new Point(0.000001, 0.000001);
		const opposite = new Point(100.000001, 100.000001);
		const mapPreInsert = new Map(undefined, 'Map', false, null, 'default', day('2000-10-10'), origin, opposite, 'placeholder', 22.5, 0.2);
		await mapPreInsert.insert(conn);
		const mapPostInsertByName = await Map.getByName(mapPreInsert.name, conn);
		expectMapsToBeEquivalent(mapPreInsert, mapPostInsertByName);
		const mapPostInsertByID = await Map.getByID(mapPreInsert.id, conn);
		expectMapsToBeEquivalent(mapPreInsert, mapPostInsertByID);
		return Promise.resolve();
	});
});