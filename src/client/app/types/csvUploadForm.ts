/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { MeterTimeSortType } from '../types/redux/meters';
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

export const enum BooleanTypes {
	// Normally the values here are not used when displayed to user but the ones in data.js so translated.
	true = 'yes',
	false = 'no'
}

export interface ReadingsCSVUploadPreferencesItem extends CSVUploadPreferences {
	cumulative: BooleanTypes;
	cumulativeReset: BooleanTypes;
	cumulativeResetStart: string;
	cumulativeResetEnd: string;
	duplications: number;
	endOnly: BooleanTypes;
	honorDst: boolean;
	lengthGap: number;
	lengthVariation: number;
	meterIdentifier: string;
	refreshReadings: boolean;
	relaxedParsing: boolean;
	timeSort: MeterTimeSortType;
	useMeterZone: boolean;
}

export interface ReadingsCSVUploadPreferencesForm extends CSVUploadPreferencesForm {
	cumulative: BooleanTypes;
	cumulativeReset: BooleanTypes;
	cumulativeResetStart: string;
	cumulativeResetEnd: string;
	duplications: number;
	endOnly: BooleanTypes;
	honorDst: BooleanTypes;
	lengthGap: number;
	lengthVariation: number;
	meterIdentifier: string;
	refreshReadings: BooleanTypes;
	relaxedParsing: BooleanTypes;
	timeSort: MeterTimeSortType;
	useMeterZone: BooleanTypes;
}

// MetersCSVUpload, MetersCSVUploadPreferencesItem, MetersCSVUploadProps should be interfaces. However, at the moment does not add anything new.
// Hence, we define a new type rather than a new interface that extends CSVUploadPreferences and CSVUploadProps to pass our linter.

export type MetersCSVUpload = CSVUploadPreferences;

export type MetersCSVUploadPreferencesItem = MetersCSVUpload;