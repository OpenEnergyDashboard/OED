const express = require('express');
const jwt = require('jsonwebtoken');
const secretToken = require('../config').secretToken;

const router = express.Router();

/**
 * Route for verifying a JWT.
 * @param token
 */
router.post('/', (req, res) => {
	const token = req.body.token;
	if (token) {
		jwt.verify(token, secretToken, err => {
			if (err) {
				res.status(401).json({ success: false, message: 'Failed to authenticate token.' });
			} else {
				res.status(200).json({ success: true });
			}
		});
	} else {
		res.status(403).send({
			success: false,
			message: 'No token provided.'
		});
	}
});

module.exports = router;
