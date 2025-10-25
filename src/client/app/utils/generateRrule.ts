import { RRule } from "rrule";

export interface RruleWithMeta {
  rule: RRule;
  slope: number;
  intercept: number;
  dayId: number;
  segmentId: number;
}

export function generateRruleFromWeek(
  week: any,
  days: any[],
  daySegments: any[] // {int dayId, daySegments[] segments}
): RruleWithMeta[] {
  console.log("DEBUG: week:", week);
  console.log("DEBUG: days:", days);
  console.log("DEBUG: daySegments:", daySegments);

  const dayIdToName: Record<number, string> = Object.fromEntries(
    days.map((d) => [d.id, d.name])
  );

  const weekdayMap: Record<string, any> = {
    Sunday: RRule.SU,
    Monday: RRule.MO,
    Tuesday: RRule.TU,
    Wednesday: RRule.WE,
    Thursday: RRule.TH,
    Friday: RRule.FR,
    Saturday: RRule.SA,
  };

  const rulesWithMeta: RruleWithMeta[] = [];

  // const dayIds = [
  //   week.sunday,
  //   week.monday,
  //   week.tuesday,
  //   week.wednesday,
  //   week.thursday,
  //   week.friday,
  //   week.saturday,
  // ].filter(Boolean);

  daySegments.forEach((day) => {
    console.log("DEBUG: day", day);

    // day.segments.forEach((segment) => {
    //   console.log("DEBUG: segment", segment);
    // });
  });

  // dayIds.forEach((dayId, i) => {
  //   const dayName = dayIdToName[dayId];
  //   const segments = daySegments[i] ?? [];

  //   segments.forEach((segment: any) => {
  //     const { startHour, slope, intercept, id: segmentId } = segment;

  //     const startDate = new Date();
  //     startDate.setHours(startHour, 0, 0, 0);

  //     console.log("DEBUG: dayName:", dayName);
  //     console.log("DEBUG: byweekday:", [weekdayMap[dayName]]);
  //     const rule = new RRule({
  //       freq: RRule.WEEKLY,
  //       interval: 1,
  //       byweekday: [weekdayMap[dayName]],
  //       dtstart: startDate,
  //     });

  //     rulesWithMeta.push({
  //       rule,
  //       slope,
  //       intercept,
  //       dayId,
  //       segmentId,
  //     });
  //   });
  // });

  // console.log("Generated rules:", rulesWithMeta.map((r) => ({
  //   rrule: r.rule.toString(),
  //   slope: r.slope,
  //   intercept: r.intercept,
  //   dayId: r.dayId,
  // })));

  return rulesWithMeta;
}
