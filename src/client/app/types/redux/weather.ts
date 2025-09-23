/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export interface WeatherLocationData {
	id: number;
	identifier: string;
	longitude: number;
	latitude: number;
	note: string;
}

export interface WeatherLocationEditData {
	id: number;
	identifier: string;
	longitude: number;
	latitude: number;
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
