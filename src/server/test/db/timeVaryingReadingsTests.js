/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { mocha, expect, testDB } = require('../common');
const refreshAllReadingViews = require('../../services/refreshAllReadingViews');

const START = '2021-06-01 00:00:00';
const END = '2021-06-06 00:00:00';
const DELTA = 0.0000001;

const quantityReadings = [
	[24, '2021-06-01 00:00:00', '2021-06-02 00:00:00'],
	[21, '2021-06-02 00:00:00', '2021-06-02 12:00:00'],
	[27, '2021-06-02 12:00:00', '2021-06-03 00:00:00'],
	[72, '2021-06-03 00:00:00', '2021-06-04 00:00:00'],
	[96, '2021-06-04 00:00:00', '2021-06-05 00:00:00'],
	[120, '2021-06-05 00:00:00', '2021-06-06 00:00:00']
];

const flowReadings = [
	[1, '2021-06-01 00:00:00', '2021-06-02 00:00:00'],
	[2, '2021-06-02 00:00:00', '2021-06-03 00:00:00'],
	[2.6875, '2021-06-03 00:00:00', '2021-06-03 09:00:00'],
	[3.125, '2021-06-03 09:00:00', '2021-06-03 21:00:00'],
	[3.4375, '2021-06-03 21:00:00', '2021-06-04 00:00:00'],
	[4, '2021-06-04 00:00:00', '2021-06-05 00:00:00'],
	[5, '2021-06-05 00:00:00', '2021-06-06 00:00:00']
];

const conversionSegments = [
	['-infinity', '2021-06-02 04:00:00', 3],
	['2021-06-02 04:00:00', '2021-06-03 18:00:00', 5],
	['2021-06-03 18:00:00', '2021-06-05 00:00:00', 7],
	['2021-06-05 00:00:00', 'infinity', 9]
];

function expectRate(row, expected) {
	expect(row.reading_rate).to.be.closeTo(expected, DELTA);
}

mocha.describe('Time-varying reading conversion boundaries', function () {
	let conn;
	let quantityMeterId;
	let quantityGraphicUnitId;
	let flowMeterId;
	let flowGraphicUnitId;

	mocha.beforeEach(async function () {
		conn = testDB.getConnection();

		const units = await conn.many(`
			INSERT INTO units (
				name, identifier, unit_represent, sec_in_rate, type_of_unit,
				suffix, displayable, preferred_display, note
			)
			VALUES
				('TV Quantity Source', 'tv_quantity_source', 'quantity', 3600, 'meter', '', 'none', false, ''),
				('TV Quantity Graphic', 'tv_quantity_graphic', 'quantity', 3600, 'unit', '', 'all', false, ''),
				('TV Flow Source', 'tv_flow_source', 'flow', 60, 'meter', '', 'none', false, ''),
				('TV Flow Graphic', 'tv_flow_graphic', 'flow', 60, 'unit', '', 'all', false, '')
			RETURNING id, name
		`);
		const unitIds = Object.fromEntries(units.map(unit => [unit.name, unit.id]));
		quantityGraphicUnitId = unitIds['TV Quantity Graphic'];
		flowGraphicUnitId = unitIds['TV Flow Graphic'];

		const meters = await conn.many(`
			INSERT INTO meters (
				name, enabled, displayable, meter_type, default_timezone_meter,
				identifier, unit_id, default_graphic_unit, reading_frequency
			)
			VALUES
				('TV Quantity Meter', false, true, 'other', 'UTC', 'tv_quantity_meter',
					\${quantitySourceId}, \${quantityGraphicUnitId}, INTERVAL '1 hour'),
				('TV Flow Meter', false, true, 'other', 'UTC', 'tv_flow_meter',
					\${flowSourceId}, \${flowGraphicUnitId}, INTERVAL '1 hour')
			RETURNING id, name
		`, {
			quantitySourceId: unitIds['TV Quantity Source'],
			quantityGraphicUnitId,
			flowSourceId: unitIds['TV Flow Source'],
			flowGraphicUnitId
		});
		const meterIds = Object.fromEntries(meters.map(meter => [meter.name, meter.id]));
		quantityMeterId = meterIds['TV Quantity Meter'];
		flowMeterId = meterIds['TV Flow Meter'];

		for (const [sourceId, destinationId] of [
			[unitIds['TV Quantity Source'], quantityGraphicUnitId],
			[unitIds['TV Flow Source'], flowGraphicUnitId]
		]) {
			await conn.none('INSERT INTO cik (source_id, destination_id) VALUES (\${sourceId}, \${destinationId})', {
				sourceId,
				destinationId
			});
			for (const [startTime, endTime, slope] of conversionSegments) {
				await conn.none(`
					INSERT INTO cik_vary (source_id, destination_id, start_time, end_time, slope, intercept)
					VALUES (\${sourceId}, \${destinationId}, \${startTime}, \${endTime}, \${slope}, 0)
				`, { sourceId, destinationId, startTime, endTime, slope });
			}
		}

		const readingRows = [
			...quantityReadings.map(reading => [quantityMeterId, ...reading]),
			...flowReadings.map(reading => [flowMeterId, ...reading])
		];
		await conn.none(`
			INSERT INTO readings (meter_id, reading, start_timestamp, end_timestamp)
			SELECT meter_id, reading, start_timestamp, end_timestamp
			FROM jsonb_to_recordset(\${readings:json}::jsonb) AS input(
				meter_id INTEGER,
				reading FLOAT,
				start_timestamp TIMESTAMP,
				end_timestamp TIMESTAMP
			)
		`, {
			readings: readingRows.map(([meterId, reading, startTimestamp, endTimestamp]) => ({
				meter_id: meterId,
				reading,
				start_timestamp: startTimestamp,
				end_timestamp: endTimestamp
			}))
		});

		await refreshAllReadingViews({ rebuild: true });
	});

	mocha.it('splits quantity and flow hourly rows at each conversion boundary', async function () {
		const quantity = await conn.many(`
			SELECT bucket, reading_rate, min_rate, max_rate
			FROM meter_hourly_readings_unit_cagg
			WHERE meter_id = \${meterId} AND graphic_unit_id = \${graphicUnitId}
			ORDER BY bucket
		`, { meterId: quantityMeterId, graphicUnitId: quantityGraphicUnitId });
		const flow = await conn.many(`
			SELECT bucket, reading_rate, min_rate, max_rate
			FROM meter_hourly_readings_unit_cagg
			WHERE meter_id = \${meterId} AND graphic_unit_id = \${graphicUnitId}
			ORDER BY bucket
		`, { meterId: flowMeterId, graphicUnitId: flowGraphicUnitId });

		expect(quantity).to.have.lengthOf(120);
		expect(flow).to.have.lengthOf(120);

		for (const [hour, expected] of [[24, 5.25], [28, 8.75], [36, 11.25], [66, 21], [96, 45]]) {
			expectRate(quantity[hour], expected);
			expect(quantity[hour].min_rate).to.be.closeTo(expected, DELTA);
			expect(quantity[hour].max_rate).to.be.closeTo(expected, DELTA);
		}
		for (const [hour, expected] of [[24, 360], [28, 600], [57, 937.5], [66, 1312.5], [69, 1443.75], [96, 2700]]) {
			expectRate(flow[hour], expected);
			expect(flow[hour].min_rate).to.be.closeTo(expected, DELTA);
			expect(flow[hour].max_rate).to.be.closeTo(expected, DELTA);
		}
	});

	mocha.it('duration-weights a conversion boundary inside an hour', async function () {
		await conn.any(`
			UPDATE cik_vary
			SET end_time = '2021-06-02 04:30:00'
			WHERE end_time = '2021-06-02 04:00:00';

			UPDATE cik_vary
			SET start_time = '2021-06-02 04:30:00'
			WHERE start_time = '2021-06-02 04:00:00';

			SELECT rebuild_hourly_hypertable_split();
		`);
		await refreshAllReadingViews();

		const splitRows = await conn.many(`
			SELECT meter_id, start_timestamp, end_timestamp, slope
			FROM hypertable_hourly_split
			WHERE meter_id IN (\${quantityMeterId}, \${flowMeterId})
			  AND start_timestamp >= '2021-06-02 04:00:00'
			  AND end_timestamp <= '2021-06-02 05:00:00'
			ORDER BY meter_id, start_timestamp
		`, { quantityMeterId, flowMeterId });
		expect(splitRows).to.have.lengthOf(4);
		expect(splitRows.map(row => row.end_timestamp.diff(row.start_timestamp, 'seconds')))
			.to.deep.equal([1800, 1800, 1800, 1800]);

		const quantity = await conn.one(`
			SELECT reading_rate, min_rate, max_rate
			FROM meter_hourly_readings_unit_cagg
			WHERE meter_id = \${meterId} AND graphic_unit_id = \${graphicUnitId}
			  AND bucket = '2021-06-02 04:00:00'
		`, { meterId: quantityMeterId, graphicUnitId: quantityGraphicUnitId });
		const flow = await conn.one(`
			SELECT reading_rate, min_rate, max_rate
			FROM meter_hourly_readings_unit_cagg
			WHERE meter_id = \${meterId} AND graphic_unit_id = \${graphicUnitId}
			  AND bucket = '2021-06-02 04:00:00'
		`, { meterId: flowMeterId, graphicUnitId: flowGraphicUnitId });

		expectRate(quantity, 7);
		expect(quantity.min_rate).to.be.closeTo(5.25, DELTA);
		expect(quantity.max_rate).to.be.closeTo(8.75, DELTA);
		expectRate(flow, 480);
		expect(flow.min_rate).to.be.closeTo(360, DELTA);
		expect(flow.max_rate).to.be.closeTo(600, DELTA);
	});

	mocha.it('uses duration-weighted daily averages', async function () {
		const quantity = await conn.many(`
			SELECT bucket, reading_rate, min_rate, max_rate
			FROM meter_daily_readings_unit_cagg
			WHERE meter_id = \${meterId} AND graphic_unit_id = \${graphicUnitId}
			ORDER BY bucket
		`, { meterId: quantityMeterId, graphicUnitId: quantityGraphicUnitId });
		const flow = await conn.many(`
			SELECT bucket, reading_rate, min_rate, max_rate
			FROM meter_daily_readings_unit_cagg
			WHERE meter_id = \${meterId} AND graphic_unit_id = \${graphicUnitId}
			ORDER BY bucket
		`, { meterId: flowMeterId, graphicUnitId: flowGraphicUnitId });

		[3, 9.41666666666667, 16.5, 28, 45].forEach((expected, index) => expectRate(quantity[index], expected));
		[180, 560, 998.4375, 1680, 2700].forEach((expected, index) => expectRate(flow[index], expected));
		expect(quantity[1].min_rate).to.be.closeTo(5.25, DELTA);
		expect(quantity[1].max_rate).to.be.closeTo(11.25, DELTA);
		expect(flow[2].min_rate).to.be.closeTo(806.25, DELTA);
		expect(flow[2].max_rate).to.be.closeTo(1443.75, DELTA);
	});

	mocha.it('preserves raw meter-reading intervals with duration-weighted conversions', async function () {
		const quantity = await conn.func('meter_line_readings_unit', [
			[quantityMeterId], quantityGraphicUnitId, START, END, 'raw', 1440, 1440
		]);
		const flow = await conn.func('meter_line_readings_unit', [
			[flowMeterId], flowGraphicUnitId, START, END, 'raw', 1440, 1440
		]);

		expect(quantity).to.have.lengthOf(quantityReadings.length);
		expect(flow).to.have.lengthOf(flowReadings.length);
		[3, 7.58333333333333, 11.25, 16.5, 28, 45]
			.forEach((expected, index) => expectRate(quantity[index], expected));
		[180, 560, 806.25, 1031.25, 1443.75, 1680, 2700]
			.forEach((expected, index) => expectRate(flow[index], expected));

		quantity.forEach((row, index) => {
			expect(row.start_timestamp.format('YYYY-MM-DD HH:mm:ss')).to.equal(quantityReadings[index][1]);
			expect(row.end_timestamp.format('YYYY-MM-DD HH:mm:ss')).to.equal(quantityReadings[index][2]);
		});
		flow.forEach((row, index) => {
			expect(row.start_timestamp.format('YYYY-MM-DD HH:mm:ss')).to.equal(flowReadings[index][1]);
			expect(row.end_timestamp.format('YYYY-MM-DD HH:mm:ss')).to.equal(flowReadings[index][2]);
		});
	});

	mocha.it('keeps one-hour 3D results consistent with the hourly line', async function () {
		const quantity = await conn.func('meter_3d_readings_unit', [
			[quantityMeterId], quantityGraphicUnitId, START, END, 1
		]);
		const flow = await conn.func('meter_3d_readings_unit', [
			[flowMeterId], flowGraphicUnitId, START, END, 1
		]);

		expect(quantity).to.have.lengthOf(120);
		expect(flow).to.have.lengthOf(120);
		expectRate(quantity[24], 5.25);
		expectRate(quantity[28], 8.75);
		expectRate(flow[57], 937.5);
		expectRate(flow[66], 1312.5);
	});

	mocha.it('produces one-day bars from the corrected daily rates', async function () {
		const quantity = await conn.func('meter_bar_readings_unit', [
			[quantityMeterId], quantityGraphicUnitId, 1, START, END
		]);
		const flow = await conn.func('meter_bar_readings_unit', [
			[flowMeterId], flowGraphicUnitId, 1, START, END
		]);

		[72, 226, 396, 672, 1080].forEach((expected, index) => {
			expect(quantity[index].reading).to.be.closeTo(expected, DELTA);
		});
		[4320, 13440, 23962.5, 40320, 64800].forEach((expected, index) => {
			expect(flow[index].reading).to.be.closeTo(expected, DELTA);
		});
	});
});
