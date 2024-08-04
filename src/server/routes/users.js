/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const bcrypt = require('bcryptjs');
const express = require('express');
const User = require('../models/User');
const { log } = require('../log');
const validate = require('jsonschema').validate;
const { getConnection } = require('../db');
const { adminAuthMiddleware } = require('./authenticator');
const jwt = require('jsonwebtoken');
const secretToken = require('../config').secretToken;

const router = express.Router();

/**
 * Route for getting all users
 */
router.get('/', adminAuthMiddleware('get all users'), async (req, res) => {
	const conn = getConnection();
	try {
		const rows = await User.getAll(conn);
		res.json(rows);
	} catch (err) {
		log.error(`Error while performing GET all users query: ${err}`, err);
	}
});


/**
 * Route for obtaining the requestor's user info
 */
router.get('/token', async (req, res) => {
	const token = req.headers.token || req.body.token || req.query.token;
	const validParams = {
		type: 'string'
	};
	if (!validate(token, validParams).valid) {
		res.status(403).json({ message: 'No token provided or JSON was invalid.' });
	} else if (token) {
		jwt.verify(token, secretToken, async (err, decoded) => {
			if (err) {
				res.status(401).json({ message: 'Failed to authenticate token.' });
			} else {
				try {
					const conn = getConnection();
					const userProfile = await User.getByID(decoded.data, conn);
					res.status(200).json(
						{
							username: userProfile.username,
							role: userProfile.role
						});
				} catch (error) {
					res.status(401).json({ message: 'User does not exist in database.' });
				}
			}
		});
	} else {
		res.status(403).send({ message: 'No token provided.' });
	}
});

/**
 * Route for getting a specific user by ID
 * @param user_id
 */
router.get('/:user_id', adminAuthMiddleware('get one user'), async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['user_id'],
		properties: {
			user_id: {
				type: 'string',
				pattern: '^\\d+$'
			}
		}
	};
	if (!validate(req.params, validParams).valid) {
		res.sendStatus(400);
	} else {
		const conn = getConnection();
		try {
			const rows = await User.getByID(req.params.user_id, conn);
			res.json(rows);
		} catch (err) {
			log.error(`Error while performing GET specific user by id query: ${err}`, err);
			res.sendStatus(500);
		}
	}
});

router.post('/create', adminAuthMiddleware('create a user.'), async (req, res) => {
	const validParams = {
		type: 'object',
		required: ['username', 'password', 'role', 'note'],
		properties: {
			username: {
				type: 'string'
			},
			password: {
				type: 'string'
			},
			role: {
				type: 'string',
				enum: Object.values(User.role)
			},
			note: {
				type: 'string'
			}
		}
	};
	if (!validate(req.body, validParams).valid) {
		res.status(400).json({ message: 'Invalid params' });
	} else {
		try {
			const { username, password, role, note } = req.body;
			const conn = getConnection();
			// Check if user already exists
			const currentUser = await User.getByUsername(username, conn);
			if (currentUser !== null) {
				res.status(400).send({ message: `user ${username} already exists so cannot create` });
			} else {
				const hashedPassword = await bcrypt.hash(password, 10);
				const user = new User(undefined, username, hashedPassword, role, note);
				await user.insert(conn);
				res.sendStatus(200);
			}
		} catch (error) {
			log.error(`Error while performing POST request to create user: ${error}`, error);
			res.status(500).send({ message: 'Internal Server Error', error: error });
		}
	}
});

/**
 * Route for updating user role
 */
router.post('/edit', adminAuthMiddleware('update a user role'), async (req, res) => {
	
	const validParams = {
		type: 'object',
		required: ['user'],
		properties: {
			user: {
				type: 'object',
				required: ['id', 'username', 'role', 'note'],
				properties: {
					id: {
						type: 'integer'
					},
					username: {
						type: 'string',
						minLength: 3,
						maxLength: 254
							},
					role: {
						type: 'string',
						enum: Object.values(User.role)
					},
					password: {
						type: 'string',
						// TODO Do not have minLength: 8 because this is optional. Nice if could check if present.
						maxLength: 128
		
					},
					note: {
						type: 'string'
					}
				}
			}
		}
	};

	if (!validate(req.body, validParams).valid) {
		res.status(400).json({ message: 'Invalid params' });
	} else {
		try {
			const conn = getConnection();
			const { user } = req.body;
			const userBeforeChanges = await User.getByID(user.id,conn);
			
			// This protects the database so that there will always be at least one admin
			if (userBeforeChanges.role === 'admin' && user.role !== 'admin') {
				const numberOfAdmins = await User.getNumberOfAdmins(conn);
				if (numberOfAdmins < 2) {
					const errorMessage = 'There must be at least one admin remaining to avoid lockout!';
					log.error(errorMessage);
					return res.status(400).json({
						message: errorMessage,
					});
				}
			}

			// set up Asynchronous database queries
			const userUpdates = [];

			// update user
			userUpdates.push(
				User.updateUser(user.id, user.username, user.role, user.note, conn)
			);
			
			
			// update the user's password if needed
			if (user.password) {
				const hashedPassword = await bcrypt.hash(user.password, 10);
				userUpdates.push(
					User.updateUserPassword(user.id, hashedPassword, conn)
				);
			}

			await Promise.all(userUpdates);
			return res.sendStatus(200);

		} catch (error) {
			
			log.error('Error while performing edit user request.', error);
			res.status(500).json({
				message: 'Error while performing edit user request.',
				error: error.message
			});
		}
	}
});

/**
 * Route for deleting a user
 */
router.post('/delete', adminAuthMiddleware('delete a user'), async (req, res) => {
	const validParams = {
		type: 'object',
		required: ['username'],
		properties: {
			username: {
				type: 'string'
			}
		}
	};
	if (!validate(req.body, validParams).valid) {
		res.status(400).json({ message: 'Invalid params!' });
	} else {
		try {
			const conn = getConnection();
			const { username } = req.body;
			const id = req.decoded.data;
			const user = await User.getByID(id, conn);
			if (user.username === username) {// Admins cannot delete themselves
				res.sendStatus(400);
			} else {
				await User.deleteUser(username, conn);
				res.sendStatus(200);
			}
		} catch (error) {
			log.error('Error while performing delete user request', error);
			res.sendStatus(500);
		}
	}
});

module.exports = router;
