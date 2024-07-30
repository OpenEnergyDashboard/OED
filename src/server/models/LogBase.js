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

class LogBase {
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
	 * Returns a promise to create the logging table
	 * @param conn the database connection to use
	 * @returns {Promise.<>}
	 */
	static createTable(conn) {
		return conn.none(sqlFile('logbase/create_logbase_table.sql'));
	}

  /**
   * Returns a promise to insert this log into the database
   * @param conn the database connection to use
   * @returns {Promise.<>}
   */
  async insert(conn) {
    const logBase = this;
    await conn.none(sqlFile('logbase/insert_new_log.sql'), logBase);
  }

  /**
   * Returns a promise to get all of the logs from the database
   * @param conn the connection to be used.
   * @returns {Promise.<array.<LogBase>>}
   */
  static async getAll(conn) {
    const rows = await conn.any(sqlFile('logbase/get_all_logs.sql'));
    if (rows.length > 0) {
      return rows.map(row => new LogEmail(row.logType, row.logMessage, row.logTime));
    }
  }

  /**
   * Returns a promise to get all of the logs in between two dates.
   * If no startDate is specified, all logs before the endDate are returned.
   * If no endDate is specified, all logs after the startDate are returned.
   * @param {Date} startDate
   * @param {Date} endDate
   * @param conn is the connection to use.
   * @returns {Promise.<array.<LogBase>>}
   */
  static async getLogsByDateRange(startDate, endDate, conn) {
    const rows = await conn.any(sqlFile('logbase/get_logs_from_dates.sql'), {
      startDate: startDate,
      endDate: endDate
    });

    return rows;
  }
}
module.exports = LogBase;