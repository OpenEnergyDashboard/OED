/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'OED API',
			version: '1.0.0',
			description: 'OpenEnergyDashboard API documentation'
		},
		servers: [
			{
				url: '/'
			}
		]
	},
	apis: ['./src/server/routes/*.js']
};

module.exports = swaggerJsdoc(options);