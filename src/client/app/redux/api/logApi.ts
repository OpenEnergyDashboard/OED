/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { LogData } from 'types/redux/logs';
import { baseApi } from './baseApi';

export const logsApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		logToServer: builder.mutation<void, LogData & { level: 'info' | 'warn' | 'error' }>({
			query: ({ level, ...logData }) => ({
				url: `api/logs/${level}`,
				method: 'POST',
				body: logData
			})
		})
	})
});