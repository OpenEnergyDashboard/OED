/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');
const Meter = require('./Meter');
const Unit = require('./Unit');

const sqlFile = database.sqlFile;

class Group {

	/**
	 * @param id should be undefined when creating a new group
	 * @param name group's name
	 * @param displayable The group is available for display
	 * @param gps Location in format of GIS coordinates, default null
	 * @param note Note about the group
	 * @param area Area of the group, default 0
	 * @param defaultGraphicUnit The foreign key to the unit table represents the preferred unit to display this group.
	 * @param areaUnit The area unit, default 'none'
	 */
	constructor(id, name, displayable, gps, note, area = 0, defaultGraphicUnit, areaUnit = Unit.areaUnitType.NONE) {
		this.id = id;
		this.name = name;
		this.displayable = displayable;
		this.gps = gps;
		this.note = note;
		this.area = area;
		this.defaultGraphicUnit = defaultGraphicUnit;
		this.areaUnit = areaUnit;
	}

	/**
	 * Returns a promise to create all the groups tables.
	 * @param conn the database connection to use
	 * @returns {Promise<>}
	 */
	static createTables(conn) {
		return conn.none(sqlFile('group/create_groups_tables.sql'));
	}

	/**
	 * Returns a promise to insert this group into the db
	 * @param conn a function returning the connection to be used, defaults to the default database connection.
	 * @return {Promise.<void>}
	 */
	async insert(conn) {
		// Shallow copies the group object so that the original group's defaultGraphicUnit will not be changed to null.
		const group = { ...this };
		if (group.id !== undefined) {
			throw new Error('Attempt to insert a group that already has an ID');
		}
		// Switches the value of defaultGraphicUnit to null if it's equal to -99.
		if (group.defaultGraphicUnit === -99) {
			group.defaultGraphicUnit = null;
		}
		const resp = await conn.one(sqlFile('group/insert_new_group.sql'), group);
		// resp = { id: 42 }, hence this line
		this.id = resp.id;
	}

	/**
	 * Creates a new group based on the data in a row
	 * @param row the row from which a group is to be created
	 * @returns {Group}
	 */
	static mapRow(row) {
		// Switches the value of defaultGraphicUnit to -99 if it's equal to null.
		var defaultGraphicUnit = row.default_graphic_unit;
		if (defaultGraphicUnit === null) {
			defaultGraphicUnit = -99;
		}
		return new Group(row.id, row.name, row.displayable, row.gps, row.note, row.area, defaultGraphicUnit, row.area_unit);
	}

	/**
	 * Returns a promise to retrieve the meter with the given name.
	 * @param name the groups name
	 * @param conn the connection to be used.
	 * @returns {Promise.<Group>}
	 */
	static async getByName(name, conn) {
		const row = await conn.one(sqlFile('group/get_group_by_name.sql'), { name: name });
		return Group.mapRow(row);
	}

	/**
	 * Check if a group with the same name is already in the database.
	 * @param conn the connection to be used.
	 * @returns {boolean} true if group exists.
	 */
	async existsByName(conn) {
		const row = await conn.oneOrNone(sqlFile('group/get_group_by_name.sql'), { name: this.name });
		return row !== null;
	}

	/**
	 * Returns a promise to retrieve the group with the given id.
	 * @param id the id of the group
	 * @param conn the connection to be used.
	 * @returns {Promise.<*>}
	 */
	static async getByID(id, conn) {
		const row = await conn.one(sqlFile('group/get_group_by_id.sql'), { id: id });
		return Group.mapRow(row);
	}

	/**
	 * returns a promise to retrieve all groups in the database
	 * @param conn the connection to be used.
	 * @returns {Promise.<array.<Group>>}
	 */
	static async getAll(conn) {
		const rows = await conn.any(sqlFile('group/get_all_groups.sql'));
		return rows.map(Group.mapRow);
	}

	/**
	 * Returns a promise to retrive all groups that displayable is equal to true.
	 * @param {*} conn The connection to be used
	 * @returns {Promise.<Array.<Group>>}
	 */
	static async getDisplayable(conn) {
		const rows = await conn.any(sqlFile('group/get_displayable_groups.sql'));
		return rows.map(Group.mapRow);
	}

	/**
	 * Returns a promise to retrieve the IDs of all meters that are immediate children of the group with the given id.
	 * @param id The id of the group whose meters you are desirous of seeing.
	 * @param conn the connection to be used.
	 * @returns {Promise.<*>}
	 */
	static async getImmediateMetersByGroupID(id, conn) {
		const rows = await conn.any(sqlFile('group/get_immediate_meters_by_group_id.sql'), { id: id });
		return rows.map(row => row.meter_id);
	}

	/**
	 * Returns a promise to retrieve the IDs of all the child groups of the group whose id is given.
	 * @param id the id of the group whose children are to be retrieved
	 * @param conn the connection to be used.
	 * @returns {Promise.<*>}
	 */
	static async getImmediateGroupsByGroupID(id, conn) {
		const rows = await conn.any(sqlFile('group/get_immediate_groups_by_group_id.sql'), { id: id });
		return rows.map(row => row.child_id);
	}

	/**
	 * Returns a promise to retrieve the group ID and IDs of all the immediate child meters and groups of all groups.
	 * @param id the id of the group whose children are to be retrieved
	 * @param conn the connection to be used.
	 * @returns {Promise.<*>}
	 */
	static async getImmediateChildren(conn) {
		const rows = await conn.any(sqlFile('group/get_all_children.sql'));
		// Rename the keys from the database ones to the JS ones.
		const newRows = [];
		for (const row of rows) {
			// The database query returns a single item in the array as null if no child exists so remove that
			// to make it an empty array.
			this.purgeNull(row.child_meters);
			this.purgeNull(row.child_groups);
			// Now rename the keys.
			newRows.push({ groupId: row.group_id, childMeters: row.child_meters, childGroups: row.child_groups });
		}
		return newRows;
	}

	/**
	 * Removes first array entry if only one and null
	 * @param {[]} array array to remove null
	 */
	static purgeNull(array) {
		if (array.length === 1 && array[0] === null) {
			// Length 1 and only item null so remove from array.
			array.pop();
		}
	}

	/**
	 * Returns a promise to associate this group with a child group
	 * @param childID ID of the meter to be the child
	 * @param conn the connection to be used.
	 * @return {Promise.<void>}
	 */
	async adoptGroup(childID, conn) {
		// Confirm that such a group exists
		const child = await Group.getByID(childID, conn);
		await conn.none(sqlFile('group/associate_child_group_with_parent_group.sql'), { parent_id: this.id, child_id: child.id });
	}

	/**
	 * Returns a promise to make the meter with the given ID an immediate child of this group.
	 * @param childID
	 * @param conn the connection to be used.
	 * @return {Promise.<void>}
	 */
	async adoptMeter(childID, conn) {
		const meter = await Meter.getByID(childID, conn);
		await conn.none(sqlFile('group/associate_child_meter_with_parent_group.sql'), { group_id: this.id, meter_id: meter.id });
	}

	/**
	 *  Returns a promise to retrieve all the IDs of the deep child groups of the group with the given ID.
	 * @param id
	 * @param conn the connection to be used.
	 * @return {Promise.<void>}
	 */
	static async getDeepGroupsByGroupID(id, conn) {
		const rows = await conn.any(sqlFile('group/get_deep_groups_by_group_id.sql'), { id });
		return rows.map(row => row.child_id);
	}

	/**
	 * Returns a promise to retrieve all the IDs of deep child meters of the group with the given ID.
	 * @param id
	 * @param conn the connection to be used.
	 * @return {Promise.<void>}
	 */
	static async getDeepMetersByGroupID(id, conn) {
		const rows = await conn.any(sqlFile('group/get_deep_meters_by_group_id.sql'), { id });
		return rows.map(row => row.meter_id);
	}

	/**
	 * Returns a promise to update an existing group in the database
	 * @param conn the connection to use.
	 * @returns {Promise.<>}
	 */
	async update(conn) {
		// Shallow copies the group object so that the original group's defaultGraphicUnit will not be changed to null.
		const group = { ...this };
		if (group.id === undefined) {
			throw new Error('Attempt to update a group with no ID');
		}
		// Switches the value of defaultGraphicUnit to null if it's equal to -99.
		if (group.defaultGraphicUnit === -99) {
			group.defaultGraphicUnit = null;
		}
		await conn.none(sqlFile('group/update_group.sql'), group);
	}

	/**
	 * Returns a promise to remove the group with childID from the children of this group.
	 * @param childID The child group to be disowned
	 * @param conn the connection to be used.
	 * @return {Promise.<void>}
	 */
	async disownGroup(childID, conn) {
		await conn.none(sqlFile('group/disown_child_group.sql'), { parent_id: this.id, child_id: childID });
	}

	/**
	 * Returns a promise to remove the group with childID from the children of this group.
	 * @param childID The child group to be disowned
	 * @param conn the connection to be used.
	 * @return {Promise.<void>}
	 */
	async disownMeter(meterID, conn) {
		await conn.none(sqlFile('group/disown_child_meter.sql'), { parent_id: this.id, meter_id: meterID });
	}

	/**
	 * Returns a promise to retrieve an array of the group IDs of the parent groups of this group
	 * @param conn the connection to be used.
	 * @return {Promise<IArrayExt<any>>}
	 */
	async getParents(conn) {
		const rows = await conn.any(sqlFile('group/get_parents_by_group_id.sql'), { child_id: this.id });
		return rows.map(row => row.parent_id);
	}

	/**
	 * Returns a promise to retrieve an array of the group IDs of the parent groups of a group.
	 * @param groupID the group's id that we need to find its parents.
	 * @param conn the connection to be used.
	 * @return {Promise<IArrayExt<any>>}
	 */
	static async getParentsByGroupID(groupID, conn) {
		const rows = await conn.any(sqlFile('group/get_parents_by_group_id.sql'), { child_id: groupID });
		return rows.map(row => row.parent_id);
	}

	/**
	 * Returns a promise to delete a group and purge all trace of it form the memories of its parents and children
	 * @param groupID The ID of the group to be deleted
	 * @param conn the connection to be used.
	 * @return {Promise.<void>}
	 */
	static async delete(groupID, conn) {
		await conn.none(sqlFile('group/delete_group.sql'), { id: groupID });
	}
}
module.exports = Group;
