/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { GPSPoint } from 'utils/calibration';
export interface WeatherLocationData {
	id: number;
	identifier: string;
	gps: GPSPoint | null;
	note: string;
}

export interface WeatherLocationEditData {
	id: number;
	identifier: string;
	gps: GPSPoint | null;
	note: string;
}

export interface WeatherLocationById extends Record<number, WeatherLocationData> { }

export interface WeatherState {
	hasBeenFetchedOnce: boolean,
	isFetching: boolean;
	selectedWeatherIds: number[];
	submitting: number[];
	weatherLocationData: WeatherLocationById;
}
