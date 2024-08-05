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