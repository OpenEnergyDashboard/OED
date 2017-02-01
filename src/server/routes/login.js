const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

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
		])).then(isValid => {
			if (isValid[1]) {
				const token = jwt.sign({ data: isValid[0].id }, process.env.TOKEN_SECRET, { expiresIn: 86400 });
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
