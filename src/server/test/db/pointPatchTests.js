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
		const point = new Point(0.000001, 0.000001);
		const { returned } = await conn.one('SELECT ${point} AS returned', { point: point });
		expect(returned).to.have.property('x');
		expect(returned).to.have.property('y');
		expect(returned).to.have.property('_rawDBType');
		expect(returned).to.have.property('formatDBType');
	});

	mocha.it('patches points to the correct value', async () => {
		const conn = testDB.getConnection();
		const point = new Point(0.000001, 0.000001);
		const { returned } = await conn.one('SELECT ${point} AS returned', { point: point });
		expect(returned).to.have.property('x', point.x);
		expect(returned).to.have.property('y', point.y);
	});
});
