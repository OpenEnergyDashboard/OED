/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const nodemailer = require('nodemailer');
const mg = require('nodemailer-mailgun-transport');
const config = require('./config');
const { log } = require('./log');

let errorMessageStack = [];

/**
 * Add message to message stack.
 * @param {String} message
 */
function addToEmailStack(message) {
	errorMessageStack.push(message);
}

/**
 * Send an e-mail representing an error message.
 */
function logMailer() {

	// When there is no error, don't send email
	if (errorMessageStack.length === 0) {
		return;
	}

	// Split array then combined into a string message
	let message = '';
	for (let i = 0; i < errorMessageStack.length; i++) {
		message += errorMessageStack[i] + '\n' + '\n' + '\n';
	}

	let mailOptions = {
		from: config.mailer.from,
		to: config.mailer.to,
		subject: `[OED ${config.mailer.org}] Open Energy Dashboard ERROR`,
		text: message
	};

	let transporter;
	if (config.mailer.method === 'none') {
		return;
	} else if (config.mailer.method === 'mailgun') {
		transporter = nodemailer.createTransport(mg({
			auth: {
				api_key: config.mailer.credential,
				domain: config.mailer.ident
			}
		}));
	} else if (config.mailer.method === 'gmail') {
		transporter = nodemailer.createTransport({
			service: 'gmail',
			auth: {
				user: config.mailer.ident,
				pass: config.mailer.credential
			}
		});
	} else {
		// tslint:disable-next-line no-console
		console.error(`Unable to send e-mail due to unknown mailer method ${config.mailer.method}`, true);
		return;
	}

	transporter.sendMail(mailOptions, (err, info) => {
		if (err) {
			// tslint:disable-next-line no-console
			console.error(`\t[EMAIL NOT SENT]: ${err.message}`);
		} else {
			// tslint:disable-next-line no-console
			console.log(`\t[EMAIL SENT]: ${info.response}`);
			// Clear the error message stack when email is sent
			errorMessageStack = [];
		}
	});
}

module.exports = addToEmailStack;
