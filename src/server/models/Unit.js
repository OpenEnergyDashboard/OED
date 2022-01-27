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
	 * @param {*} unitType This unit's type. Can be meter, unit, or suffix.
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
	 * @returns {Promise.<>}
	 */
	static createUnitTypesEnum(conn) {
		return conn.none(sqlFile('unit/create_unit_types_enum.sql'));
	}

	/**
	 * Returns a promise to create the displayableType enum of admin, all, and none.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<>}
	 */
	static createDisplayableTypesEnum(conn) {
		return conn.none(sqlFile('unit/create_displayable_types_enum.sql'));
	}

	/**
	 * Returns a promise to create the unitRepresentType enum of quantity, flow, raw, and unused.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<>}
	 */
	static createUnitRepresentTypesEnum(conn) {
		return conn.none(sqlFile('unit/create_unit_represent_types_enum.sql'));
	}

	/**
	 * Returns all units of unitType of meter that are visible to user.
	 * @param {*} user Can be all or admin.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<Array.<Unit>>}
	 */
	static getVisibleMeter(user, conn) {
		const rows = await conn.any(sqlFile('unit/get_visible_meter.sql'), { user: user });
		return rows.map(Unit.mapRow);
	}

	/**
	 * Returns all units of type of unit or suffix that are visible to user.
	 * @param {*} user Can be all or admin.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<Array.<Unit>>}
	 */
	static getVisibleUnitOrSuffix(user, conn) {
		const rows = await conn.any(sqlFile('unit/get_visible_unit_or_suffix'), { user: user });
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
		return rows.map(Unit.mapRow(rows));
	}
	
	// TODO: Returns a special value if it doesn't exist
	/**
	 * Returns the associated unit for the given id.
	 * @param {*} id The id.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<Unit>}
	 */
	static getById(id, conn) {
		const row = await conn.any(sqlFile('unit/get_by_id.sql'), { id = id });
		return Unit.mapRow(row);
	}

	// TODO: Returns a special value if it doesn't exist
	/**
	 * Returns the associated unit for the given name.
	 * @param {*} name The unit's name.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<Unit>}
	 */
	static getByName(name, conn) {
		const row = await conn(sqlFile('unit/get_by_name.sql'), { name = name });
		return Unit.mapRow(row);
	}

	// TODO: Returns a special value if it doesn't exist
	/**
	 * Returns the associated unit of type meter for the given unitIndex.
	 * @param {*} unitIndex The unit's index.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<Unit>}
	 */
	static getByUnitIndexMeter(unitIndex, conn) {
		const row = await conn(sqlFile('unit/get_by_unit_index_meter.sql'), { unitIndex = unitIndex });
		return Unit.mapRow(row);
	}

	// TODO: Returns a special value if it doesn't exist
	/**
	 * Returns the associated unit of type unit for the given unitIndex.
	 * @param {*} unitIndex The unit's index.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<Unit>}
	 */
	static getByUnitIndexUnit(unitIndex, conn) {
		const row = await conn(sqlFile('unit/get_by_unit_index_unit.sql'), { unitIndex = unitIndex });
		return Unit.mapRow(row);
	}

	/**
	 * Returns all units that have suffix.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<Array.<Unit>>}
	 */
	static getSuffix(conn) {
		const rows = await conn(sqlFile('unit/get_suffix.sql'));
		return Unit.mapRow(rows);
	}

	/**
	 * Returns a promise to update an existing unit in the database.
	 * @param conn The connection to use.
	 * @returns {Promise.<>}
	 */
		 async update(conn) {
			const meter = this;
			if (meter.id === undefined) {
				throw new Error('Attempt to update a meter with no ID');
			}
			await conn.none(sqlFile('meter/update_meter.sql'), meter);
		}
}