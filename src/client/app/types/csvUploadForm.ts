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

interface CSVUploadProps extends CSVUploadPreferences {
	submitCSV: (file: File) => Promise<void>;
	setMeterName: (mode: MODE, value: string) => void;
	toggleGzip: () => void;
	toggleHeaderRow: () => void;
	toggleUpdate: () => void;
}

export const enum TimeSortTypes {
	increasing = 'increasing',
	decreasing = 'decreasing',
	// meter means to use value stored on meter or the default if not.
	meter = 'meter value or default'
}

export const enum BooleanTypes {
	true = 'true',
	false = 'false',
	// meter means to use value stored on meter or the default if not.
	meter = 'meter value or default'
}

export interface ReadingsCSVUploadPreferencesItem extends CSVUploadPreferences {
	createMeter: boolean;
	cumulative: BooleanTypes;
	cumulativeReset: BooleanTypes;
	cumulativeResetStart: string;
	cumulativeResetEnd: string;
	duplications: string; // Not sure how to type this an integer string;
	meterName: string;
	lengthGap: string;
	lengthVariation: string;
	endOnly: BooleanTypes;
	refreshHourlyReadings: boolean;
	refreshReadings: boolean;
	timeSort: TimeSortTypes;
}

export interface ReadingsCSVUploadProps extends ReadingsCSVUploadPreferencesItem, CSVUploadProps{
	// Note: each of these will have to change in consideration of redux;
	selectTimeSort: (value: TimeSortTypes) => void;
	selectDuplications: (value: string) => void;
	selectCumulative: (value: BooleanTypes) => void;
	selectCumulativeReset: (value: BooleanTypes) => void;
	setCumulativeResetStart: (value: string) => void;
	setCumulativeResetEnd: (value: string) => void;
	setLengthGap: (value: string) => void;
	setLengthVariation: (value: string) => void;
	selectEndOnly: (value: string) => void;
	toggleCreateMeter: () => void;
	toggleRefreshHourlyReadings: () => void;
	toggleRefreshReadings: () => void;
}

// MetersCSVUpload, MetersCSVUploadPreferencesItem, MetersCSVUploadProps should be interfaces. However, at the moment does not add anything new.
// Hence, we define a new type rather than a new interface that extends CSVUploadPreferences and CSVUploadProps to pass our linter.

export type MetersCSVUpload = CSVUploadPreferences;

export type MetersCSVUploadPreferencesItem = MetersCSVUpload;

export type MetersCSVUploadProps = CSVUploadProps;