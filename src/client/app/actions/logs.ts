/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { LogData } from '../types/redux/logs';
import { logsApi } from '../utils/api';

/**
 * pass client-side information to server console using logsApi on server-side, mainly for debugging purposes
 * @param level {string} type of message being logged
 * @param message {String} message to log
 * @param error {Error?} An optional error object to provide a stacktrace
 * @param skipMail {boolean?} Don't e-mail this message even if we would normally emit an e-mail for this level.
 */
export function logToServer(level: string, message: string, error?: Error, skipMail?: boolean) {
	const log: LogData = {
		message
	};
	if (error) { log.error = error; }
	if (skipMail) { log.skipMail = skipMail; }
	return async () => {
		try {
			switch (level) {
				case 'info':
					await logsApi.info(log);
					break;
				case 'warn':
					await logsApi.warn(log);
					break;
				case 'error':
					await logsApi.error(log);
					break;
				default:
					break;
			}
		} catch (e) {
			throw new Error(e);
		}
	};
}
