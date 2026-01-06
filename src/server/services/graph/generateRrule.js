/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { RRule } = require("rrule");
const Week = require('../../models/Week');
const DaySegment = require('../../models/DaySegment');

async function generateRrule(weekId, conn, startDate, endDate) {

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
	});

	daySegments.forEach((day) => {
		day.segments.forEach((segment) => {
			const dayId = segment.dayId;

			const { startHour, endHour, slope, intercept } = segment;
			const weekDayArray = dayIdMappings.find(d => d.dayId === dayId).rruleDays;
			const duration = endHour - startHour;

			// start = startDate +/& startHour
			// rrule dstart must be both the first day of
			// the event and the time of the event
			const start = new Date(startDate);
			start.setHours(startHour, 0, 0, 0);

			const rule = new RRule({
				freq: RRule.WEEKLY,
				byweekday: weekDayArray,
				dtstart: start,
				until: new Date(endDate)
			});

			occurrences.push({
				rule,
				duration,
				slope,
				intercept
			});

		});

	});

	// console.log("Generated rules:", occurrences.map((r) => ({
	//   rrule: r.rule.toString(),
	//   duration: r.duration,
	//   slope: r.slope,
	//   intercept: r.intercept,
	// })));

	return occurrences;
}

module.exports = { generateRrule };