/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const ConversionSegment = require('../../models/ConversionSegment');
const Conversion = require('../../models/Conversion');
const invertConversion = require('./pathConversion').invertConversion;
const updatedConversion = require('./pathConversion').updatedConversion;
const generateRrule = require('./generateRrule').generateRrule;
const { RRule, datetime, RRuleSet, rrulestr } = require("rrule");
const { forEach } = require('lodash');

/**
 * Chains time-varying conversions along a path, producing combined segments for cik_vary.
 * Each edge in the path may have multiple time segments (start_time, end_time, slope, intercept).
 * The algorithm aligns all segments and combines them for each time range.
 * @param {*} path Array of units (nodes) from source to destination.
 * @param {*} conn Database connection.
 * @returns Array of {source, destination, startTime, endTime, slope, intercept}
 */
// async function timeVaryingPathConversion(path, conn) {
async function timeVaryingPathConversion(path, conn) {
	// 1. Fetch and sort segments for each edge
	const edgeSegments = [];
	for (let i = 0; i < path.length - 1; ++i) {
		const sourceId = path[i].id;
		const destinationId = path[i + 1].id;
		// segments are sorted by start_time in getBySourceDestination
		let segments = await ConversionSegment.getBySourceDestination(sourceId, destinationId, conn);
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
		for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
			const curSegment = segments[segmentIndex];

			// deal with conversionSegments that have a SLOPE & INTERCEPT
			if (curSegment.weekPatternsId == null) {
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
				// It may be possible to avoid this push by directly putting segments into edgeSegments. Given there should not be
				// too many without a pattern it probably is not too important.
				edgeSegments.push(curSegment);
			
			} else {	// deal with conversionSegments that have a WEEK_PATTERN_ID
				const weekId = curSegment.weekPatternsId;
				
				// 1. Use the pattern for this segment to create an RRULE.
				const ruleInfo = await generateRrule(weekId, conn, curSegment.startTime, curSegment.endTime);

				// 2. Use an RRULE generator to create all the needed conversions from segments.start_time to segments.end_time
				const occurrences = [];
				// occurences is 2D array, each array the occurences for each generated rrule 
				const start = new Date(curSegment.startTime);
				const end   = new Date(curSegment.endTime);
				ruleInfo.forEach((info) => {
					occurrences.push(info.rule.between(start, end));

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
				// console.log("DEBUG: occurrences:", occurrences);

				// 3. Each segment is added to edgeSegments with the start_time, end_time, slope & intercept.
				var r = 0;
				occurrences.forEach((patternOccurences) => {
					patternOccurences.forEach((occur) => {
						// console.log("DEBUG occur:", occur);

						const end = new Date(occur);
						end.setHours(ruleInfo[r].duration, 0, 0, 0);

						// (sourceId, destinationId, weekPatternsId, slope, intercept, startTime, endTime, note)
						const newSegment = new ConversionSegment(
							curSegment.sourceId, 
							curSegment.destinationId,
							null,
							ruleInfo[r].slope,
							ruleInfo[r].intercept,
							occur,
							end,
							''
						);
						// console.log("DEBUG newSegment:", newSegment);
						edgeSegments.push(newSegment);
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
	const pointers = Array(path.length - 1).fill(0);

	// 3. Main loop
	let currentStart = Number.NEGATIVE_INFINITY;
	const results = [];
	let done = false;
	while (!done) {
		// Find current segments for each edge
		const currentSegments = edgeSegments;
		// const currentSegments = edgeSegments.map((segments, idx) => segments[pointers[idx]]);
		
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
