import { datetime, RRule } from "rrule";

export interface Occurrence {
  rule: RRule;
  dayId: number;
  segmentId: number;
  duration: number;
  slope: number;
  intercept: number;
}

interface WeekDayPair {
  dayId: number;
  rruleDay: any;
}
export interface DayIdToRruleDays {
  dayId: number;
  rruleDays: any[];
}


export function generateRrule(
  week: any,    // from getWeek()
  days: any[],
  daySegments: any[] // {int dayId, daySegments[] segments}
): Occurrence[] {

  // console.log("DEBUG: generateRrule.week:", week);
  // console.log("DEBUG: generateRrule.days:", days);
  // console.log("DEBUG: generateRrule.daySegments:", daySegments);

  const occurrences: Occurrence[] = [];

  const weekDayPairs: WeekDayPair[] = [
    { dayId: week.sunday, rruleDay: RRule.SU },
    { dayId: week.monday, rruleDay: RRule.MO },
    { dayId: week.tuesday, rruleDay: RRule.TU },
    { dayId: week.wednesday, rruleDay: RRule.WE },
    { dayId: week.thursday, rruleDay: RRule.TH },
    { dayId: week.friday, rruleDay: RRule.FR },
    { dayId: week.saturday, rruleDay: RRule.SA },
  ];

  const dayIdMappings: DayIdToRruleDays[] = [];

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

  // console.log("dayIdMappings:", dayIdMappings);

  daySegments.forEach((day: any) => {
    // console.log("DEBUG: day", day);

    day.segments.forEach((segment: any) => {
      // console.log("DEBUG: segment", segment);
       
      const dayId = segment.dayId;

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
