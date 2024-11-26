/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const fs = require('fs');
const express = require('express');
const rateLimit = require('express-rate-limit');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
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
const createRouterForReadings = require('./routes/unitReadings').createRouter;
const createRouterForCompareReadings = require('./routes/compareReadings').createRouter;
const baseline = require('./routes/baseline');
const maps = require('./routes/maps');
const logs = require('./routes/logs');
const obvius = require('./routes/obvius');
const csv = require('./routes/csv');
const conversionArray = require('./routes/conversionArray');
const units = require('./routes/units');
const conversions = require('./routes/conversions');
const ciks = require('./routes/ciks');

// Limit the rate of overall requests to OED
// Note that the rate limit may make the automatic test return the value of 429. In that case, the limiters below need to be increased.
// TODO Verify that user see the message returned, see https://express-rate-limit.mintlify.app/reference/configuration#message
// Create a limit of 200 requests/5 seconds
const generalLimiter = rateLimit({
	windowMs: 5 * 1000, // 5 seconds
	limit: 200, // 200 requests
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	// If rate limit is 10, OED won't load and bad things will happen
	message: async (req, res) => {
		const string = `
			<h1 style='text-align:center'>
				You have been rate limited by your OED site.
			</h1>
			<h2 style ='text-align:center'>
				We suggest you try these in this order: 
			</h2>
			<h2 
				style='text-align:center'>
			</h2>
			<div> 
				<ol style = "text-align: center; list-style-position: inside;"> 
					<li>
						Click the 'Refresh this page' button below to try again.
					</li>
					<li> 
						If you keep returning to this page wait longer and click 'Refresh this page' button.
					</li> 
					<li>
						Contact your site to find why the rate limit is denying access to the OED site.
					</li> 
				</ol>  
			</div>
			<h3 style='text-align:center'>
				<button onClick='window.location.reload();'> 
					Refresh this page 
				</button>
			</h3>
		`
		return string
	}
});
// Apply the limit to overall requests
const app = express().use(generalLimiter);

// This is limiting 3D-Graphic
const threeDLimiter = rateLimit({
	// TODO This was causing tests to fail for 3D rejection. This limit seems to be okay
	// but we should find a better solution than upping values just for tests.
	windowMs: 10 * 1000, // 10 seconds
	limit: 15,
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false // Disable the `X-RateLimit-*` headers
});
app.use('/api/unitReadings/threeD/meters', threeDLimiter);

// Limit the number of raw exports to 5 per 5 seconds
const exportRawLimiter = rateLimit({
	windowMs: 5 * 1000, // 5 seconds
	limit: 5, // 5 requests
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false // Disable the `X-RateLimit-*` headers
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

app.use('/api/users', users);
app.use('/api/meters', meters);
app.use('/api/readings', readings);
app.use('/api/preferences', preferences);
app.use('/api/login', login);
app.use('/api/groups', groups);
app.use('/api/verification', verification);
app.use('/api/version', version);
app.use('/api/unitReadings', createRouterForReadings());
app.use('/api/compareReadings', createRouterForCompareReadings());
app.use('/api/baselines', baseline);
app.use('/api/maps', maps);
app.use('/api/logs', logs);
app.use('/api/obvius', obvius);
app.use('/api/csv', csv);
app.use('/api/conversion-array', conversionArray);
app.use('/api/units', units);
app.use('/api/conversions', conversions);
app.use('/api/ciks', ciks);
app.use(express.static(path.join(__dirname, '..', 'client', 'public')));

const router = express.Router();

// Accept all other endpoint requests which will be handled by the client router
router.get('*', (req, res) => {
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
