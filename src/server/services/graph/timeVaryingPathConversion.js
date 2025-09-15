/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const ConversionSegment = require('../../models/ConversionSegment');

/**
 * Chains time-varying conversions along a path, producing combined segments for cik_vary.
 * Each edge in the path may have multiple time segments (start_time, end_time, slope, intercept).
 * The algorithm aligns all segments and combines them for each time range.
 * @param {*} path Array of units (nodes) from source to destination.
 * @param {*} conn Database connection.
 * @returns Array of {source, destination, startTime, endTime, slope, intercept}
 */
async function timeVaryingPathConversion(path, conn) {

	// 1. Fetch and sort segments for each edge
	const edgeSegments = [];
	for (let i = 0; i < path.length - 1; ++i) {
		const sourceId = path[i].id;
		const destinationId = path[i + 1].id;
		let segments = await ConversionSegment.getBySourceDestination(sourceId, destinationId, conn);
		segments = segments.sort((a, b) => parsePostgresDate(a.startTime) - parsePostgresDate(b.startTime));
		edgeSegments.push(segments);
	}

	// 2. Initialize pointers for each edge
	const pointers = Array(path.length - 1).fill(0);

	// 3. Main loop
	let currentStart = Number.NEGATIVE_INFINITY;
	const results = [];
	while (true) {
		// Find current segments for each edge
		const currentSegments = edgeSegments.map((segments, idx) => segments[pointers[idx]]);
		// Find minimum end time among current segments
		let currentEnd = Math.min(...currentSegments.map(seg => parsePostgresDate(seg.endTime)));

		// Combine conversions for the path
		let slope = 1, intercept = 0;
		for (const seg of currentSegments) {
			[slope, intercept] = updatedConversion(slope, intercept, seg.slope, seg.intercept);
		}
		results.push({
			source: path[0].id,
			destination: path[path.length - 1].id,
			start_time: toPostgresTimestamp(currentStart),
			end_time: toPostgresTimestamp(currentEnd),
			slope,
			intercept
		});

		// Advance pointers for segments ending at currentEnd
		let done = false;
		for (let i = 0; i < pointers.length; ++i) {
			if (parsePostgresDate(currentSegments[i].endTime) === currentEnd) {
				pointers[i]++;
				if (pointers[i] >= edgeSegments[i].length) {
					done = true;
				}
			}
		}
		if (done || currentEnd === Number.POSITIVE_INFINITY) {
			break;
		}
		currentStart = currentEnd;
	}

	return results;
}

/**
 * Chains two conversions: (slope1, intercept1) and (slope2, intercept2)
 * Returns [slope, intercept] for the combined conversion.
 */
function updatedConversion(origSlope, origIntercept, newSlope, newIntercept) {
	const slope = origSlope * newSlope;
	const intercept = newSlope * origIntercept + newIntercept;
	return [slope, intercept];
}

function parsePostgresDate(val) {

	if (val === 'infinity') {
		return Number.POSITIVE_INFINITY;
	}
	if (val === '-infinity') {
		return Number.NEGATIVE_INFINITY;
	}
	if (typeof val === 'string') {
		return new Date(val).getTime();
	}
}
function toPostgresTimestamp(val) {
	if (val === Infinity) {
		return 'infinity';
	}
	if (val === -Infinity) {
		return '-infinity';
	}
	return new Date(val);
}

module.exports = { timeVaryingPathConversion };
