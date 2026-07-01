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

export interface HolidayInstanceGroup {
	id: number;
	name: string;
	note: string;
}

export interface HolidayGroupMember {
	holidayInstanceGroupId: number;
	holidayInstanceId: number;
}

export interface Holidays {
	id: number;
	name: string;
	startDate: string;
	local: string;
	note: string;
}