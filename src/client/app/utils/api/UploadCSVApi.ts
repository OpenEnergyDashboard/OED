/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { baseApi } from '../../redux/api/baseApi';
import { meterAdapter, metersApi } from '../../redux/api/metersApi';
import {
	BooleanTypes,
	CSVUploadPreferencesForm,
	MetersCSVUploadPreferencesItem,
	ReadingsCSVUploadPreferencesForm,
	ReadingsCSVUploadPreferencesItem
} from '../../types/csvUploadForm';
import { MeterData } from '../../types/redux/meters';
import ApiBackend from './ApiBackend';

interface MetersUploadResponse {
	message: string;
	meters: MeterData[];
}

export const submitReadings = async (uploadPreferences: ReadingsCSVUploadPreferencesItem, readingsFile: File, dispatch: any): Promise<string> => {

	const backend = new ApiBackend();
	const formData = new FormData();
	// The Boolean values in state must be converted to the submitted values of yes and no.
	const uploadPreferencesForm: ReadingsCSVUploadPreferencesForm = {
		...uploadPreferences,
		gzip: uploadPreferences.gzip ? BooleanTypes.true : BooleanTypes.false,
		headerRow: uploadPreferences.headerRow ? BooleanTypes.true : BooleanTypes.false,
		update: uploadPreferences.update ? BooleanTypes.true : BooleanTypes.false,
		refreshReadings: uploadPreferences.refreshReadings ? BooleanTypes.true : BooleanTypes.false,
		honorDst: uploadPreferences.honorDst ? BooleanTypes.true : BooleanTypes.false,
		relaxedParsing: uploadPreferences.relaxedParsing ? BooleanTypes.true : BooleanTypes.false,
		useMeterZone: uploadPreferences.useMeterZone ? BooleanTypes.true : BooleanTypes.false
	};
	for (const [preference, value] of Object.entries(uploadPreferencesForm)) {
		formData.append(preference, value.toString());
	}
	formData.append('csvfile', readingsFile); // It is important for the server that the file is attached last.

	try {
		await backend.doPostRequest<void>('/api/csv/readings', formData);
		dispatch(baseApi.util.invalidateTags(['Readings']));
	} catch (error) {
		return 'Error submitting readings: ' + error;
	}
	return 'Reading have been added successfully!';
};

export const submitMeters = async (uploadPreferences: MetersCSVUploadPreferencesItem, metersFile: File, dispatch: any): Promise<string> => {

	const backend = new ApiBackend();
	const formData = new FormData();
	console.log('inside submitMeters!!');
	// The Boolean values in state must be converted to the submitted values of yes and no.
	const uploadPreferencesForm: CSVUploadPreferencesForm = {
		...uploadPreferences,
		gzip: uploadPreferences.gzip ? BooleanTypes.true : BooleanTypes.false,
		headerRow: uploadPreferences.headerRow ? BooleanTypes.true : BooleanTypes.false,
		update: uploadPreferences.update ? BooleanTypes.true : BooleanTypes.false
	};
	for (const [preference, value] of Object.entries(uploadPreferencesForm)) {
		formData.append(preference, value.toString());
	}
	formData.append('csvfile', metersFile); // It is important for the server that the file is attached last.

	try {
		const response = await backend.doPostRequest<MetersUploadResponse>('/api/csv/meters', formData);
		const { message, meters } = response;
		const meterNames: string[] = [];

		// If new meters were added to DB, have redux add them to getMeters state
		/// If meters were updated to the DB, invalidate meters
		/// This is how the Redux metersAPI currently functions, so mirroring this functionality
		if (uploadPreferences.update === true) {
			dispatch(baseApi.util.invalidateTags(['MeterData']));
			// meters were invalidated so all meter changes will now reflect in Redux state, now return
			return message;
		} else {
			// add each new meter into Redux state without invalidating all meters
			meters.forEach(meter => {
				dispatch(metersApi.util.updateQueryData('getMeters', undefined, cacheDraft => {
					meterAdapter.addOne(cacheDraft, meter);
				}));
				meterNames.push(meter.name + ', ');
			});
			return 'The following meters were added: ' + meterNames.forEach;
		}

	} catch (error) {
		return 'Error submitting meters: ' + error;
	}
};
