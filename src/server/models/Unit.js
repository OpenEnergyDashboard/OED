/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');
const sqlFile = database.sqlFile;
const { log } = require('../log');

class Unit {
	/**
	 * @param {*} id This unit's ID.
	 * @param {*} name This unit's name used internally and by the admin.
	 * @param {*} identifier This unit's identifier displayed to the user. 
	 * @param {*} unitRepresent Tells how the data is fetched for readings (only need for meter type unit).
	 * @param {*} secInRate The number of seconds in the unit associated with flow (rate) units.
	 * @param {*} typeOfUnit This unit's type. Can be meter, unit, or suffix.
	 * @param {*} unitIndex The unique number for row/column index in conversion table for this unit.
	 * @param {*} suffix This unit's suffix.
	 * @param {*} displayable Can be none, all, or admin. Restrict the type of user that can see this unit.
	 * @param {*} preferredDisplay True if this unit is always displayed. If not, the user needs to ask to see (for future enhancement).
	 * @param {*} note Note about this unit.
	 */
	constructor(id, name, identifier, unitRepresent, secInRate = 3600, typeOfUnit, unitIndex, suffix = '', displayable, preferredDisplay, note) {
		this.id = id;
		this.name = name;
		this.identifier = identifier;
		this.unitRepresent = unitRepresent;
		this.secInRate = secInRate;
		this.typeOfUnit = typeOfUnit;
		this.unitIndex = unitIndex;
		this.suffix = suffix;
		this.displayable = displayable;
		this.preferredDisplay = preferredDisplay;
		this.note = note;
	}

	/**
	 * Creates a new unit from the data in a row.
	 * @param {*} row The row from which the unit is to be created.
	 * @returns The new unit object.
	 */
	static mapRow(row) {
		return new Unit(row.id, row.name, row.identifier, row.unit_represent, row.sec_in_rate, 
						row.type_of_unit, row.unit_index, row.suffix, row.displayable, row.preferred_display, row.note);
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
	 * Inserts standard units to the database.
	 * @param {*} conn The connection to use.
	 */
	static async insertStandardUnits(conn) {
		// The table contains units' data. 
		// Each row contains: name, identifier, typeOfUnit, suffix, displayable, preferredDisplay.
		const standardUnits = [
			['kWh', 'kWh', Unit.unitType.UNIT, '', Unit.displayableType.ALL, true],
			['MJ', 'MegaJoules', Unit.unitType.UNIT, '', Unit.displayableType.ADMIN, false],
			['BTU', 'BTU', Unit.unitType.UNIT, '', Unit.displayableType.ALL, true],
			['M3_gas', 'cubic meters of gas', Unit.unitType.UNIT, '', Unit.displayableType.ALL, false],
			['kg', 'kg', Unit.unitType.UNIT, '', Unit.displayableType.ALL, false],
			['Metric_ton', 'Metric ton', Unit.unitType.UNIT, '', Unit.displayableType.ALL, false],
			['Fahrenheit', 'Fahrenheit', Unit.unitType.UNIT, '', Unit.displayableType.ALL, false],
			['Celsius', 'Celsius', Unit.unitType.UNIT, '', Unit.displayableType.ALL, false]
		];

		for (let i = 0; i < standardUnits.length; ++i) {
			const unitData = standardUnits[i];
			if (await Unit.getByName(unitData[0], conn) === null) {
				await new Unit(undefined, unitData[0], unitData[1], Unit.unitRepresentType.UNUSED, undefined, 
					unitData[2], null, unitData[3], unitData[4], unitData[5], 'standard unit').insert(conn);
			}
		}
	}

	/**
	 * Returns all units in the database.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<Array.<Unit>>}
	 */
	static async getAll(conn) {
		const rows = await conn.any(sqlFile('unit/get_all.sql'));
		return rows.map(Unit.mapRow);
	}

	/**
	 * Returns all units of meter type that are visible to user.
	 * @param {*} user The user's type.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<Array.<Unit>>}
	 */
	static async getVisibleMeter(user, conn) {
		const rows = await conn.any(sqlFile('unit/get_visible_meter.sql'), { user: user });
		return rows.map(Unit.mapRow);
	}

	/**
	 * Returns all units of unit or suffix type that are visible to user.
	 * @param {*} user The user's type.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<Array.<Unit>>}
	 */
	static async getVisibleUnitOrSuffix(user, conn) {
		const rows = await conn.any(sqlFile('unit/get_visible_unit_or_suffix.sql'), { user: user });
		return rows.map(Unit.mapRow);
	}

	/**
	 * Returns a promise to get all meter-type units.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<Array.<Unit>>}
	 */
	static async getTypeMeter(conn) {
		const rows = await conn.any(sqlFile('unit/get_type_meter.sql'));
		return rows.map(Unit.mapRow);
	}

	/**
	 * Returns a promise to get all unit-type units.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<Array.<Unit>>}
	 */
	static async getTypeUnit(conn) {
		const rows = await conn.any(sqlFile('unit/get_type_unit.sql'));
		return rows.map(Unit.mapRow);
	}
	
	/**
	 * Returns all units that have a suffix.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<Array.<Unit>>}
	 */
	static async getSuffix(conn) {
		const rows = await conn.any(sqlFile('unit/get_suffix.sql'));
		return rows.map(Unit.mapRow);
	}

	/**
	 * Returns the associated unit for the given id.
	 * @param {*} id The id.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<Unit>}
	 */
	static async getById(id, conn) {
		const row = await conn.one(sqlFile('unit/get_by_id.sql'), { id: id });
		return Unit.mapRow(row);
	}

	// TODO: Returns a special value if it doesn't exist
	/**
	 * Returns the associated unit for the given name.
	 * @param {*} name The unit's name.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<Unit>}
	 */
	static async getByName(name, conn) {
		const row = await conn.oneOrNone(sqlFile('unit/get_by_name.sql'), { name: name });
		return row === null ? null : Unit.mapRow(row);
	}

	/**
	 * Returns the associated id of type meter for the given unitIndex.
	 * @param {*} unitIndex The unit's index.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<Int>}
	 */
	static async getByUnitIndexMeter(unitIndex, conn) {
		const resp = await conn.one(sqlFile('unit/get_by_unit_index_meter.sql'), { unitIndex: unitIndex });
		return resp.id;
	}

	// TODO: Returns a special value if it doesn't exist
	/**
	 * Returns the associated id of type unit for the given unitIndex.
	 * @param {*} unitIndex The unit's index.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<Int>}
	 */
	static async getByUnitIndexUnit(unitIndex, conn) {
		const resp = await conn.oneOrNone(sqlFile('unit/get_by_unit_index_unit.sql'), { unitIndex: unitIndex });
		return resp === null ? null : resp.id;
	}

	/**
	 * Returns a promise to update an existing unit in the database.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<>}
	 */
	async update(conn) {
		const unit = this;
		Unit.setIdentifier(unit);
		if (unit.id === undefined) {
			throw new Error('Attempt to update a meter with no ID');
		}
		await conn.none(sqlFile('unit/update_unit.sql'), unit);
	}

	/**
	 * Returns a promise to insert an unit to database.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<>}
	 */
	async insert(conn) {
		const unit = this;
		Unit.setIdentifier(unit);
		if (unit.id !== undefined) {
			throw new Error('Attempt to insert a unit that already has an ID');
		}
		const resp = await conn.one(sqlFile('unit/insert_new_unit.sql'), unit);
		this.id = resp.id;
	}

	static setIdentifier(unit) {
		if (unit.identifier === null || unit.identifier.length === 0) {
			unit.identifier = unit.name;
			log.warn(`Automatically set identifier of the unit "${unit.name}" to "${unit.name}"`);
		}
	}
}

Unit.unitType = Object.freeze({
	UNIT: 'unit',
	METER: 'meter',
	SUFFIX: 'suffix'
});

Unit.displayableType = Object.freeze({
	NONE: 'none',
	ALL: 'all',
	ADMIN: 'admin'
});

Unit.unitRepresentType = Object.freeze({
	QUANTITY: 'quantity',
	FLOW: 'flow',
	RAW: 'raw',
	UNUSED: 'unused'
});

module.exports = Unit;