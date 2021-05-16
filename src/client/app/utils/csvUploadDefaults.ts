/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ReadingsCSVUploadPreferencesItem, MetersCSVUploadPreferencesItem, TimeSortTypes } from '../types/csvUploadForm';

// This file contains the default parameters for uploading readings and meters CSV files. These defaults should be consistent with the defaults
// specified in /src/server/services/csvPipeline/validateCsvUploadParams and with /src/server/sql/create_meters_table.sql.

export const ReadingsCSVUploadDefaults: ReadingsCSVUploadPreferencesItem = {
	createMeter: false,
	cumulative: false,
	cumulativeReset: false,
	cumulativeResetStart: '00:00:00',
	cumulativeResetEnd: '23:59:59.999999',
	duplications: '1',
	gzip: false,
	headerRow: false,
	length: '',
	lengthVariation: '',
	meterName: '',
	refreshReadings: false,
	timeSort: TimeSortTypes.increasing,
	update: false
}

export const MetersCSVUploadDefaults: MetersCSVUploadPreferencesItem = {
	gzip: false,
	headerRow: false,
	update: false
}