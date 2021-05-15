/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

interface CSVUploadPreferences {
	gzip: boolean;
	headerRow: boolean;
	update: boolean;
}

interface CSVUploadProps extends CSVUploadPreferences {
	submitCSV: (file: File) => Promise<void>;
	toggleGzip: () => void;
	toggleHeaderRow: () => void;
	toggleUpdate: () => void;
}

export const enum TimeSortTypes {
	increasing = 'increasing'
}

export interface ReadingsCSVUploadPreferencesItem extends CSVUploadPreferences {
	createMeter: boolean;
	cumulative: boolean;
	cumulativeReset: boolean;
	cumulativeResetStart: string;
	cumulativeResetEnd: string;
	duplications: string; // Not sure how to type this an integer string;
	meterName: string;
	length: string;
	lengthVariation: string;
	refreshReadings: boolean;
	timeSort: TimeSortTypes;
}

export interface ReadingsCSVUploadProps extends ReadingsCSVUploadPreferencesItem, CSVUploadProps{
	// Note: each of these will have to change in consideration of redux;
	selectDuplications: (value: string) => void;
	selectTimeSort: (value: TimeSortTypes) => void;
	setCumulativeResetStart: (value: string) => void;
	setCumulativeResetEnd: (value: string) => void;
	setLength: (value: string) => void;
	setLengthVariation: (value: string) => void;
	setMeterName: (value: string) => void;
	toggleCreateMeter: () => void;
	toggleCumulative: () => void;
	toggleCumulativeReset: () => void;
	toggleRefreshReadings: () => void;
};

// MetersCSVUpload, MetersCSVUploadPreferencesItem, MetersCSVUploadProps should be interfaces. However, at the moment does not add anything new.
// Hence, we define a new type rather than a new interface that extends CSVUploadPreferences and CSVUploadProps to pass our linter.

export type MetersCSVUpload = CSVUploadPreferences;

export type MetersCSVUploadPreferencesItem = MetersCSVUpload;

export type MetersCSVUploadProps = CSVUploadProps;