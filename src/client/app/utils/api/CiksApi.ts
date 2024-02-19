/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import ApiBackend from './ApiBackend';
import { CikData } from 'types/redux/ciks';

export default class CiksApi {
	private readonly backend: ApiBackend;

	constructor(backend: ApiBackend) {
		this.backend = backend;
	}

	public async getCiksDetails(): Promise<CikData[]> {
		return await this.backend.doGetRequest<CikData[]>('/api/ciks');
	}
}
