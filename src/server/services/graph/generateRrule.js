const { RRule, datetime } = require("rrule");   // import { datetime, RRule } from "rrule";
const Week = require('../../models/Week');
const DaySegment = require('../../models/DaySegment');

async function generateRrule(weekId, conn, start_time, end_time) {

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
	].filter(Boolean);

	// get only unique dayIds (convert to Set then Array again)
	const uniqueWeekDayIds = Array.from(new Set(weekDayIds.map(obj => 
												JSON.stringify(obj))))
														.map(e => JSON.parse(e));
		
	// Fetch all daySegments for each day in the week (parallel requests)
  const segmentPromises = uniqueWeekDayIds.map((dayId) =>
    // fetchDaySegments(dayId).unwrap()
    DaySegment.getByDayId(dayId, conn)
  );

  // Wait for all responses
  const daySegmentResponses = await Promise.all(segmentPromises);

  // Flatten and annotate each with its corresponding dayId
  const daySegments = uniqueWeekDayIds.map((dayId, i) => ({
    dayId,
    segments: daySegmentResponses[i],
  }));

  // console.log("DEBUG (generateRrule): week:", week);
  // console.log("DEBUG (generateRrule): daySegments:", daySegments);

  const occurrences = [];
  const rrules = [];

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

  weekDayPairs.forEach((pair) => {
    const id = pair.dayId;

    // find existing entry or create new one
    let existing = dayIdMappings.find(d => d.dayId === id);

    if (!existing) {
      existing = { dayId: id, rruleDays: [] };
      dayIdMappings.push(existing);
    }

    existing.rruleDays.push(pair.rruleDay);
  });

  daySegments.forEach((day) => {
    day.segments.forEach((segment) => {
      const dayId = segment.dayId;

      // console.log("DEBUG (generateRrule): segment:", segment);

      const { id: segmentId, startHour, endHour, slope, intercept } = segment;
      const weekDayArray = dayIdMappings.find(d => d.dayId === dayId)?.rruleDays;
      const duration = endHour - startHour;

      // console.log("DEBUG (generateRrule): startHour:", startHour);

      const rule = new RRule({
        freq: RRule.WEEKLY,
        byweekday: weekDayArray,
        dtstart: new Date(start_time),
        until: new Date(end_time)
      });

      rrules.push(rule);

      occurrences.push({
        rule,
        // dayId,
        // segmentId,
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
  // return rrules;
}

module.exports = { generateRrule };