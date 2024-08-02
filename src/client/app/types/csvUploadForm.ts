/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { MeterTimeSortType } from '../types/redux/meters';
import { TrueFalseType } from '../types/items';

interface CSVUploadPreferences {
	meterIdentifier: string;
	gzip: boolean;
	headerRow: boolean;
	update: boolean;
}

// Very similar to CSVUploadPreferences but uses a different Boolean type that is expected when the form is submitted.
export interface CSVUploadPreferencesForm {
	meterIdentifier: string;
	gzip: TrueFalseType;
	headerRow: TrueFalseType;
	update: TrueFalseType;
}

export interface ReadingsCSVUploadPreferencesItem extends CSVUploadPreferences {
	cumulative: TrueFalseType;
	cumulativeReset: TrueFalseType;
	cumulativeResetStart: string;
	cumulativeResetEnd: string;
	duplications: number;
	endOnly: TrueFalseType;
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
	cumulative: TrueFalseType;
	cumulativeReset: TrueFalseType;
	cumulativeResetStart: string;
	cumulativeResetEnd: string;
	duplications: number;
	endOnly: TrueFalseType;
	honorDst: TrueFalseType;
	lengthGap: number;
	lengthVariation: number;
	meterIdentifier: string;
	refreshReadings: TrueFalseType;
	relaxedParsing: TrueFalseType;
	timeSort: MeterTimeSortType;
	useMeterZone: TrueFalseType;
}

// MetersCSVUpload, MetersCSVUploadPreferencesItem, MetersCSVUploadProps should be interfaces. However, at the moment does not add anything new.
// Hence, we define a new type rather than a new interface that extends CSVUploadPreferences and CSVUploadProps to pass our linter.

export type MetersCSVUpload = CSVUploadPreferences;

export type MetersCSVUploadPreferencesItem = MetersCSVUpload;