/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const ConversionSegment = require('../../models/ConversionSegment');
const Conversion = require('../../models/Conversion');
const invertConversion = require('./pathConversion').invertConversion;
const updatedConversion = require('./pathConversion').updatedConversion;
const { generateRrule, getRruleDate } = require('./generateRrule');

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
	// This is an array where each entry is an array that contains information on each
	// conversion segment for current path vertices/edge.
	const edgeSegments = [];
	console.log('path.length: ', path.length);
	for (let i = 0; i < path.length - 1; ++i) {
		// Create new entry to hold the conversion segments for this edge in the path.
		edgeSegments.push([]);
		const sourceId = path[i].id;
		const destinationId = path[i + 1].id;
		console.log('sourceId, destinationId: ', sourceId, destinationId);
		// segments are sorted by start_time in getBySourceDestination
		let segments = await ConversionSegment.getBySourceDestination(sourceId, destinationId, conn);
		console.log('segments: ', segments);
		// Tell if the conversion direction is okay (false) or must be reversed (true). Assumed false unless found otherwise in next step.
		let reversed = false;
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
			reversed = true;
		}

		// loop through segments, ..., and push to edgeSegments
		// console.log('segments.length: ', segments.length);
		for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
			console.log('segmentIndex: ', segmentIndex)
			const curSegment = segments[segmentIndex];

			// deal with conversionSegments that have a SLOPE & INTERCEPT
			if (curSegment.weekPatternsId == null) {
				console.log('slope/intercept');
				// The segment does not have a pattern so can use the segments found above for slope/intercept.
				if (reversed) {
					// Reversed so invert segment found.
					const { convertedSlope, convertedIntercept } = invertConversion(curSegment.slope, curSegment.intercept)
					curSegment = {
						...curSegment,
						slope: convertedSlope,
						intercept: convertedIntercept
					};
				}
				// console.log('curSegment: ', curSegment);
				// It may be possible to avoid this push by directly putting segments into edgeSegments. Given there should not be
				// too many without a pattern it probably is not too important.
				edgeSegments[i].push(curSegment);
				// console.log('edgeSegments: ', edgeSegments);
			} else {
				console.log('pattern');
				// Deal with conversionSegments that have a WEEK_PATTERN_ID

				const weekId = curSegment.weekPatternsId;

				// 1. Use the pattern for this segment to create an RRULE.
				const ruleInfo = await generateRrule(weekId, curSegment.startTime, curSegment.endTime, conn);
				// TODO DEBUG
				// console.log("ruleInfo:", ruleInfo.map((r) => ({
				// 	rrule: r.rule.toString(),
				// 	duration: r.duration,
				// 	slope: r.slope,
				// 	intercept: r.intercept,
				// })));

				// 2. Use an RRULE generator to create all the needed conversions from segments.start_time to segments.end_time
				const occurrences = [];
				// occurrences is 2D array, each array the occurrences for each generated rrule 
				// console.log('curSegment.startTime, curSegment.endTime: ', curSegment.startTime, curSegment.endTime);
				const start = getRruleDate(curSegment.startTime);
				const end = getRruleDate(curSegment.endTime);
				console.log('start, end: ', start, end);
				ruleInfo.forEach((info) => {
					// The third parameter of true means start and end are included. See generateRrule where
					// the end date is adjusted so it is correct.
					console.log('info.rule.between(start, end, true): ', info.rule.between(start, end));
					occurrences.push(info.rule.between(start, end, true));

					// 2.b. If reversed is true then invert the slope/intercept for each conversion using invertConversion().
					if (reversed) {
						// Reversed so invert segment found.
						const { convertedSlope, convertedIntercept } = invertConversion(ruleInfo.slope, ruleInfo.intercept)
						ruleInfo = {
							...ruleInfo,
							slope: convertedSlope,
							intercept: convertedIntercept
						};
					}
				});

				// 3. Each segment is added to edgeSegments with the start_time, end_time, slope & intercept.
				var r = 0;
				console.log('occurrences: ', occurrences);
				occurrences.forEach((patternOccurrences) => {
					patternOccurrences.forEach((occur) => {
						console.log('occur: ', occur);
						const end = new Date(occur);
						end.setHours(ruleInfo[r].duration, 0, 0, 0);
						console.log('end: ', end);

						const newSegment = new ConversionSegment(
							curSegment.sourceId, 					// sourceId
							curSegment.destinationId,			// destinationId
							null,													// weekPatternsId
							ruleInfo[r].slope,						// slope
							ruleInfo[r].intercept,				// intercept
							occur,												// startTime
							end,													// endTime
							''														// note
						);
						edgeSegments[i].push(newSegment);
					});

					r++;
				});
				// It can be done one at a time or all at once. If possible, this should be done without another copy as patterns can
				// generate a lot of items so fewer copies is better.
				// Note the next step assumes the segments/conversions are sorted by start_time order for each entry in edgeSegments. It does not matter
				// how these are generated but they must be sorted in the end so manually sort the ones created by RRULE if needed. This may be needed
				// if each day segment is generated by its own RRULE so all the segments have to be merged together. If this is done
				// the the values across segments will be fine as they are processed in the sorted order of time.
			}
		}
	}

	// 2. Initialize pointers for each edge
	console.log('2.');
	const pointers = Array(path.length - 1).fill(0);

	// 3. Main loop
	console.log('3.');
	// console.log('edgeSegments.length: ', edgeSegments.length);
	// console.log('edgeSegments: ', edgeSegments);
	// process.exit(99); // DEBUG!!!!!!!!
	// console.log('edgeSegments[0]: ', edgeSegments[0]);
	// console.log('edgeSegments[1]: ', edgeSegments[1]);
	let currentStart = Number.NEGATIVE_INFINITY;
	const results = [];
	let done = false;
	while (!done) {
		// Find current segments for each edge
		// console.log('pointers: ', pointers);
		const currentSegments = edgeSegments.map((segments, idx) => segments[pointers[idx]]);
		// console.log('currentSegments: ', currentSegments);

		// Find minimum end time among current segments
		let currentEnd = Math.min(...currentSegments.map(seg => parsePostgresDate(seg.endTime)));

		// Combine conversions for the path
		let slope = 1, intercept = 0;
		for (const seg of currentSegments) {
			[slope, intercept] = updatedConversion(slope, intercept, seg.slope, seg.intercept);
		}
		// console.log('before push');
		results.push({
			source: path[0].id,
			destination: path[path.length - 1].id,
			start_time: toPostgresTimestamp(currentStart),
			end_time: toPostgresTimestamp(currentEnd),
			slope,
			intercept
		});
		// console.log('results: ', results);

		if (currentEnd === Number.POSITIVE_INFINITY) {
			// console.log('done');
			done = true;
		} else {
			// Advance pointers for segments ending at currentEnd
			// console.log('pointers.length: ', pointers.length)
			for (let i = 0; i < pointers.length; ++i) {
				// console.log('i, pointers: ', i, pointers);
				if (parsePostgresDate(currentSegments[i].endTime) === currentEnd) {
					pointers[i]++;
					// console.log('advancing i: pointers[i]', i, pointers[i])
				}
			}
		}
		currentStart = currentEnd;
	}

	console.log('done');
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
