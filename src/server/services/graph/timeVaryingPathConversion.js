/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const ConversionSegment = require('../../models/ConversionSegment');
const Conversion = require('../../models/Conversion');
const invertConversion = require('./pathConversion').invertConversion;
const updatedConversion = require('./pathConversion').updatedConversion;
const { generateRrule, getRruleDate } = require('./generateRrule');
const sortBy = require('lodash/sortBy');
const moment = require('moment'); // TODO DEBUG

/**
 * Chains time-varying conversions along a path, producing combined segments for cik_vary.
 * Each edge in the path may have multiple time segments (start_time, end_time, slope, intercept).
 * The algorithm aligns all segments and combines them for each time range.
 * @param {*} path Array of units (nodes) from source to destination.
 * @param {*} conn Database connection.
 * @returns Array of {source, destination, startTime, endTime, slope, intercept}
 */
async function timeVaryingPathConversion(path, conn) {
	// The numbering corresponds to the design document for time-varying conversions.
	// 1. Fetch and sort segments for each edge
	// This is an array where each entry is an array that contains information on each
	// conversion segment for current path vertices/edge.
	const edgeSegments = [];
	for (let i = 0; i < path.length - 1; ++i) {
		// Create new entry to hold the conversion segments for this edge in the path.
		edgeSegments.push([]);
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
				edgeSegments[i].push(curSegment);
			} else {
				// Deal with conversionSegments that have a WEEK_PATTERN_ID

				// Get the actual week pattern id for this segment.
				const weekId = curSegment.weekPatternsId;

				// I. Use the pattern for this segment to create an RRULE.
				// This encodes all the unique day segments for the week pattern into ruleInfo so it can reproduce
				// all the needed conversion segment. The way it works is it puts reused day/day segments into a
				// single pattern. For example, if Saturday and Sunday use the same day then the day segments for
				// those two days are the same. The generated RRule stored in ruleInfo will have one rule for this
				// where it has a repetition for Saturday and Sunday in the rule. The number of RRules is the
				// number of unique day segments in the week.
				const ruleInfo = await generateRrule(weekId, curSegment.startTime, curSegment.endTime, conn);

				// II. Use an RRULE generator to create all the needed conversions from segments.start_time to segments.end_time.
				// occurrences is 2D array, each array index is the occurrences for each generated rrule for a given day segment
				// in the week pattern. The occurrence is the start day/time of that day segment for each instance that day and time
				// occurs across the conversion segment. Note since day segments can be used multiple times in a week pattern,
				// this means there may be multiple entries of the day/time in a given week.
				const occurrences = [];
				// Get the start and end date for this conversion segment where uses a function to fix up infinity cases.
				const start = getRruleDate(curSegment.startTime);
				const end = getRruleDate(curSegment.endTime);
				// This loops over the unique day segments RRules in the week pattern to use each one for the
				// date range of the current conversion segment to generate all the occurrences needed
				// for each RRule across the current conversion segment. The number is the number of unique
				// day segments in the week pattern.
				ruleInfo.forEach((info) => {
					// Generate all the occurrences of this RRule for the current conversion segment.
					// The third parameter of true means start and end are included. See generateRrule where
					// the end date is adjusted so it is correct and not included.
					// There is an array entry in occurrences for each unique day segment in the week pattern.
					// That array entry contains all the start days/times that occur across the current
					// conversion segment.
					occurrences.push(info.rule.between(start, end, true));

					// II.b. If reversed is true then invert the slope/intercept for each conversion using invertConversion().
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

				// III. Each segment is added to edgeSegments with the start_time, end_time, slope & intercept.
				// r tracks which item the loop corresponds to in the ruleInfo array.
				var r = 0;
				// Loops over all the unique day segments (see above).
				occurrences.forEach((patternOccurrences) => {
					// Loops over all the start day/time occurrences across the current conversion segment
					// for the current unique day segment. This will generate all the segments.
					patternOccurrences.forEach((occur) => {
						// Figure out the end date which is the occurrence (start day/time) plus the duration of
						// this day segment stored in the ruleInfo.
						const end = new Date(occur);
						end.setHours(end.getHours() + ruleInfo[r].duration);
						// Stores the new instance of a conversion segment for this unique instance of the
						// current unique day segment pattern at a given day/time.
						// The conversion is for the current segment's source/destination.
						// The pattern has now been analyzed so this uses null since no pattern.
						// The pattern gave the slope/intercept and the new two values are the start/end time
						// of this instance. The note is left blank since only used internally by this process.
						const newSegment = new ConversionSegment(
							curSegment.sourceId,
							curSegment.destinationId,
							null,
							ruleInfo[r].slope,						// slope
							ruleInfo[r].intercept,				// intercept
							occur,												// startTime
							end,													// endTime
							''														// note
						);
						// Add this to the current path segment. The path from the meter unit to the
						// graphic unit can involve multiple conversions that OED chains together to
						// get the overall conversion. That is done below.
						edgeSegments[i].push(newSegment);
					});

					r++;
				});
				// It can be done one at a time or all at once. If possible, this should be done without
				// another copy as patterns can generate a lot of items so fewer copies is better.
				// Note the next step assumes the segments/conversions are sorted by start_time order for
				// each entry in edgeSegments. It does not matter how these are generated but they must be
				// sorted. The sorting must be done since each unique day segment is generated by its own RRULE
				// which can be multiple days and the conversion segment may not start at the beginning of
				// the week. Thus, the edgeSegments for this unique segment in the conversion path must now
				// be sorted so step 3. works properly.
				// sortBy returns a new array and does not sort in place.
				edgeSegments[i] = sortBy(edgeSegments[i], 'startTime');
			}
		}
	}

	// 2. Initialize pointers for each edge. It starts with the first item for each segment along
	// the path.
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
