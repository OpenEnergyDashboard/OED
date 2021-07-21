/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import ApiBackend from './ApiBackend';
import { ReadingsCSVUploadPreferencesItem, MetersCSVUploadPreferencesItem } from '../../types/csvUploadForm';

export default class UploadCSVApi {
	private readonly backend: ApiBackend;

	constructor(backend: ApiBackend) {
		this.backend = backend;
	}

	public async submitReadings(uploadPreferences: ReadingsCSVUploadPreferencesItem, readingsFile: File): Promise<void> {
		const formData = new FormData();
		for (const [preference, value] of Object.entries(uploadPreferences)) {
			formData.append(preference, value.toString());
		}
		formData.append('csvfile', readingsFile); // It is important for the server that the file is attached last.
		return await this.backend.doPostRequest<void>('/api/csv/readings', formData);
	}

	public async submitMeters(uploadPreferences: MetersCSVUploadPreferencesItem, metersFile: File): Promise<void> {
		const formData = new FormData();
		for (const [preference, value] of Object.entries(uploadPreferences)) {
			formData.append(preference, value.toString());
		}
		formData.append('csvfile', metersFile); // It is important for the server that the file is attached last.
		await this.backend.doPostRequest<void>('/api/csv/meters', formData);
	}
}
