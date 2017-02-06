const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const secretToken = require('../config').secretToken;

const router = express.Router();

/**
 * Authenticate users and return a JSON Web Token with their user ID.
 * @param {String} email
 * @param {String} Password
 */
router.post('/', (req, res) => {
	User.getByEmail(req.body.email)
		.catch(() => {
			throw new Error('User not found');
		})
		.then(user => Promise.all([
			Promise.resolve(user),
			bcrypt.compare(req.body.password, user.passwordHash)
		])).then(([user, isValid]) => {
			if (isValid) {
				const token = jwt.sign({ data: user.id }, secretToken, { expiresIn: 86400 });
				res.json({ token: token	});
			} else {
				throw new Error('Unauthorized password');
			}
		})
		.catch(err => {
			if (err.message === 'Unauthorized password' || err.message === 'User not found') {
				res.status(401).send({ text: 'Not authorized' });
			} else {
				res.status(500).send({ text: 'Internal Server Error' });
			}
		});
});

module.exports = router;
