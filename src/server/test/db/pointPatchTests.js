/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { mocha, expect, testDB } = require('../common');
const Point = require('../../models/Point');

mocha.describe('Point patching', () => {
	mocha.it('patches point', async () => {
		const conn = testDB.getConnection();
		const result = await conn.one('SELECT pg_typeof(${point})', { point: new Point(0.000001, 0.000001) });
		const type = result.pg_typeof;
		expect(type).to.equal('point');
	});

	// mocha.it('patches arrays of moment durations', async () => {
	// 	const conn = testDB.getConnection();
	// 	const result = await conn.one('SELECT pg_typeof(${intervalArr})', { intervalArr: [moment.duration(1, 'days'), moment.duration(2, 'days')] });
	// 	const type = result.pg_typeof;
	// 	expect(type).to.equal('interval[]');
	// });
	//
	mocha.it('patches returned points to defined point types', async () => {
		const conn = testDB.getConnection();
		const point = new Point(100.000001, 100.000001);
		const { returned } = await conn.one('SELECT ${point} AS returned', { point: point });
		expect(returned).to.have.property('longitude');
		expect(returned).to.have.property('latitude');
		expect(returned).to.have.property('rawType');
		expect(returned).to.have.property('toPostgres');
	});

	mocha.it('patches points to the correct value', async () => {
		const conn = testDB.getConnection();
		const point1 = new Point(0.000001, 0.000001);
		const { returned1 } = await conn.one('SELECT ${point} AS returned1', { point: point1 });
		expect(returned1).to.have.property('longitude', point1.longitude);
		expect(returned1).to.have.property('latitude', point1.latitude);
		const point2 = new Point(100.000001, 100.000001);
		const { returned2 } = await conn.one('SELECT ${point} AS returned2', { point: point2 });
		expect(returned2).to.have.property('longitude', point2.longitude);
		expect(returned2).to.have.property('latitude', point2.latitude);
	});
});
