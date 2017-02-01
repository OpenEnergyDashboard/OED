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
		.then(row => Promise.all([
			Promise.resolve(row),
			bcrypt.compare(req.body.password, row.passwordHash)
		])).then(isValid => {
			if (isValid[1]) {
				const token = jwt.sign({ data: isValid[0].id }, process.env.TOKEN_SECRET, {
					expiresIn: 86400 // expires in one day
				});
				res.json({
					token: token
				});
			} else {
				res.status(401).send({ text: 'Not authorized' });
			}
		})
		.catch(err => {
			console.log(err);
		});
});

module.exports = router;
