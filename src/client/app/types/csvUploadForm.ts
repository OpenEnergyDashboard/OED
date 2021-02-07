/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

interface CSVUploadPreferences {
    gzip: boolean;
    headerRow: boolean;
    update: boolean;
}

export const enum TimeSortTypes {
    increasing = "increasing"
}

export interface ReadingsCSVUploadPreferencesItem extends CSVUploadPreferences {
    createMeter: boolean;
    cumulative: boolean;
    cumulativeReset: boolean;
    duplications: string; // Not sure how to type this an integer string;
    meterName: string;
    timeSort: TimeSortTypes;
}

export interface ReadingsCSVUploadProps extends ReadingsCSVUploadPreferencesItem {
    // Note: each of these will have to change in consideration of redux;
	submitCSV: (file: File) => Promise<void>;
    selectDuplications: (value: string) => void;
    selectTimeSort: (value: TimeSortTypes) => void;
    setMeterName: (value: string) => void;
    toggleCreateMeter: () => void;
    toggleCumulative: () => void;
    toggleCumulativeReset: () => void;
    toggleGzip: () => void;
    toggleHeaderRow: () => void;
    toggleUpdate: () => void;
	createMeter: boolean;
	cumulative: boolean;
	cumulativeReset: boolean;
	duplications: string; // Not sure how to type this an integer string;
	gzip: boolean;
	headerRow: boolean;
	meterName: string;
	timeSort: TimeSortTypes;
	update: boolean;
};

export interface MetersCSVUpload extends CSVUploadPreferences {
}

export interface MetersCSVUploadPreferencesItem extends MetersCSVUpload {
}

export interface MetersCSVUploadProps extends MetersCSVUploadPreferencesItem {
}