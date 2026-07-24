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
	type: string;
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

/**
 * A holiday instance group together with the IDs stored in
 * `holiday_group_members` for that group.
 */
export interface HolidayInstanceGroup {
	id: number;
	name: string;
	holidayInstanceIds: number[];
	note: string;
}

export type CreateHolidayInstanceGroupPayload = Omit<HolidayInstanceGroup, 'id'>;

export type UpdateHolidayInstanceGroupPayload = HolidayInstanceGroup;

/** Joined member response from GET /api/holidayGroupMembers/group/:groupId. */
export interface HolidayGroupMember {
	holidayInstanceGroupId: number;
	holidayInstanceId: number;
	holidayInstanceName: string;
	holidayId: number;
	dayPatternId: number;
	holidayName: string;
	startDate: string;
	location: string;
	dayPatternName: string;
}

/** A location option returned by date-holidays for use in a dropdown. */
export interface HolidayLocationOption {
	code: string;
	name: string;
}

/**
 * Location options returned by GET /api/holidays/locations.
 */
export interface HolidayLocations {
	countries: HolidayLocationOption[];
	states: HolidayLocationOption[];
	regions: HolidayLocationOption[];
}

/**
 * Optional location selections sent to GET /api/holidays/locations.
 */
export interface HolidayLocationsQuery {
	country?: string;
	state?: string;
}

/**
 * Location and year sent to POST /api/holidays/refresh.
 */
export interface RefreshHolidaysRequest {
	country: string;
	state?: string;
	region?: string;
	year: number;
}

/**
 * Import results returned by POST /api/holidays/refresh.
 */
export interface RefreshHolidaysResponse {
	location: string;
	year: number;
	total: number;
}
