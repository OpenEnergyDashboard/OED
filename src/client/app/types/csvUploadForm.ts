/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

interface CSVUploadPreferences {
	meterIdentifier: string;
	gzip: boolean;
	headerRow: boolean;
	update: boolean;
}

// Very similar to CSVUploadPreferences but uses a different Boolean type that is expected when the form is submitted.
export interface CSVUploadPreferencesForm {
	meterIdentifier: string;
	gzip: BooleanTypes;
	headerRow: BooleanTypes;
	update: BooleanTypes;
}

// This relates to MeterTimeSortTypes in src/client/app/types/redux/meters.ts but also has 'meter value or default'.
// They should be kept in sync.
export const enum TimeSortTypes {
	// Normally the values here are not used when displayed to user but the ones in data.js so translated.
	increasing = 'increasing',
	decreasing = 'decreasing',
	// meter means to use value stored on meter or the default if not.
	meter = 'meter value or default'
}

export const enum BooleanTypes {
	// Normally the values here are not used when displayed to user but the ones in data.js so translated.
	true = 'yes',
	false = 'no'
}

// Unusual boolean that also allows for meter so 3-way.
export const enum BooleanMeterTypes {
	// Normally the values here are not used when displayed to user but the ones in data.js so translated.
	true = 'yes',
	false = 'no',
	// meter means to use value stored on meter or the default if not.
	meter = 'meter value or default'
}

export interface ReadingsCSVUploadPreferencesItem extends CSVUploadPreferences {
	cumulative: BooleanMeterTypes;
	cumulativeReset: BooleanMeterTypes;
	cumulativeResetStart: string;
	cumulativeResetEnd: string;
	duplications: string; // Not sure how to type this an integer string;
	meterIdentifier: string;
	lengthGap: string;
	lengthVariation: string;
	endOnly: BooleanMeterTypes;
	refreshHourlyReadings: boolean;
	refreshReadings: boolean;
	timeSort: TimeSortTypes;
	honorDst: boolean;
	relaxedParsing: boolean;
}

export interface ReadingsCSVUploadPreferencesForm extends CSVUploadPreferencesForm {
	cumulative: BooleanMeterTypes;
	cumulativeReset: BooleanMeterTypes;
	cumulativeResetStart: string;
	cumulativeResetEnd: string;
	duplications: string; // Not sure how to type this an integer string;
	meterIdentifier: string;
	lengthGap: string;
	lengthVariation: string;
	endOnly: BooleanMeterTypes;
	refreshHourlyReadings: BooleanTypes;
	refreshReadings: BooleanTypes;
	timeSort: TimeSortTypes;
	honorDst: BooleanTypes;
	relaxedParsing: BooleanTypes;
}

// MetersCSVUpload, MetersCSVUploadPreferencesItem, MetersCSVUploadProps should be interfaces. However, at the moment does not add anything new.
// Hence, we define a new type rather than a new interface that extends CSVUploadPreferences and CSVUploadProps to pass our linter.

export type MetersCSVUpload = CSVUploadPreferences;

export type MetersCSVUploadPreferencesItem = MetersCSVUpload;