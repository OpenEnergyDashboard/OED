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

export default class VersionApi {
	private readonly backend: ApiBackend;

	constructor(backend: ApiBackend) {
		this.backend = backend;
	}

	public async getVersion(): Promise<string> {
		return await this.backend.doGetRequest<string>('/api/version');
	}
}