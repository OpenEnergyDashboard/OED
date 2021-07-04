/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const moment = require('moment');
const database = require('./database');
const Reading = require('./Reading');

const sqlFile = database.sqlFile;

class Meter {
	/**
	 * @param id This meter's ID. Should be undefined if the meter is being newly created
	 * @param name This meter's name
	 * @param ipAddress This meter's IP Address
	 * @param enabled This meter is being actively read from
	 * @param displayable This meters is available to users for charting
	 * @param type What kind of meter this is
	 * @param meterTimezone Default timezone for meter
	 * @param gps location in format of GIS coordinates
	 * @param identifier Another way to identify a meter
	 * @param note Note about the meter
	 * @param area Area of the meter default null
	 * @param cumulative Identifies if meter readings that are stored are the sum of usage or the particular reading, default false
	 * @param cumulativeReset True if cumulative values can reset back to zero., default false
	 * @param cumulativeResetStart The earliest time of day that a reset can occur, default '00:00:00'
	 * @param cumulativeResetEnd The latest time of day that a reset can occur, default '23:59:59.999999'
	 * @param readingGap Specifies the time range on every reading in the CSV file, default '00:00:00'
	 * @param readingVariation +/- time allowed on length to consider within allowed length, default '23:59:59.999999'
	 * @param readingDuplication number of times each reading is given when 1 means once and is default
	 * @param timeSort 'increasing' if provided readings increase in time (default) & 'decreasing' if other way
	 * @param endOnlyTime true if provided readings only have an end time, false by default
	 * @param reading The value of reading, default 0.0
	 * @param startTimestamp Start timestamp of last reading input for this meter, default '01-01-01 00:00:00'
	 * @param endTimestamp  End timestamp of last reading input for this meter, '01-01-01 00:00:00' 
	 */
	constructor(id, name, ipAddress, enabled, displayable, type, meterTimezone, gps = undefined, identifier = name, note, area,
		cumulative = false, cumulativeReset = false, cumulativeResetStart = '00:00:00', cumulativeResetEnd = '23:59:59.999999',
		readingGap = 0, readingVariation = 0, readingDuplication = 1, timeSort = 'increasing', endOnlyTime = false,
		reading = 0.0, startTimestamp = moment(0), endTimestamp = moment(0)) {
		// In order for the CSV pipeline to work, the order of the parameters needs to match the order that the fields are declared.
		// In addition, each new parameter has to be added at the very end.
		this.id = id;
		this.name = name;
		this.ipAddress = ipAddress;
		this.enabled = enabled;
		this.displayable = displayable;
		this.type = type;
		this.meterTimezone = meterTimezone;
		this.gps = gps;
		this.identifier = identifier;
		this.note = note;
		this.area = area;
		this.cumulative = cumulative;
		this.cumulativeReset = cumulativeReset;
		this.cumulativeResetStart = cumulativeResetStart;
		this.cumulativeResetEnd = cumulativeResetEnd;
		this.readingGap = readingGap;
		this.readingVariation = readingVariation;
		this.readingDuplication = readingDuplication;
		this.timeSort = timeSort;
		this.endOnlyTime = endOnlyTime;
		this.reading = reading;
		this.startTimestamp = startTimestamp;
		this.endTimestamp = endTimestamp;
	}

	/**
	 * Returns a promise to create the meters table.
	 * @param conn the connection to use
	 * @return {Promise.<>}
	 */
	static createTable(conn) {
		return conn.none(sqlFile('meter/create_meters_table.sql'));
	}

	/**
	 * Returns a promise to create the meter_type type.
	 * This needs to be run before Meter.createTable().
	 * @param conn the connection to use
	 * @return {Promise<void>}
	 */
	static createMeterTypesEnum(conn) {
		return conn.none(sqlFile('meter/create_meter_types_enum.sql'));
	}

	/**
	 * Returns a promise to retrieve the meter with the given name from the database.
	 * @param name the meter's name
	 * @param conn the connection to be used.
	 * @returns {Promise.<Meter>}
	 */
	static async getByName(name, conn) {
		const row = await conn.one(sqlFile('meter/get_meter_by_name.sql'), { name: name });
		return Meter.mapRow(row);
	}

	/**
	 * Check if a meter with the same name is already in the database.
	 * @param conn the connection to be used.
	 * @returns {boolean}
	 */
	async existsByName(conn) {
		const row = await conn.oneOrNone(sqlFile('meter/get_meter_by_name.sql'), { name: this.name });
		return row !== null;
	}

	/**
	 * Creates a new meter from the data in a row.
	 * @param row the row from which the meter is to be created
	 * @returns Meter from row
	 */
	static mapRow(row) {
		return new Meter(row.id, row.name, row.ipaddress, row.enabled, row.displayable, row.meter_type,
			row.default_timezone_meter, row.gps, row.identifier, row.note, row.area, row.cumulative, row.cumulative_reset,
			row.cumulative_reset_start, row.cumulative_reset_end, row.reading_gap, row.reading_variation,
			row.reading_duplication, row.time_sort, row.end_only_time,
			row.reading, row.start_timestamp, row.end_timestamp);
	}

	/**
	 * Returns a promise to retrieve the meter with the given id from the database.
	 * @param id the id of the meter to retrieve
	 * @param conn the connection to be used.
	 * @returns {Promise.<Meter>}
	 */
	static async getByID(id, conn) {
		const row = await conn.one(sqlFile('meter/get_meter_by_id.sql'), { id: id });
		return Meter.mapRow(row);
	}

	/**
	 * Returns a promise to get all of the meters from the database
	 * @param conn the connection to be used.
	 * @returns {Promise.<array.<Meter>>}
	 */
	static async getAll(conn) {
		const rows = await conn.any(sqlFile('meter/get_all_meters.sql'));
		return rows.map(Meter.mapRow);
	}

	/**
	 * Returns a promise to get all of the displayable meters from the database
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @returns {Promise.<array.<Meter>>}
	 */
	static async getDisplayable(conn) {
		const rows = await conn.any(sqlFile('meter/get_displayable_meters.sql'));
		return rows.map(Meter.mapRow);
	}

	/**
	 * Returns a promise to get all of the updatable meters from the database
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @returns {Promise.<array.<Meter>>}
	 */
	static async getEnabled(conn) {
		const rows = await conn.any(sqlFile('meter/get_enabled_meters.sql'));
		return rows.map(Meter.mapRow);
	}

	/**
	 * Returns a promise to insert this meter into the database
	 * @param conn the connection to be used.
	 * @returns {Promise.<>}
	 */
	async insert(conn) {
		const meter = this;
		if (meter.id !== undefined) {
			throw new Error('Attempt to insert a meter that already has an ID');
		}
		const resp = await conn.one(sqlFile('meter/insert_new_meter.sql'), meter);
		this.id = resp.id;
	}

	/**
	 * Updates the meter with values passed if not undefined.
	 * For parameter info see {@link Meter#constructor}.
	 */
	merge(name = this.name, ipAddress = this.ipAddress, enabled = this.enabled, displayable = this.displayable, type = this.type,
		meterTimezone = this.meterTimezone, gps = this.gps, identifier = this.identifier, note = this.note, area = this.area,
		cumulative = this.cumulative, cumulativeReset = this.cumulativeReset, cumulativeResetStart = this.cumulativeResetStart,
		cumulativeResetEnd = this.cumulativeResetEnd, readingGap = this.readingGap, readingVariation = this.readingVariation,
		readingDuplication = this.readingDuplication, timeSort = this.timeSort, endOnlyTime = this.endOnlyTime,
		reading = this.reading, startTimestamp = this.startTimestamp, endTimestamp = this.endTimestamp) {

		this.name = name;
		this.ipAddress = ipAddress;
		this.enabled = enabled;
		this.displayable = displayable;
		this.type = type;
		this.meterTimezone = meterTimezone;
		this.gps = gps;
		this.identifier = identifier;
		this.note = note;
		this.area = area;
		this.cumulative = cumulative;
		this.cumulativeReset = cumulativeReset;
		this.cumulativeResetStart = cumulativeResetStart;
		this.cumulativeResetEnd = cumulativeResetEnd;
		this.readingGap = readingGap;
		this.readingVariation = readingVariation;
		this.readingDuplication = readingDuplication;
		this.timeSort = timeSort;
		this.endOnlyTime = endOnlyTime;
		this.reading = reading;
		this.startTimestamp = startTimestamp;
		this.endTimestamp = endTimestamp;
	}

	/**
	 * Returns a promise to update an existing meter in the database
	 * @param conn the connection to use.
	 * @returns {Promise.<>}
	 */
	async update(conn) {
		const meter = this;
		if (meter.id === undefined) {
			throw new Error('Attempt to update a meter with no ID');
		}
		await conn.none(sqlFile('meter/update_meter.sql'), meter);
	}

	/**
	 * Returns a promise to get all of the readings for this meter from the database.
	 * @param conn the connection to be used.
	 * @returns {Promise.<Array.<Reading>>}
	 */
	readings(conn) {
		return Reading.getAllByMeterID(this.id, conn);
	}
}

// Enum of meter types
Meter.type = {
	MAMAC: 'mamac',
	METASYS: 'metasys',
	OBVIUS: 'obvius'
};

module.exports = Meter;
