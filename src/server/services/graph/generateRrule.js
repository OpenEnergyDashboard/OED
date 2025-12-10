const { RRule, datetime } = require("rrule");   // import { datetime, RRule } from "rrule";
const Week = require('../../models/Week');
const DaySegment = require('../../models/DaySegment');

async function generateRrule(weekId, conn) {

  // get Week from weekId
  const week = await Week.getById(weekId, conn);
  console.log("DEBUG: week:", week);

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
      const dayId = segment.id;

      const { id: segmentId, startHour, endHour, slope, intercept } = segment;
      const weekDayArray = dayIdMappings.find(d => d.dayId === dayId)?.rruleDays;
      const duration = endHour - startHour;

      console.log("startHour:", startHour);

      const rule = new RRule({
        freq: RRule.WEEKLY,
        byweekday: weekDayArray,
        dtstart: datetime(2024, 0, 1, startHour, 0) // timezone: UTC
      });

      console.log("DEBUG: rrule: ", rule.toText());
      console.log("DEBUG: string: ", rule.toString());

      console.log("TEST (UTC): ",
        rule.between(datetime(2024, 4, 10), datetime(2024, 4, 24))
      );

      occurrences.push({
        rule,
        dayId,
        segmentId,
        duration,
        slope,
        intercept
      });

    });

    console.log("Generated rules:", occurrences.map((r) => ({
      rrule: r.rule.toString(),
      slope: r.slope,
      intercept: r.intercept,
      dayId: r.dayId,
    })));
  });

  return occurrences;
}

module.exports = { generateRrule };