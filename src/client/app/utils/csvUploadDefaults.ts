/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ReadingsCSVUploadPreferences, MetersCSVUploadPreferences } from '../types/csvUploadForm';
import { MeterTimeSortType } from '../types/redux/meters';

// This file contains the default parameters for uploading readings and meters CSV files. These defaults should be consistent with the defaults
// specified in /src/server/services/csvPipeline/validateCsvUploadParams and with /src/server/sql/create_meters_table.sql.
export const ReadingsCSVUploadDefaults: ReadingsCSVUploadPreferences = {
	cumulative: false,
	cumulativeReset: false,
	cumulativeResetStart: '',
	cumulativeResetEnd: '',
	duplications: 1,
	endOnly: false,
	gzip: false,
	headerRow: false,
	honorDst: false,
	lengthGap: 0,
	lengthVariation: 0,
	meterIdentifier: '',
	refreshReadings: false,
	relaxedParsing: false,
	timeSort: MeterTimeSortType.increasing,
	update: false,
	useMeterZone: false
};

export const MetersCSVUploadDefaults: MetersCSVUploadPreferences = {
	gzip: false,
	headerRow: false,
	meterIdentifier: '',
	update: false
};