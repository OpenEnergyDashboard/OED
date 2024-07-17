/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { MODE } from '../containers/csv/UploadCSVContainer';

interface CSVUploadPreferences {
	meterName: string;
	gzip: boolean;
	headerRow: boolean;
	update: boolean;
}

// Very similar to CSVUploadPreferences but uses a different Boolean type that is expected when the form is submitted.
export interface CSVUploadPreferencesForm {
	meterName: string;
	gzip: BooleanTypes;
	headerRow: BooleanTypes;
	update: BooleanTypes;
}

interface CSVUploadProps extends CSVUploadPreferences {
	submitCSV: (file: File) => Promise<void>;
	setMeterName: (mode: MODE, value: string) => void;
	toggleGzip: () => void;
	toggleHeaderRow: () => void;
	toggleUpdate: () => void;
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
	createMeter: boolean;
	cumulative: BooleanMeterTypes;
	cumulativeReset: BooleanMeterTypes;
	cumulativeResetStart: string;
	cumulativeResetEnd: string;
	duplications: string; // Not sure how to type this an integer string;
	meterName: string;
	lengthGap: string;
	lengthVariation: string;
	endOnly: BooleanMeterTypes;
	refreshHourlyReadings: boolean;
	refreshReadings: boolean;
	timeSort: TimeSortTypes;
	honorDst: boolean;
	relaxedParsing: boolean;
	useMeterZone: boolean;
}

export interface ReadingsCSVUploadPreferencesForm extends CSVUploadPreferencesForm {
	createMeter: BooleanTypes;
	cumulative: BooleanMeterTypes;
	cumulativeReset: BooleanMeterTypes;
	cumulativeResetStart: string;
	cumulativeResetEnd: string;
	duplications: string; // Not sure how to type this an integer string;
	meterName: string;
	lengthGap: string;
	lengthVariation: string;
	endOnly: BooleanMeterTypes;
	refreshHourlyReadings: BooleanTypes;
	refreshReadings: BooleanTypes;
	timeSort: TimeSortTypes;
	honorDst: BooleanTypes;
	relaxedParsing: BooleanTypes;
	useMeterZone: BooleanTypes;
}

export interface ReadingsCSVUploadProps extends ReadingsCSVUploadPreferencesItem, CSVUploadProps{
	// Note: each of these will have to change in consideration of redux;
	selectTimeSort: (value: TimeSortTypes) => void;
	selectDuplications: (value: string) => void;
	selectCumulative: (value: BooleanMeterTypes) => void;
	selectCumulativeReset: (value: BooleanMeterTypes) => void;
	setCumulativeResetStart: (value: string) => void;
	setCumulativeResetEnd: (value: string) => void;
	setLengthGap: (value: string) => void;
	setLengthVariation: (value: string) => void;
	selectEndOnly: (value: string) => void;
	toggleCreateMeter: () => void;
	toggleRefreshHourlyReadings: () => void;
	toggleRefreshReadings: () => void;
	toggleHonorDst: () => void;
	toggleRelaxedParsing: () => void;
	toggleUseMeterZone: () => void;
}

// MetersCSVUpload, MetersCSVUploadPreferencesItem, MetersCSVUploadProps should be interfaces. However, at the moment does not add anything new.
// Hence, we define a new type rather than a new interface that extends CSVUploadPreferences and CSVUploadProps to pass our linter.

export type MetersCSVUpload = CSVUploadPreferences;

export type MetersCSVUploadPreferencesItem = MetersCSVUpload;

export type MetersCSVUploadProps = CSVUploadProps;
