/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { MeterTimeSortType } from '../types/redux/meters';

export interface CSVUploadPreferences {
	meterIdentifier: string;
	gzip: boolean;
	headerRow: boolean;
	update: boolean;
}

export interface ReadingsCSVUploadPreferences extends CSVUploadPreferences {
	cumulative: boolean;
	cumulativeReset: boolean;
	cumulativeResetStart: string;
	cumulativeResetEnd: string;
	duplications: number;
	endOnly: boolean;
	honorDst: boolean;
	lengthGap: number;
	lengthVariation: number;
	meterIdentifier: string;
	refreshReadings: boolean;
	relaxedParsing: boolean;
	timeSort: MeterTimeSortType;
	useMeterZone: boolean;
}

// MetersCSVUpload, MetersCSVUploadPreferencesItem, MetersCSVUploadProps should be interfaces. However, at the moment does not add anything new.
// Hence, we define a new type rather than a new interface that extends CSVUploadPreferences and CSVUploadProps to pass our linter.

export type MetersCSVUploadPreferences = CSVUploadPreferences;