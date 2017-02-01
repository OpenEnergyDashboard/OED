const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

module.exports = (req, res, next) => {
	const token = req.headers['x-access-token'] || req.body.token || req.query.token;
	if (token) {
		return jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
			if (err) {
				return res.json({ success: false, message: 'Failed to authenticate token.' });
			}
			req.decoded = decoded;
			return next();
		});
	}
	return res.status(403).send({
		success: false,
		message: 'No token provided.'
	});
};
