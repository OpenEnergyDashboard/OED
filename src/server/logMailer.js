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
 * @returns {boolean} if there is a special error in the message stack
 */
function checkIfMessageContainsSpecialError() {
	let isImportant = false;
	for (let i = 0; i < errorMessageStack.length; i++) {
		if (errorMessageStack[i].includes('does not parse to a valid moment object')) {
			isImportant = true;
			break;
		}
	}
	return isImportant;
}

/**
 * @param isImportant if there is a special error in the message stack
 * @returns {String} the subject of the email
 */
function createEmailSubject(isImportant) {
	let subject;
	if (isImportant) {
		subject = `[IMPORTANT] [OED ${config.mailer.org}] Open Energy Dashboard ERROR`;
	} else {
		subject = `[OED ${config.mailer.org}] Open Energy Dashboard ERROR`;
	}
	return subject;
}

/**
 * Create the body of the email. Color message red it if it is a special error
 * @returns {string} the content of the email
 */
function createEmailBody() {
	// Split array then combined into a string message
	let message = '';
	for (let i = 0; i < errorMessageStack.length; i++) {
		if (errorMessageStack[i].includes('does not parse to a valid moment object')) {
			message += `<p style='color:red;'>${errorMessageStack[i]}</p>`;
		} else {
			message += `<p>${errorMessageStack[i]}</p>`;
		}
		message += '<hr>';
	}
	return message;
}

/**
 * Send an e-mail representing an error message.
 */
async function logMailer() {

	// When there is no error, don't send email
	if (errorMessageStack.length === 0) {
		return;
	}

	const isImportant = checkIfMessageContainsSpecialError();

	const emailSubject = createEmailSubject(isImportant);

	const emailBody = createEmailBody();

	let mailOptions = {
		from: config.mailer.from,
		to: config.mailer.to,
		subject: emailSubject,
		text: emailBody
	};

	let transporter;
	// Create transporter based on the service, log error if there is something wrong with the email or credential
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
		log.error(`Unable to send e-mail due to unknown mailer method ${config.mailer.method}`, null, true);
		return;
	}

	transporter.sendMail(mailOptions, (err, info) => {
		if (err) {
			log.err(`\t[EMAIL NOT SENT]: ${err.message}`, err, true);
		} else {
			log.info(`\t[EMAIL SENT]: ${info.response}`);
			// Clear the error message stack when email is sent
			errorMessageStack = [];
		}
	});
}

module.exports = {
	addToEmailStack,
	logMailer
};
