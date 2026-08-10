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