/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Dispatch } from '@reduxjs/toolkit';
import { baseApi } from '../../redux/api/baseApi';
import {
	CSVUploadPreferencesForm,
	MetersCSVUploadPreferencesItem,
	ReadingsCSVUploadPreferencesForm,
	ReadingsCSVUploadPreferencesItem
} from '../../types/csvUploadForm';
import ApiBackend from './ApiBackend';
import { TrueFalseType } from '../../types/items';

interface ApiResponse {
	success: boolean,
	message: string
}

export const submitReadings = async (uploadPreferences: ReadingsCSVUploadPreferencesItem, readingsFile: File,
	dispatch: Dispatch): Promise<ApiResponse> => {
	const backend = new ApiBackend();
	const formData = new FormData();
	// The Boolean values in state must be converted to the submitted values of yes and no.
	const uploadPreferencesForm: ReadingsCSVUploadPreferencesForm = {
		...uploadPreferences,
		gzip: uploadPreferences.gzip ? TrueFalseType.true : TrueFalseType.false,
		headerRow: uploadPreferences.headerRow ? TrueFalseType.true : TrueFalseType.false,
		update: uploadPreferences.update ? TrueFalseType.true : TrueFalseType.false,
		refreshReadings: uploadPreferences.refreshReadings ? TrueFalseType.true : TrueFalseType.false,
		honorDst: uploadPreferences.honorDst ? TrueFalseType.true : TrueFalseType.false,
		relaxedParsing: uploadPreferences.relaxedParsing ? TrueFalseType.true : TrueFalseType.false,
		useMeterZone: uploadPreferences.useMeterZone ? TrueFalseType.true : TrueFalseType.false
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

export const submitMeters = async (uploadPreferences: MetersCSVUploadPreferencesItem, metersFile: File,
	dispatch: Dispatch): Promise<ApiResponse> => {
	const backend = new ApiBackend();
	const formData = new FormData();
	// The Boolean values in state must be converted to the submitted values of yes and no.
	const uploadPreferencesForm: CSVUploadPreferencesForm = {
		...uploadPreferences,
		gzip: uploadPreferences.gzip ? TrueFalseType.true : TrueFalseType.false,
		headerRow: uploadPreferences.headerRow ? TrueFalseType.true : TrueFalseType.false,
		update: uploadPreferences.update ? TrueFalseType.true : TrueFalseType.false
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
