/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const ConversionSegment = require('../../models/ConversionSegment');
const Conversion = require('../../models/Conversion');
const invertConversion = require('./pathConversion').invertConversion;
const updatedConversion = require('./pathConversion').updatedConversion;

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
		//segments are sorted by start_time in getBySourceDestination
		let segments = await ConversionSegment.getBySourceDestination(sourceId, destinationId, conn);
		// Did not find the conversion segments. Since conversion should exist, it must be the other way around and bidirectional.
		if (!segments || segments.length === 0) {
			// Check if reverse conversion exists and is bidirectional
			const reverseConversion = await Conversion.getBySourceDestination(destinationId, sourceId, conn);
			// This should never happen. It should have been in the table one way or the other.
			if (!reverseConversion || !reverseConversion.bidirectional) {
				throw Error(`No bidirectional conversion found between ${sourceId} and ${destinationId}`);
			}
			// Fetch reverse segments and invert them
			const reverseSegments = await ConversionSegment.getBySourceDestination(destinationId, sourceId, conn);
			// This is also really weird that it exist and yet no segments found.
			if (!reverseSegments || reverseSegments.length === 0) {
				throw Error(`No conversion segments found for reverse direction between ${destinationId} and ${sourceId}`);
			}
			segments = reverseSegments.map(seg => ({
				...seg,
				slope: invertConversion(seg.slope, seg.intercept)[0],
				intercept: invertConversion(seg.slope, seg.intercept)[1]
			}));
		}
		edgeSegments.push(segments);
	}

	// 2. Initialize pointers for each edge
	const pointers = Array(path.length - 1).fill(0);

	// 3. Main loop
	let currentStart = Number.NEGATIVE_INFINITY;
	const results = [];
	let done = false;
	while (!done) {
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

		if (currentEnd === Number.POSITIVE_INFINITY) {
			done = true;
		} else {
			// Advance pointers for segments ending at currentEnd
			for (let i = 0; i < pointers.length; ++i) {
				if (parsePostgresDate(currentSegments[i].endTime) === currentEnd) {
					pointers[i]++;
				}
			}
		}
		currentStart = currentEnd;
	}

	return results;
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
