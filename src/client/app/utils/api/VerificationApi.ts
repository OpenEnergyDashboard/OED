/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import ApiBackend from './ApiBackend';
import { getToken } from '../token';

class VerificationApi {
	private readonly backend: ApiBackend;

	constructor(backend: ApiBackend) {
		this.backend = backend;
	}

	public async checkTokenValid(): Promise<boolean> {
		// This will not throw an error if the status code is 401 unauthorized or 403 forbidden
		const { success } = await this.backend.doPostRequest<{success: boolean}>(
			'/api/verification',
			{ token: getToken() },
			undefined,
			undefined,
			{ validateStatus: status => (status >= 200 && status < 300) || (status === 401 || status === 403) });
		return success;
	}

	public async login(email: string, password: string): Promise<string> {
		const response = await this.backend.doPostRequest<{token: string}>('/api/login/', {email, password});
		return response.token;
	}
}

export default VerificationApi;
