/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import ApiBackend from './ApiBackend';
import { LogData } from '../../types/redux/logs';
import { TimeInterval } from '../../../../common/TimeInterval';

export default class LogsApi {
	private readonly backend: ApiBackend;

	constructor(backend: ApiBackend) {
		this.backend = backend;
	}

	public async info(log: LogData): Promise<void> {
		return await this.backend.doPostRequest('/api/logs/info', log);
	}

	public async warn(log: LogData): Promise<void> {
		return await this.backend.doPostRequest('/api/logs/warn', log);
	}

	public async error(log: LogData): Promise<void> {
		return await this.backend.doPostRequest('/api/logs/error', log);
	}

	public async getLogsByDateRangeAndType(timeInterval: TimeInterval, logTypes: string, logLimit: string): Promise<LogData[]> {
		const request = await this.backend.doGetRequest('/api/logs/logsmsg/getLogsByDateRangeAndType',
			{ timeInterval: timeInterval.toString(), logTypes: logTypes, logLimit: logLimit });
		return request as LogData[];
	}

}
