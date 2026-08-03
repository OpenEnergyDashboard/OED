/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Unit = require('../../models/Unit');
const Conversion = require('../../models/Conversion');
const ConversionSegment = require('../../models/ConversionSegment');
const { getPath } = require('./createConversionGraph');
const { timeVaryingPathConversion } = require('./timeVaryingPathConversion');

/**
 * Returns the CikVary array: all time-varying conversions between each meter and unit.
 * Each entry is { source, destination, start_time, end_time, slope, intercept }
 * @param {*} graph The conversion graph.
 * @param {*} conn The connection to use.
 * @returns Array of time-varying conversion segments.
 */
async function createCikVaryArray(graph, conn) {
	/*
	 * Conversion rebuilding visits the same graph edges through many
	 * source/destination paths. Load the small metadata tables once so path
	 * traversal does not issue database queries inside the nested loops.
	 */
	const [sources, destinationUnits, suffixUnits, conversions, conversionSegments] = await Promise.all([
		Unit.getTypeMeter(conn),
		Unit.getTypeUnit(conn),
		Unit.getTypeSuffix(conn),
		Conversion.getAll(conn),
		ConversionSegment.getAll(conn)
	]);
	const destinations = destinationUnits.concat(suffixUnits);
	const conversionsByEdge = new Map(conversions.map(conversion => [
		`${conversion.sourceId}:${conversion.destinationId}`,
		conversion
	]));
	const segmentsByEdge = new Map();
	for (const segment of conversionSegments) {
		const key = `${segment.sourceId}:${segment.destinationId}`;
		const edgeSegments = segmentsByEdge.get(key);
		if (edgeSegments === undefined) {
			segmentsByEdge.set(key, [segment]);
		} else {
			edgeSegments.push(segment);
		}
	}
	const metadata = { conversionsByEdge, segmentsByEdge };
	const c = [];

	// Iterate over all possible meter unit sources
	for (const source of sources) {
		// Iterate over all possible unit destinations
		for (const destination of destinations) {
			const sourceId = source.id;
			const destinationId = destination.id;
			// The shortest path from source to destination.
			const path = getPath(graph, sourceId, destinationId);
			// If a valid path exists, compute all time-varying conversion segments along that path
			if (path !== null) {
				const segments = await timeVaryingPathConversion(path, conn, metadata);
				// Add all segments to the result array
				segments.forEach(seg => {
					c.push({
						source: sourceId,
						destination: destinationId,
						start_time: seg.start_time,
						end_time: seg.end_time,
						slope: seg.slope,
						intercept: seg.intercept
					});
				});
			}
		}
	}
	return c;
}

module.exports = {
	createCikVaryArray
};
