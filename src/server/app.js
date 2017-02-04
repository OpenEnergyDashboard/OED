const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const users = require('./routes/users');
const meters = require('./routes/meters');
const login = require('./routes/login');
const verification = require('./routes/verification');

const app = express();

app.use(favicon(path.join(__dirname, '..', 'client', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'client')));

app.use('/api/users', users);
app.use('/api/meters', meters);
app.use('/api/login', login);
app.use('/api/verification', verification);

app.get('*', (req, res) => {
	res.sendFile(path.resolve(__dirname, '..', 'client', 'index.html'));
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
	const err = new Error('Not Found');
	err.status = 404;
	next(err);
});

app.use((err, req, res) => {
	res.status(err.status || 500);
	if (err.status === 404) res.send(`<h1>${err.status} Not found</h1>`);
	else res.send(`<h1>${err.status} Server Error</h1>`);
});

module.exports = app;
