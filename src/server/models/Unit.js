/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');
const sqlFile = database.sqlFile;

class Unit {
	/**
	 * @param {*} id This unit's ID.
	 * @param {*} name This unit's name used internally and by the admin.
	 * @param {*} identifier This unit's identifier displayed to the user. 
	 * @param {*} unitType This unit's type. Can be meter or unit.
	 * @param {*} unitIndex The unique number for row/column index in conversion table for this unit.
	 * @param {*} suffix This unit's suffix.
	 * @param {*} displayable Can be none, all, or admin. Restrict the type of user that can see this unit.
	 * @param {*} primary True if this unit is always displayed. If not, the user needs to ask to see (for future enhancement).
	 * @param {*} note Note about this unit.
	 */
	constructor(id, name, identifier, unitType, unitIndex, suffix = "", displayable, primary, note) {
		this.id = id;
		this.name = name;
		this.identifier = identifier;
		this.unitType = unitType;
		this.unitIndex = unitIndex;
		this.suffix = suffix;
		this.displayable = displayable;
		this.primary = primary;
		this.note = note;
	}

	/**
	 * Creates a new unit from the data in a row.
	 * @param {*} row The row from which the unit is to be created.
	 * @returns The new unit object.
	 */
	static mapRow(row) {
		return new Unit(row.id, row.name, row.identifier, row.unitType, row.unitIndex, row.suffix, row.displayable, row.primary, row.note);
	}

	/**
	 * Returns a promise to create the units table.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<>}
	 */
	static createTable(conn) {
		return conn.none(sqlFile('unit/create_units_table.sql'));
	}

	/**
	 * Returns a promise to create the unitType enum.
	 * @param {*} conn The connection to use.
	 * @returns 
	 */
	static createUnitTypesEnum(conn) {
		return conn.none(sqlFile('unit/create_unit_types_enum.sql'));
	}

	/**
	 * Returns a promise to get all displayable units.
	 * @param {*} conn The connection to use. 
	 * @returns {Promise.<Array.<Unit>>}
	 */
	static getDisplayable(conn) {
		const rows = await conn.any(sqlFile('unit/get_displayable_units.sql'));
		return rows.map(Unit.mapRow);
	}

	/**
	 * Returns a promise to get all meter-type units.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<Array.<Unit>>}
	 */
	static getTypeMeter(conn) {
		const rows = await conn.any(sqlFile('unit/get_type_meter.sql'));
		return rows.map(Unit.mapRow(rows));
	}

	/**
	 * Returns a promise to get all unit-type units.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<Array.<Unit>>}
	 */
	static getTypeUnit(conn) {
		const rows = await conn.any(sqlFile('unit/get_type_unit.sql'));
		return rows.map(Unit.mapRow(rows))
	}
}