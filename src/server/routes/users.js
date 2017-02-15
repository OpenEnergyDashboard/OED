const express = require('express');
const User = require('../models/User');

const router = express.Router();

/**
 * Route for getting all users
 */
router.get('/', async (req, res) => {
	try {
		const rows = await User.getAll();
		res.json(rows);
	} catch (err) {
		console.error(`Error while performing GET all users query: ${err}`);
	}
});

/**
 * Route for getting a specific user by ID
 * @param user_id
 */
router.get('/:user_id', async (req, res) => {
	try {
		const rows = await User.getByID(req.params.user_id);
		res.json(rows);
	} catch (err) {
		console.error(`Error while performing GET specific user by id query: ${err}`);
	}
});

module.exports = router;
