/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import ApiBackend from './ApiBackend';
import { ConversionArrayRequestItem } from 'types/redux/conversionArray';

export default class ConversionArrayApi {
	private readonly backend: ApiBackend;

	constructor(backend: ApiBackend) {
		this.backend = backend;
	}

	public async getConversionArray(): Promise<ConversionArrayRequestItem> {
		return await this.backend.doGetRequest<ConversionArrayRequestItem>('/api/conversion-array');
	}
}
