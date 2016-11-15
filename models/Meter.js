'use strict';
const db = require('./database');
const Reading = require('./Reading');

class Meter {
    /**
     * @param id This meter's ID. Should be undefined if the meter is being newly created
     * @param name This meter's name
     * @param ipAddress This meter's IP Address
     */
    constructor(id, name, ipAddress) {
        this.id = id;
        this.name = name;
        this.ipAddress = ipAddress;
    }

    static getByName(name) {
        return db.one("SELECT id, name, ipaddress FROM meters WHERE name=${name}", {name: name})
            .then(row => {
                return new Meter(row['id'], row['name'], row['ipaddress'])
            })
    }

    static getAll() {
	    return db.any("SELECT * FROM meters")
		    .then(rows => rows.map(row => new Meter(row['id'], row['name'], row['ipaddress'])))
    }

    insert() {
	    let meter = this;
	    return new Promise((resolve, reject) => {
		    if (this.id != undefined) {
			    reject(Error("Attempt to insert a meter that already has an ID"))
		    } else {
			    resolve(meter)
		    }
	    }).then(meter => {
		    return db.none("INSERT INTO meters(name, ipaddress) VALUES (${name}, ${ipAddress})", meter);
	    })
    }

    readings() {
	    return Reading.getAllByMeterID(this.id)
    }
}

module.exports = Meter;