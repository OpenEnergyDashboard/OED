/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Dispatch } from '@reduxjs/toolkit';
import { baseApi } from '../../redux/api/baseApi';
import {
	CSVUploadPreferences,
	MetersCSVUploadPreferences,
	ReadingsCSVUploadPreferences
} from '../../types/csvUploadForm';
import ApiBackend from './ApiBackend';

interface ApiResponse {
	success: boolean,
	message: string
}

export const submitReadings = async (uploadPreferences: ReadingsCSVUploadPreferences, readingsFile: File,
	dispatch: Dispatch): Promise<ApiResponse> => {
	const backend = new ApiBackend();
	const formData = new FormData();
	// The Boolean values in state must be converted to the submitted values of yes and no.
	const uploadPreferencesForm: ReadingsCSVUploadPreferences = {
		...uploadPreferences,
		gzip: uploadPreferences.gzip,
		headerRow: uploadPreferences.headerRow,
		update: uploadPreferences.update,
		refreshReadings: uploadPreferences.refreshReadings,
		honorDst: uploadPreferences.honorDst,
		relaxedParsing: uploadPreferences.relaxedParsing,
		useMeterZone: uploadPreferences.useMeterZone
	};
	for (const [preference, value] of Object.entries(uploadPreferencesForm)) {
		formData.append(preference, value.toString());
	}
	formData.append('csvfile', readingsFile); // It is important for the server that the file is attached last.

	let message = '';
	try {
		message = await backend.doPostRequest<string>('/api/csv/readings', formData);
		dispatch(baseApi.util.invalidateTags(['Readings']));
		return { success: true, message: message };
	} catch (error) {
		return { success: false, message: error.response.data };
	}
};

export const submitMeters = async (uploadPreferences: MetersCSVUploadPreferences, metersFile: File,
	dispatch: Dispatch): Promise<ApiResponse> => {
	const backend = new ApiBackend();
	const formData = new FormData();
	// The Boolean values in state must be converted to the submitted values of yes and no.
	const uploadPreferencesForm: CSVUploadPreferences = {
		...uploadPreferences,
		gzip: uploadPreferences.gzip,
		headerRow: uploadPreferences.headerRow,
		update: uploadPreferences.update
	};
	for (const [preference, value] of Object.entries(uploadPreferencesForm)) {
		formData.append(preference, value.toString());
	}
	formData.append('csvfile', metersFile); // It is important for the server that the file is attached last.

	try {
		const response = await backend.doPostRequest<string>('/api/csv/meters', formData);
		// Meter Data was sent to the DB, invalidate meters for now
		dispatch(baseApi.util.invalidateTags(['MeterData']));
		// meters were invalidated so all meter changes will now reflect in Redux state, now return
		return { success: true, message: response };
	} catch (error) {
		return { success: false, message: error.response.data };
	}
};
