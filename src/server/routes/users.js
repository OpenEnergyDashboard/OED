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

const router = express.Router();

/**
 * Route for getting all users
 */
router.get('/', async (req, res) => {
	const conn = getConnection();
	try {
		const rows = await User.getAll(conn);
		res.json(rows);
	} catch (err) {
		log.error(`Error while performing GET all users query: ${err}`, err);
	}
});

/**
 * Route for getting a specific user by ID
 * @param user_id
 */
router.get('/:user_id', async (req, res) => {
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

router.post('/', adminAuthMiddleware('create a user.'), async (req, res) => {
	const validParams = {
		type: 'object',
		required: ['email', 'password', 'role'],
		properties: {
			email: {
				type: 'string'
			},
			password: {
				type: 'string'
			},
			role: {
				type: 'string',
				enum: Object.values(User.role)
			}
		}
	};
	if (!validate(req.body, validParams).valid) {
		res.status(400).json({ message: 'Invalid params' });
	} else {
		try {
			const conn = getConnection();
			const { email, password, role } = req.body;
			const hashedPassword = await bcrypt.hash(password, 10);
			const user = new User(undefined, email, hashedPassword, role);
			user.insert(conn);
			res.sendStatus(200);
		} catch (error) {
			log.error(`Error while performing POST request to create user: ${error}`, error);
			res.status(500).json({ message: 'Internal Server Error', error: error });
		}
	}
});

/**
 * Route for updating user role
 */
router.post('/edit', adminAuthMiddleware('update a user role'), async (req, res) => {
	const validParams = {
		type: 'object',
		required: ['users'],
		properties: {
			users: {
				type: 'array',
				items: {
					type: 'object',
					required: ['email', 'role'],
					properties: {
						email: {
							type: 'string'
						},
						role: {
							type: 'string',
							enum: Object.values(User.role)
						}

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
			const { users } = req.body;
			const roleUpdates = users.map(async user => await User.updateUserRole(user.email, user.role, conn));
			await Promise.all(roleUpdates);
			res.sendStatus(200);
		} catch (error) {
			console.log(error);
		}
	}
});

/**
 * Route for deleting a user
 */
router.post('/delete', adminAuthMiddleware('delete a user'), async (req, res) => {
	const validParams = {
		type: 'object',
		required: ['email'],
		properties: {
			email: {
				type: 'string'
			}
		}
	};
	if (!validate(req.body, validParams).valid) {
		res.status(400).json({ message: 'Invalid params!' });
	} else {
		try {
			const conn = getConnection();
			const { email } = req.body;
			await User.deleteUser(email, conn);
			res.sendStatus(200);
		} catch (error) {
			console.log(error);
		}
	}
});

module.exports = router;