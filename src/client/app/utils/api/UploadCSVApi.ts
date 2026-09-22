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
	dispatch: Dispatch, language: string): Promise<ApiResponse> => { //added language parameter for i18n
	const backend = new ApiBackend();
	const formData = new FormData();
	const uploadPreferencesForm: ReadingsCSVUploadPreferences = {
		...uploadPreferences,
		gzip: uploadPreferences.gzip,
		headerRow: uploadPreferences.headerRow,
		update: uploadPreferences.update,
		refreshReadings: uploadPreferences.refreshReadings,
		honorDst: uploadPreferences.honorDst,
		relaxedParsing: uploadPreferences.relaxedParsing,
		useMeterZone: uploadPreferences.useMeterZone,
		warnOnCumulativeReset: uploadPreferences.warnOnCumulativeReset
	};
	for (const [preference, value] of Object.entries(uploadPreferencesForm)) {
		formData.append(preference, value.toString());
	}
	formData.append('csvfile', readingsFile);

	let message = '';
	try {
		//sends langauge preference to server
		message = await backend.doPostRequest<string>('/api/csv/readings', formData, {}, { 'Accept-Language': language });
		dispatch(baseApi.util.invalidateTags(['Readings']));
		return { success: true, message: message };
	} catch (error) {
		return { success: false, message: error.response.data };
	}
};

export const submitMeters = async (uploadPreferences: MetersCSVUploadPreferences, metersFile: File,
	dispatch: Dispatch, language: string): Promise<ApiResponse> => { //added language for i18n
	const backend = new ApiBackend();
	const formData = new FormData();
	const uploadPreferencesForm: CSVUploadPreferences = {
		...uploadPreferences,
		gzip: uploadPreferences.gzip,
		headerRow: uploadPreferences.headerRow,
		update: uploadPreferences.update
	};
	for (const [preference, value] of Object.entries(uploadPreferencesForm)) {
		formData.append(preference, value.toString());
	}
	formData.append('csvfile', metersFile);

	try {
		//send langauge preference to server
		const response = await backend.doPostRequest<string>('/api/csv/meters', formData, {}, { 'Accept-Language': language });
		dispatch(baseApi.util.invalidateTags(['MeterData']));
		return { success: true, message: response };
	} catch (error) {
		return { success: false, message: error.response.data };
	}
};