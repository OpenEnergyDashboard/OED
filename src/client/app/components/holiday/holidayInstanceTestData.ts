/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export interface HolidayInstance {
	id: number;
	name: string;
	note: string;
	holidayId: number;
	dayPatternId: number;
}

export const testHolidayInstances: HolidayInstance[] = [
	{
		id: 1,
		name: 'New Year\'s Day - Standard Holiday Rate',
		note: 'Applies the standard holiday day pattern for New Year\'s Day.',
		holidayId: 1,
		dayPatternId: 101
	},
	{
		id: 2,
		name: 'Martin Luther King Jr. Day - Reduced Demand',
		note: 'Observed holiday with reduced commercial demand.',
		holidayId: 2,
		dayPatternId: 102
	},
	{
		id: 3,
		name: 'Presidents\' Day - No Override',
		note: 'Listed for review, but currently uses the normal weekday pattern.',
		holidayId: 3,
		dayPatternId: 103
	},
	{
		id: 4,
		name: 'Memorial Day - Holiday Rate',
		note: 'Applies all-day holiday pricing.',
		holidayId: 4,
		dayPatternId: 101
	},
	{
		id: 5,
		name: 'Juneteenth - Federal Holiday',
		note: 'Federal holiday with expected lower commercial load.',
		holidayId: 5,
		dayPatternId: 102
	},
	{
		id: 6,
		name: 'Independence Day - Summer Peak',
		note: 'Holiday rate applies, but cooling demand may remain elevated.',
		holidayId: 6,
		dayPatternId: 104
	},
	{
		id: 7,
		name: 'Labor Day - Holiday Rate',
		note: 'Applies the utility holiday rate pattern.',
		holidayId: 7,
		dayPatternId: 101
	},
	{
		id: 8,
		name: 'Columbus Day - Standard Pattern',
		note: 'No special rate override for this test instance.',
		holidayId: 8,
		dayPatternId: 103
	},
	{
		id: 9,
		name: 'Veterans Day - Observed Holiday',
		note: 'Observed holiday with moderate demand reduction.',
		holidayId: 9,
		dayPatternId: 102
	},
	{
		id: 10,
		name: 'Thanksgiving Day - Holiday Rate',
		note: 'Major holiday with low commercial demand.',
		holidayId: 10,
		dayPatternId: 101
	},
	{
		id: 11,
		name: 'Day After Thanksgiving - Optional Holiday',
		note: 'Optional bridge holiday used by some locations.',
		holidayId: 11,
		dayPatternId: 105
	},
	{
		id: 12,
		name: 'Christmas Eve - Evening Reduction',
		note: 'Partial holiday behavior with lower evening demand.',
		holidayId: 12,
		dayPatternId: 106
	},
	{
		id: 13,
		name: 'Christmas Day - Holiday Rate',
		note: 'Applies all-day holiday pricing.',
		holidayId: 13,
		dayPatternId: 101
	},
	{
		id: 14,
		name: 'New Year\'s Eve - Peak Watch',
		note: 'Demand may increase late in the day; no full holiday override.',
		holidayId: 14,
		dayPatternId: 107
	},
	{
		id: 15,
		name: 'Cesar Chavez Day - Regional Holiday',
		note: 'California regional holiday for test grouping.',
		holidayId: 15,
		dayPatternId: 102
	},
	{
		id: 16,
		name: 'Good Friday - Optional Closure',
		note: 'Optional closure pattern for supported regions.',
		holidayId: 16,
		dayPatternId: 105
	},
	{
		id: 17,
		name: 'Easter Monday - International',
		note: 'International holiday test instance.',
		holidayId: 17,
		dayPatternId: 105
	},
	{
		id: 18,
		name: 'Diwali - Cultural Holiday',
		note: 'Cultural holiday instance for non-US holiday testing.',
		holidayId: 18,
		dayPatternId: 108
	},
	{
		id: 19,
		name: 'Lunar New Year - International',
		note: 'International holiday with location-specific behavior.',
		holidayId: 19,
		dayPatternId: 108
	},
	{
		id: 20,
		name: 'Eid al-Fitr - Regional Holiday',
		note: 'Regional holiday instance with reduced commercial load.',
		holidayId: 20,
		dayPatternId: 108
	},
	{
		id: 21,
		name: 'Rosh Hashanah - Cultural Holiday',
		note: 'Cultural holiday test instance.',
		holidayId: 21,
		dayPatternId: 108
	},
	{
		id: 22,
		name: 'Yom Kippur - Cultural Holiday',
		note: 'Cultural holiday with low business activity in selected regions.',
		holidayId: 22,
		dayPatternId: 108
	},
	{
		id: 23,
		name: 'Election Day - Civic Holiday',
		note: 'Civic holiday test case with normal weekday fallback.',
		holidayId: 23,
		dayPatternId: 103
	},
	{
		id: 24,
		name: 'Utility Flex Holiday - Off Peak',
		note: 'Synthetic utility holiday for testing custom groups.',
		holidayId: 24,
		dayPatternId: 109
	},
	{
		id: 25,
		name: 'Emergency Closure Day - Special Pattern',
		note: 'Synthetic closure day used to test manually created groups.',
		holidayId: 25,
		dayPatternId: 110
	}
];

export default testHolidayInstances;
