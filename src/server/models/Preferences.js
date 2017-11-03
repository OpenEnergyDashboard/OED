/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');

const db = database.db;
const sqlFile = database.sqlFile;

class Preferences {
	/**
	 * @param {Integer} userID - The id of the user with the preferences
	 * @param {String} displayTitle - Header title to display
	 * @param {String} defaultGraphType - Graph to display as default
	 * @param {Boolean} defaultBarStacking - Option to set default toggle of bar stacking
	 */
	constructor(userID, displayTitle, defaultGraphType, defaultBarStacking) {
		this.userID = userID;
		this.displayTitle = displayTitle;
		this.defaultGraphType = defaultGraphType;
		this.defaultBarStacking = defaultBarStacking;
	}

	/**
	 * Returns a promise to create the preferences table
	 * @returns {Promise.<>}
	 */
	static createTable() {
		return db.none(sqlFile('preferences/create_preferences_table.sql'));
	}

	/**
	 * Returns a promise to create the graph_type type.
	 * This needs to be run before Preferences.createTable().
	 * @return {Promise<void>}
	 */
	static createGraphTypesEnum() {
		return db.none(sqlFile('preferences/create_graph_types_enum.sql'));
	}

	/**
	 * Returns a promise to retrieve the user with the given id from the database.
	 * @param id
	 * @returns {Promise.<User>}
	 */
	static async getByID(id) {
		const row = await db.one(sqlFile('user/get_user_by_id.sql'), { id: id });
		return new User(row.id, row.email);
	}

	/**
	 * Returns a promise to retrieve the user with the given email from the database.
	 * This exposes the user's password_hash and should only be used for authentication purposes.
	 * @param email
	 * @returns {Promise.<User>}
	 */
	static async getByEmail(email) {
		const row = await db.one(sqlFile('user/get_user_by_email.sql'), { email: email });
		return new User(row.id, row.email, row.password_hash);
	}

	/**
	 * Returns a promise to get all of the user from the database
	 * @returns {Promise.<array.<User>>}
	 */
	static async getAll() {
		const rows = await db.any(sqlFile('user/get_all_users.sql'));
		return rows.map(row => new User(row.id, row.email));
	}

	/**
	 * Returns a promise to insert this user into the database
	 * @returns {Promise.<>}
	 */
	async insert() {
		const user = this;
		if (user.id !== undefined) {
			throw new Error('Attempted to insert a user that already has an ID');
		}
		return await db.none(sqlFile('user/insert_new_user.sql'), user);
	}
}

module.exports = Preferences;
