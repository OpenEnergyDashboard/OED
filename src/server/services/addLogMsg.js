/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const fs = require('fs');
const logFile = require('../config').logFile;
const LogMsg = require('../models/LogMsg');
const { getConnection } = require('../db');
const moment = require('moment');

async function addLogMsgToDB() {
    try {
        const data = await fs.promises.readFile(logFile, 'utf8');
        const logEntries = data.split('[');
        const conn = getConnection();

        for (const entry of logEntries) {
            const logParts = entry.match(/(.*?)@(.*?)\] ([^\[]*)(?=\[|$)/s);
            if (logParts) {
                const [, logType, logTime, logMessage] = logParts;
                const logMsg = new LogMsg(logType, logMessage, moment(logTime));
                try {
                    await logMsg.insert(conn);
                } catch (err) {
                    console.error(`Failed to write log to database: ${err} (${err.stack})`);
                }
            }
        }
        console.log('Log migration completed successfully.');
    } catch (err) {
        console.error(`Failed to migrate logs to database: ${err} (${err.stack})`);
    }
}

module.exports = { addLogMsgToDB };