/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { datetime, RRule } = require('rrule');
const Week = require('../../models/Week');
const DaySegment = require('../../models/DaySegment');
const { log } = require('../../log');
const moment = require('moment');

/**
 * Uses the provided week & start/end dates to return the RRule for this pattern.
 * @param {*} weekId The id of the week pattern to be used.
 * @param {*} startDate The start date of the pattern which should have time as empty or 00:00:00. Note the RRule will include the start time for the needed segments.
 * @param {*} endDate The end date of the pattern which should have time as empty or 00:00:00.
 * @param {*} conn The DB connection to use.
 * @returns 
 */
async function generateRrule(weekId, startDate, endDate, conn) {
	// get Week from weekId
	const week = await Week.getById(weekId, conn);

	// get 2D array of daySegments
	const weekDayIds = [
		week.sunday,
		week.monday,
		week.tuesday,
		week.wednesday,
		week.thursday,
		week.friday,
		week.saturday,
	];

	// get only unique dayIds (convert to Set then Array again)
	const uniqueWeekDayIds = Array.from(new Set(weekDayIds.map(obj =>
		JSON.stringify(obj))))
		.map(e => JSON.parse(e));

	// Fetch all daySegments for each day in the week (parallel requests)
	const segmentPromises = uniqueWeekDayIds.map((dayId) =>
		DaySegment.getByDayId(dayId, conn)
	);
	// Wait for all responses
	const daySegmentResponses = await Promise.all(segmentPromises);

	// Flatten and annotate each with its corresponding dayId
	const daySegments = uniqueWeekDayIds.map((dayId, i) => ({
		dayId,
		segments: daySegmentResponses[i],
	}));
	console.log('daySegments: ', daySegments);

	const occurrences = [];

	const weekDayPairs = [
		{ dayId: week.sunday, rruleDay: RRule.SU },
		{ dayId: week.monday, rruleDay: RRule.MO },
		{ dayId: week.tuesday, rruleDay: RRule.TU },
		{ dayId: week.wednesday, rruleDay: RRule.WE },
		{ dayId: week.thursday, rruleDay: RRule.TH },
		{ dayId: week.friday, rruleDay: RRule.FR },
		{ dayId: week.saturday, rruleDay: RRule.SA },
	];

	const dayIdMappings = [];

	// Iterate over each object in weekDayPairs
	weekDayPairs.forEach((pair) => {
		// Extract the dayId from the current pair
		const id = pair.dayId;

		// Find existing entry or create new one
		let existing = dayIdMappings.find(d => d.dayId === id);

		// If no entry exists yet for this dayId, create one
		if (!existing) {
			existing = { dayId: id, rruleDays: [] };
			// Add the new mapping to the array
			dayIdMappings.push(existing);
		}
		// Add the rruleDay from the current pair to this dayId's rruleDays array
		existing.rruleDays.push(pair.rruleDay);
		// console.log('existing: ', existing);
	});
	// console.log('dayIdMappings: ', dayIdMappings);
	dayIdMappings.forEach((day) => {
		// console.log('dayId, dayId.rruleDays: ', dayId, ' ', dayId.rruleDays);
		console.log('day.dayId, day.rruleDays: ', day.dayId, day.rruleDays);
	});

	// Want to limit the number of cik_vary entries so don't do a case where this pattern generate
	// too many. The number is determined by the number of day_segments for the days in the pattern.
	// This sums all the day_segments across the week pattern and then determines the average
	// number per day across the week since the exact days at the start/end of the conversion_segment
	// can vary (not all days in the week) but this minor variation is not too important so just use
	// the average. This average day segments is multiplied by the number of days in the conversion
	// segment to get the expected number of items to generate and store in cik_vary. The limit on this
	// number is not absolute but it is current set to 36400 per the design document discussion.
	// The maximum number of cik_entries allowed for a pattern. For now it is a fixed value.
	const maxCikVary = 36400;
	// Holds the total number of segments in the week pattern.
	let totalSegmentsInWeek = 0;
	// Loop over all the unique days in the week pattern.
	dayIdMappings.forEach((day) => {
		// Get the number of times this day shows up in the week.
		const numDayUsed = day.rruleDays.length;
		const currDaySegment = daySegments.find(ds => ds.dayId === day.dayId);
		// Get the number of segments in this day.
		const numSegments = currDaySegment.segments.length;
		// Update the total number of segments by the number of times used * number of days.
		totalSegmentsInWeek += numDayUsed * numSegments;
	});
	// The average number of segments per day for this week - see global comment above for details.
	const aveSegmentsPerDay = totalSegmentsInWeek / 7;
	// Get the number of days for this conversion segment.
	// Even though other aspects of RRule currently use Date, using moment as generally done in OED.
	const numDays = moment(endDate).diff(moment(startDate), 'days');
	// The total number of segments is the average * # days.
	const totalSegments = aveSegmentsPerDay * numDays;
	console.log('aveSegmentsPerDay, numDays, totalSegments: ', aveSegmentsPerDay, numDays, totalSegments);
	// See if too many expected values.
	if (totalSegments > maxCikVary) {
		// TODO Check earlier for -infinity/infinity for start/end and stop then. Change message below.
		log.error(`The weekly patten of "${week.name}" over conversion segment with start/end times of ${startDate}/${endDate}` +
			` is estimated to produce ${totalSegments} entries which exceeds the maximum of ${maxCikVary}.` +
			' This may be due to having a conversion segment start/end time that involved -infinity/infinity.'
		);
		// Throw an exception to be dealt with in other code.
		throw new Error('Too many cik_vary items');
	}


	daySegments.forEach((day) => {
		day.segments.forEach((segment) => {
			const dayId = segment.dayId;

			const { startHour, endHour, slope, intercept } = segment;
			const weekDayArray = dayIdMappings.find(d => d.dayId === dayId).rruleDays;
			const duration = endHour - startHour;
			console.log('startHour, endHour, slope, intercept : ', startHour, endHour, slope, intercept);

			// start = startDate +/& startHour
			// rrule dtstart must be both the first day of the event done via getRruleDate and
			// the time of the event done with setHours where it is only a whole hour.
			console.log('startDate: ', startDate);
			// const start = new Date(startDate);
			const start = getRruleDate(startDate);
			// minutes, seconds and ms should default to 0 but passed to be sure.
			start.setHours(startHour, 0, 0, 0);
			console.log('start: ', start);
			console.log('endDate: ', endDate);
			const end = getRruleDate(endDate);
			// There is an issue with including or excluding the start/end date. The usage in the calling
			// function does inclusive so the end date is also included. Thus, shift the last day to
			// avoid this. It is safe to subtract 1 minute since this system assumes pattern segments
			// start/end on the day because patterns are for whole days and RRule does each day.
			// Thus, it is only part of the last hour into the previous say which allows all hours through 23.
			// The inverse issue would occur if the calling function did not use inclusive and the start
			// time would need to be fixed up.
			// I tried the RRule exdate but it did not easily work for me so did it this way. Will probably
			// need something like exdate to get holiday exclusions to work so this could be revised once
			// that is done.
			end.setMinutes(end.getMinutes() - 1);
			console.log('end: ', end);
			console.log('weekDayArray: ', weekDayArray);

			const rule = new RRule({
				freq: RRule.WEEKLY,
				byweekday: weekDayArray,
				dtstart: start,
				// until: new Date(endDate)
				until: end
			});

			occurrences.push({
				rule,
				duration,
				slope,
				intercept
			});
		});
	});

	console.log("Generated rules:", occurrences.map((r) => ({
		rrule: r.rule.toString(),
		duration: r.duration,
		slope: r.slope,
		intercept: r.intercept,
	})));

	return occurrences;
}

/**
 * Returns the date object needed by RRule. It fixes up -infinity & infinity to fixed dates.
 * It is currently using JS Date.
 * @param {*} dateString A string representing the date desired including -infinity & infinity.
 * @returns Date object needed for RRule.
 */
function getRruleDate(dateString) {
	// OED currently uses -infinity, infinity for the upper and lower bound on the conversion segments.
	// moment, Date & datetime (RRule) cannot handle this date. Thus, it must be converted into a valid
	// date for use. For now, it will use 1970-01-01 for -infinity since that is used in other places as
	// the min date. It will use 2050-01-01 for infinity.
	// TODO A better scheme should be used. To get this right would mean tracking the min & max date for all
	// readings and redo cik whenever it goes out of that range due to new data. OED could hack this to be some
	// time before the current min reading and some time after the current time. A decision needs to be made
	// and implemented. OED should consider if the current -infinity, infinity should somehow show the
	// actual value used but needs the special values so the algorithm works (or must be changed somehow).
	// No matter what is done (or not), this needs to be documented on the OED help pages.

	// This is to document previous testing. Date and moment return similar values in this code:
	// 	let xDate = new Date('1960-01-01');
	// console.log('xDate: ', xDate);
	// let xdt = new datetime(1960, 1, 1);
	// console.log('xdt: ', xdt);
	// TODO However, see https://github.com/jkbrzt/rrule#important-use-utc-dates for timezone considerations.
	// TODO https://github.com/jkbrzt/rrule#timezone-support uses datetime from RRULE and not Date.

	let dateStringUse = dateString;
	// Fix up -infinity & infinity to be real dates. See above.
	if (dateStringUse === '-infinity') {
		dateStringUse = '1970-01-01';
	} else if (dateStringUse === 'infinity') {
		dateStringUse = '2050-01-01';
	}
	return new Date(dateStringUse);
}

module.exports = { generateRrule, getRruleDate };