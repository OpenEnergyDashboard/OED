/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * Wire types for the holiday backend (see src/server/routes/holidays.js and
 * src/server/routes/holidayInstances.js on the Hugo-Implementing-Holiday-Databases
 * branch). Field names match the server's response formatters exactly.
 */

/**
 * A raw holiday row from the `holidays` table (populated via Rose's page).
 * Matches formatHolidayForResponse in routes/holidays.js.
 */
export interface Holiday {
	id: number;
	name: string;
	/** ISO date string from the DATE column */
	startDate: string;
	/** Free-text location for now; may become a region table later (meeting 5) */
	location: string;
	note?: string | null;
}

/**
 * A holiday instance row ("Holiday Rate" in the UI) from `holiday_instance`.
 * Matches formatHolidayInstanceForResponse in routes/holidayInstances.js.
 *
 * DB constraints to mirror in the UI:
 * - name is UNIQUE across all instances
 * - (holidayId, dayPatternId) pair is UNIQUE
 */
export interface HolidayInstance {
	id: number;
	name: string;
	holidayId: number;
	dayPatternId: number;
	note?: string | null;
}

/**
 * Create payload for POST /api/holidayInstances/addHolidayInstance.
 * No id — the server assigns it and returns the created instance.
 */
export type CreateHolidayInstancePayload = Omit<HolidayInstance, 'id'>;

/**
 * A holiday instance joined with its holiday and day pattern, from
 * GET /api/holidayInstances/withDetails. Handy for card display without
 * client-side joins.
 */
export interface HolidayInstanceDetails extends HolidayInstance {
	holidayName: string;
	startDate: string;
	location: string;
	dayPatternName: string;
}
