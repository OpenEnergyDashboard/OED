'use strict';
const database = require('./database');
const db = database.db;
const sqlFile = database.sqlFile;

class User {
    /**
     * @param id This users's ID. Should be undefined if the user is being newly created
     * @param name This user's name
     */
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }

	/**
	 * Returns a promise to create the users table
	 * @returns {Promise.<>}
	 */
	static createTable() {
		return db.none(sqlFile('user/create_users_table.sql'))
	}

	/**
     * Returns a promise to retrieve the user with the given id from the database.
     * @param id
     * @returns {Promise.<User>}
     */
    static getByID(id) {
        return db.one(sqlFile('user/get_user_by_id.sql'), {id: id})
            .then(row => {
                return new User(row['id'], row['name'])
            });
    }

    /**
     * Returns a promise to get all of the user from the database
     * @returns {Promise.<array.<User>>}
     */
    static getAll() {
        return db.any(sqlFile('user/get_all_users.sql'))
            .then(rows => rows.map(row => new User(row['id'], row['name'])));
    }

    /**
     * Returns a promise to insert this user into the database
     * @returns {Promise.<>}
     */
    insert() {
        const user = this;
        return new Promise((resolve, reject) => {
            if (this.id !== undefined) {
                reject(Error("Attempt to insert a user that already has an ID"))
            } else {
                resolve(user)
            }
        }).then((user) => {
            return db.none(sqlFile('user/insert_new_user.sql'), user);
        }).catch((err) => {
            console.log("Error while performing INSERT user query: " + err);
        });
    }
}

module.exports = User;