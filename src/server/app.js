/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const fs = require('fs');
const express = require('express');
const rateLimit = require('express-rate-limit');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const config = require('./config');

const { log, LogLevel } = require('./log');

const users = require('./routes/users');
const readings = require('./routes/readings');
const meters = require('./routes/meters');
const preferences = require('./routes/preferences');
const login = require('./routes/login');
const verification = require('./routes/verification');
const groups = require('./routes/groups');
const version = require('./routes/version');
const timezones = require('./routes/timezones');
const createRouterForNewCompressedReadings = require('./routes/compressedReadings').createRouter;
const createRouterForCompareReadings = require('./routes/compareReadings').createRouter;
const baseline = require('./routes/baseline');
const maps = require('./routes/maps');
const logs = require('./routes/logs');
const obvius = require('./routes/obvius');
const csv = require('./routes/csv');
const conversions = require('./routes/conversions');

// Limit the rate of overall requests to OED
// Note that the rate limit may make the automatic test return the value of 429. In that case, the limiters below need to be increased.
// Create a limit of 200 requests/5 seconds
const generalLimiter = new rateLimit({
	windowMs: 5 * 1000, // 5 seconds
	max: 200 // 200 requests
});
// Apply the limit to overall requests
const app = express().use(generalLimiter);

// Limit the number of raw exports to 5 per 5 seconds
const exportRawLimiter = new rateLimit({
	windowMs: 5 * 1000, // 5 seconds
	max: 5 // 5 requests
});
// Apply the raw export limit
app.use('/api/readings/line/raw/meters', exportRawLimiter);

// If other logging is turned off, there's no reason to log HTTP requests either.
// TODO: Potentially modify the Morgan logger to use the log API, thus unifying all our logging.
if (log.level !== LogLevel.SILENT) {
	app.use(logger('dev'));
}

app.use(favicon(path.join(__dirname, '..', 'client', 'public', 'favicon.ico')));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
app.use(cookieParser());

app.use('/api/users', users);
app.use('/api/meters', meters);
app.use('/api/readings', readings);
app.use('/api/preferences', preferences);
app.use('/api/login', login);
app.use('/api/groups', groups);
app.use('/api/verification', verification);
app.use('/api/version', version);
app.use('/api/compressedReadings', createRouterForNewCompressedReadings());
app.use('/api/compareReadings', createRouterForCompareReadings());
app.use('/api/baselines', baseline);
app.use('/api/maps', maps);
app.use('/api/logs', logs);
app.use('/api/timezones', timezones);
app.use('/api/obvius', obvius);
app.use('/api/csv', csv);
app.use('/api/csv', csv);
app.use('/api/conversions', conversions);
app.use(express.static(path.join(__dirname, '..', 'client', 'public')));

const router = express.Router();

router.get(/^(\/)(login|admin|groups|createGroup|editGroup|graph|meters|editMeter|maps|calibration|users|csv|conversions)?$/, (req, res) => {
	fs.readFile(path.resolve(__dirname, '..', 'client', 'index.html'), (err, html) => {
		const subdir = config.subdir || '/';
		let htmlPlusData = html.toString().replace('SUBDIR', subdir);
		res.send(htmlPlusData);
	});
});


app.use(router);

app.use((req, res) => {
	res.status(404).send('<h1>404 Not Found</h1>');
});

module.exports = app;
