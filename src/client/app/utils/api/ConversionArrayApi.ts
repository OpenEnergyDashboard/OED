/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

// TODO Marked For Deletion after RTK migration solidified
/* eslint-disable jsdoc/check-param-names */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck

import ApiBackend from './ApiBackend';

export default class ConversionArrayApi {
	private readonly backend: ApiBackend;

	constructor(backend: ApiBackend) {
		this.backend = backend;
	}

	public async getConversionArray(): Promise<boolean[][]> {
		return await this.backend.doGetRequest<boolean[][]>('/api/conversion-array');
	}

	public async refresh(redoCik: boolean, refreshReadingViews: boolean) {
		return await this.backend.doPostRequest<void>('/api/conversion-array/refresh', { redoCik, refreshReadingViews });
	}
}
