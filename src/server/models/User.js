/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');

const sqlFile = database.sqlFile;

class User {
	/**
	 * @param id This users's ID. Should be undefined if the user is being newly created
	 * @param email This user's email
	 * @param passwordHash The user's passwordHash
	 * @param role The user's role
	 * @param note The user note
	 */
	constructor(id, email, passwordHash, role, note) {
		this.id = id;
		this.email = email;
		this.passwordHash = passwordHash;
		this.role = role;
		this.note = note;
	}

	/**
	 * Returns a promise to create the users table
	 * @param conn is the connection to use.
	 * @returns {Promise.<>}
	 */
	static createTable(conn) {
		return conn.none(sqlFile('user/create_users_table.sql'));
	}

	/**
	 * Returns a promise to retrieve the user with the given id from the database.
	 * @param conn is the connection to use.
	 * @param id
	 * @returns {Promise.<User>}
	 */
	static async getByID(id, conn) {
		const row = await conn.one(sqlFile('user/get_user_by_id.sql'), { id: id });
		return new User(row.id, row.email, row.password_hash, row.role);
	}

	/**
	 * Returns a promise to retrieve the user with the given email from the database.
	 * This exposes the user's password_hash and should only be used for authentication purposes.
	 * @param email the email to look up
	 * @param conn the connection to use.
	 * @returns {Promise.<User>} either the user object with info or null if does not exist.
	 */
	static async getByEmail(email, conn) {
		const row = await conn.oneOrNone(sqlFile('user/get_user_by_email.sql'), { email: email });
		return row === null ? null : new User(row.id, row.email, row.password_hash, row.role);
	}

	/**
	 * Returns a promise to retrieve the number of admins in the user table
	 * @param conn the connection to use.
	 * @returns {Promise.<Integer>} the amount of admins
	 */
		static async getNumberOfAdmins(conn) {
			return await conn.one(sqlFile('user/get_number_of_admins.sql'));
		}

	/**
	 * Returns a promise to get all of the users from the database
	 * @param conn is the connection to use.
	 * @returns {Promise.<array.<User>>}
	 */
	static async getAll(conn) {
		const rows = await conn.any(sqlFile('user/get_all_users.sql'));
		return rows.map(row => new User(row.id, row.email, undefined, row.role));
	}

	/**
	 * Returns a promise to update a user's password
	 * @param id the id of the user whose password is to be updated
	 * @param passwordHash the new password's hash
	 * @param conn is the connection to use.
	 * @returns {Promise.<array.<User>>}
	 */
	static async updateUserPassword(id, passwordHash, conn) {
		return conn.none(sqlFile('user/update_user_password.sql'), { id: id, password_hash: passwordHash });
	}

	/**
	 * Returns a promise to update a user's email
	 * @param id the id of the user whose email is to be updated
	 * @param conn is the connection to use.
	 * @returns {Promise<void>}
	 */
	static async updateUserEmail(id, email, conn) {
		return conn.none(sqlFile('user/update_user_email.sql'), { id: id, email: email });
	}

	/**
	 * Returns a promise to update a user's role
	 * @param id the id of the user whose role is to be updated
	 * @param role the new role
	 * @param conn is the connection to use.
	 * @returns {Promise<void>}
	 */
	static updateUserRole(id, role, conn) {
		return conn.none(sqlFile('user/update_user_role.sql'), { id: id, role: role });
	}

		/**
	 * Returns a promise to update a user's email
	 * @param id the id of the user whose note is to be updated
	 * @param note the new note
	 * @param conn is the connection to use.
	 * @returns {Promise<void>}
	 */
	static async updateUserNote(id, note, conn) {
		return conn.none(sqlFile('user/update_user_note.sql'), { id: id, note: note });
	}

	/**
	 * Returns a promise to delete a user
	 * @param email the email of the user
	 * @param conn is the connection to use.
	 * @returns {Promise<void>}
	 */
	static deleteUser(email, conn) {
		return conn.none(sqlFile('user/delete_user.sql'), { email: email });
	}

	/**
	 * Returns a promise to insert this user into the database
	 * @param conn is the connection to use.
	 * @returns {Promise.<>}
	 */
	async insert(conn) {
		const user = this;
		if (user.id !== undefined) {
			throw new Error('Attempted to insert a user that already has an ID');
		}
		return await conn.none(sqlFile('user/insert_new_user.sql'), user);
	}

	/**
	 * Returns a promise to create the user_type type.
	 * This needs to be run before User.createTable().
	 * @param conn the connection to use
	 * @returns {Promise<void>}
	 */
	static createUserTypesEnum(conn) {
		return conn.none(sqlFile('user/create_user_types_enum.sql'));
	}
}

/**
 * Enum of roles.
 * This enum needs to be kept in sync with the src/server/sql/create_user_types_enum.sql and the UserRoles enum in src/client/types/items.ts 
 * @enum {string}
 */
User.role = Object.freeze({
	ADMIN: 'admin',
	CSV: 'csv',
	EXPORT: 'export',
	OBVIUS: 'obvius'
});

module.exports = User;
