/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');
const { mapToObject, threeDHoleAlgorithm } = require('../util');
const determineMaxPoints = require('../util/determineMaxPoints');
const log = require('../log');
const { isReadonlyKeywordOrPlusOrMinusToken } = require('typescript');
const LogEmail = require('./LogEmail');

const sqlFile = database.sqlFile;

class LogMsg {
	/**
	 * Creates a new log
	 * @param logType
	 * @param logMessage
	 * @param {Moment} logTime
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
		return new LogMsg(row.logType, row.logMessage, row.logTime);
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
		await conn.none(sqlFile('logmsg/insert_new_log.sql'), logMsg);
	}

	/**
	 * Returns a promise to get all of the logs from the database
	 * @param conn the connection to be used.
	 * @returns {Promise.<array.<logMsg>>}
	 */
	static async getAll(conn) {
		const rows = await conn.any(sqlFile('logmsg/get_all_logs.sql'));
		if (rows.length > 0) {
			return rows.map(LogMsg.mapRow);
		}
	}

	/**
	 * Returns a promise to get all of the logs in between two dates.
	 * If no startDate is specified, all logs before the endDate are returned.
	 * If no endDate is specified, all logs after the startDate are returned.
	 * @param {Date} startDate
	 * @param {Date} endDate
	 * @param conn is the connection to use.
	 * @returns {Promise.<array.<LogMsg>>}
	 */
	static async getLogsByDateRange(startDate, endDate, conn) {
		const rows = await conn.any(sqlFile('logmsg/get_logs_from_dates.sql'), {
			startDate: startDate,
			endDate: endDate
		});

		return rows.map(LogMsg.mapRow);
	}

	/**
	 * Returns a promise to get all of the logs of a certain type
	 * @param logType
	 * @param conn is the connection to use.
	 * @returns {Promise.<array.<LogMsg>>}
	 */
	static async getLogsByType(logType, conn){
		const rows = await conn.any(sqlFile('logmsg/get_logs_from_type.sql'), {logType: logType});

		return rows.map(LogMsg.mapRow);
	}

	/**
	 * Returns a promise to get all of the logs in between two dates.
	 * If no startDate is specified, all logs before the endDate are returned.
	 * If no endDate is specified, all logs after the startDate are returned.
	 * @param {Date} startDate
	 * @param {Date} endDate
	 * @param logType
	 * @param conn is the connection to use.
	 * @returns {Promise.<array.<LogMsg>>}
	 */
	static async getLogsByDateRangeAndType(startDate, endDate, logType, conn) {
		const rows = await conn.any(sqlFile('logmsg/get_logs_from_dates_and_type.sql'), {
			startDate: startDate,
			endDate: endDate,
			logType: logType
		});

		return rows.map(LogMsg.mapRow);
	}
}
module.exports = LogMsg;