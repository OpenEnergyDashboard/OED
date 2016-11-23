'use strict';
const db = require('./database');

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
     * Returns a promise to retrieve the user with the given id from the database.
     * @param id
     * @returns {Promise.<User>}
     */
    static getByID(id) {
        return db.one("SELECT * FROM users WHERE id=${id}", {id: id})
            .then(row => {
                return new User(row['id'], row['name'])
            });
    }

    /**
     * Returns a promise to get all of the user from the database
     * @returns {Promise.<array.<User>>}
     */
    static getAll() {
        return db.any("SELECT * FROM users")
            .then(rows => rows.map(row => new User(row['id'], row['name'])));
    }

    /**
     * Returns a promise to insert this user into the database
     * @returns {Promise.<>}
     */
    insert() {
        const user = this;
        return new Promise((resolve, reject) => {
            if (this.id != undefined) {
                reject(Error("Attempt to insert a user that already has an ID"))
            } else {
                resolve(user)
            }
        }).then((user) => {
            return db.none("INSERT INTO users(name) VALUES (${name})", user);
        }).catch((err) => {
            console.log("Error while performing INSERT user query: " + err);
        });
    }
}

module.exports = User;