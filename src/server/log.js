const fs = require('fs');
const logFile = require('./config').logFile;
/**
 *
 * @param {String} message Message to log
 * @param {String} level Level of message: 'standard' or 'error'
 * @param {Boolean} logToFile Log to a file in addition to std out/error
 */
module.exports = (message, level = 'standard', logToFile = false) => {
	const messageToLog = `[${level}@${new Date(Date.now()).toISOString()}] ${message}\n`;
	if (level === 'error') {
		console.error(messageToLog); // eslint-disable-line no-console
	} else {
		console.log(messageToLog); // eslint-disable-line no-console
	}
	if (logToFile) {
		fs.appendFile(logFile, messageToLog, err => {
			if (err) {
				console.error(`Failed to write to log file: ${err}`); // eslint-disable-line no-console
			}
		});
	}
};
