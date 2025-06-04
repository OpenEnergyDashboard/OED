/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');
const sqlFile = database.sqlFile;

class LogMsg {
	/**
	 * Creates a new log
	 * @param logType log type. Have to be INFO, WARN, ERROR, or SILENT
	 * @param logMessage log information
	 * @param {Moment} logTime the date and time of the log
	 */
	constructor(logType, logMessage, logTime) {
		this.logType = logType;
		this.logMessage = logMessage;
		this.logTime = logTime;
	}

	/**
	 * Creates a new log from data in the row
	 * @param {*} row The row from which the log is to be created.
	 * @returns The new log object.
	 */
	static mapRow(row) {
		return new LogMsg(row.log_type, row.log_message, row.log_time);
	}

	/**
	 * Returns a promise to create the logging table
	 * @param conn the database connection to use
	 * @returns {Promise.<>}
	 */
	static createTable(conn) {
		return conn.none(sqlFile('logmsg/create_logmsg_table.sql'));
	}

	/**
	 * Returns a promise to create the logMsgType enum.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<>}
	 */
	static createLogMsgTypeEnum(conn) {
		return conn.none(sqlFile('logmsg/create_log_types_enum.sql'));
	}

	/**
	 * Returns a promise to insert this log into the database
	 * @param conn the database connection to use
	 * @returns {Promise.<>}
	 */
	async insert(conn) {
		const logMsg = this;
		await conn.none(sqlFile('logmsg/insert_new_logmsg.sql'), {
			logType: logMsg.logType,
			logMessage: logMsg.logMessage,
			logTime: logMsg.logTime.format('YYYY-MM-DDTHH:mm:ss.SSS')
		});
	}

	/**
	 * Returns a promise to get all of the logs in between two dates.
	 * @param {Date} startDate start date of the range to get logs
	 * @param {Date} endDate end date of the range to get logs
	 * @param {Array<string>} logTypes array of log types to get logs
	 * @param {Number} logLimit the maximum number of logs to return
	 * @param conn is the connection to use.
	 * @returns {Promise.<array.<LogMsg>>}
	 */
	static async getLogsByDateRangeAndType(startDate = null, endDate = null, logTypes, logLimit = 100, conn) {
		const rows = await conn.any(sqlFile('logmsg/get_logmsgs_from_dates_and_type.sql'), {
			startDate: startDate || '-infinity',
			endDate: endDate || 'infinity',
			logTypes: logTypes,
			logLimit: logLimit
		});

		return rows.map(LogMsg.mapRow);
	}
}
module.exports = LogMsg;