/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import ApiBackend from './ApiBackend';

export default class FileProcessingApi {
	private readonly backend: ApiBackend;

	constructor(backend: ApiBackend) {
		this.backend = backend;
	}

	public async submitNewReadings(meterID: number, readingsFile: File): Promise<void> {
		const formData = new FormData();
		formData.append('csvFile', readingsFile);
		return await this.backend.doPostRequest<void>(`/api/fileProcessing/readings/${meterID}`, formData);
	}

	public async submitNewMeters(meters: [string]): Promise<void> {
		return await this.backend.doPostRequest<void>('/api/fileProcessing/meters', { meters });
	}
}
