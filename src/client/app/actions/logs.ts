/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { LogData } from "../types/redux/logs";
import { logsApi } from "../utils/api";
const moment = require('moment');

export function logToServer(level: string, message: string, error?: Error, skipMail?: boolean) {
	let log: LogData = {
		message: message,
	};
	if (error) log.error = error;
	if (skipMail) log.skipMail = skipMail;
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
			console.log(e);
		}
	}
}
