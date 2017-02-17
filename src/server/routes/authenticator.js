const jwt = require('jsonwebtoken');
const secretToken = require('../config').secretToken;

/**
 * Middleware function to force a route to require authentication
 * Verifies the request's token against the server's secret token
 */
module.exports = (req, res, next) => {
	const token = req.headers.token || req.body.token || req.query.token;
	if (token) {
		jwt.verify(token, secretToken, (err, decoded) => {
			if (err) {
				res.status(401).json({ success: false, message: 'Failed to authenticate token.' });
			}
			req.decoded = decoded;
			next();
		});
	} else {
		res.status(403).send({
			success: false,
			message: 'No token provided.'
		});
	}
};
