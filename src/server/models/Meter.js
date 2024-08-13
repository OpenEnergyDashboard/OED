/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const moment = require('moment');
const database = require('./database');
const Reading = require('./Reading');
const Unit = require('./Unit');
const { log } = require('../log');
const sqlFile = database.sqlFile;

class Meter {
	/**
	 * @param id This meter's ID. Should be undefined if the meter is being newly created
	 * @param name This meter's name
	 * @param url This meter's URL Address
	 * @param enabled This meter is being actively read from
	 * @param displayable This meters is available to users for charting
	 * @param type What kind of meter this is
	 * @param meterTimezone Default timezone for meter
	 * @param gps location in format of GIS coordinates
	 * @param identifier Another way to identify a meter
	 * @param note Note about the meter
	 * @param area Area of the meter default 0
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
	 * @param startTimestamp Start timestamp of last reading input for this meter, default '1970-01-01 00:00:00'
	 * @param endTimestamp End timestamp of last reading input for this meter, default'1970-01-01 00:00:00'
	 * @param previousEnd  The last okay reading before crossed out of DST or moment(0) if not, default'1970-01-01 00:00:00'
	 * @param unitId The foreign key to the unit table. The meter receives data and points to this unit in the graph, default -99
	 * @param defaultGraphicUnit The foreign key to the unit table represents the preferred unit to display this meter, default -99
	 * @param areaUnit The meter's area unit, default 'none'
	 * @param readingFrequency The time between readings for this meter with default of '00:15:00' but should not depend on that.
	 * @param minVal inclusive minimum acceptable reading value (won't be rejected)
	 * @param maxVal inclusive maximum acceptable reading value (won't be rejected)
	 * @param minDate inclusive earliest acceptable date (won't be rejected)
	 * @param maxDate inclusive latest acceptable date (won't be rejected)
	 * @param maxError maximum number of errors to be reported, ignore the rest
	 * @param disableChecks disable checks on meter for conditionSet 
	 */
	// The start/end timestamps are the default start/end timestamps that are set to the first
	// day of time in moment. As always, we want to use UTC.
	// The software should stop a meter being created with no reading frequency
	// but just in case this sets it to the default for the database.
	// It would be better to use the admin preferences default but that
	// would be async and not desired.
	// Could also do in insert/update but then there is one floating around
	// with a bad value that may cause issues.
	constructor(id, name, url, enabled, displayable, type, meterTimezone, gps = undefined, identifier = name, note, area = 0,
		cumulative = false, cumulativeReset = false, cumulativeResetStart = '00:00:00', cumulativeResetEnd = '23:59:59.999999',
		readingGap = 0, readingVariation = 0, readingDuplication = 1, timeSort = 'increasing', endOnlyTime = false,
		reading = 0.0, startTimestamp = moment(0).utc().format('YYYY-MM-DD HH:mm:ssZ'), endTimestamp = moment(0).utc().format('YYYY-MM-DD HH:mm:ssZ'),
		previousEnd = moment(0).utc(), unitId = -99, defaultGraphicUnit = -99, areaUnit = Unit.areaUnitType.NONE, readingFrequency = '00:15:00',
		minVal = Number.MIN_SAFE_INTEGER, maxVal = Number.MAX_SAFE_INTEGER, minDate = moment(0).utc().format('YYYY-MM-DD HH:mm:ssZ'),
		maxDate = moment(0).utc().add(5000, 'years').format('YYYY-MM-DD HH:mm:ssZ'), maxError = 75, disableChecks = false) {
		// In order for the CSV pipeline to work, the order of the parameters needs to match the order that the fields are declared.
		// In addition, each new parameter has to be added at the very end.
		this.id = id;
		this.name = name;
		this.url = url;
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
		this.previousEnd = previousEnd;
		this.unitId = unitId;
		this.defaultGraphicUnit = defaultGraphicUnit;
		this.areaUnit = areaUnit;
		this.readingFrequency = readingFrequency;
		this.minVal = minVal;
		this.maxVal = maxVal;
		this.minDate = minDate;
		this.maxDate = maxDate;
		this.maxError = maxError;
		this.disableChecks = disableChecks;
	}

	/**
	 * Returns a promise to create the meters table.
	 * @param conn the connection to use
	 * @returns {Promise.<>}
	 */
	static createTable(conn) {
		return conn.none(sqlFile('meter/create_meters_table.sql'));
	}

	/**
	 * Returns a promise to create the meter_type type.
	 * This needs to be run before Meter.createTable().
	 * @param conn the connection to use
	 * @returns {Promise<void>}
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
		var meter = new Meter(row.id, row.name, row.url, row.enabled, row.displayable, row.meter_type, row.default_timezone_meter,
			row.gps, row.identifier, row.note, row.area, row.cumulative, row.cumulative_reset, row.cumulative_reset_start,
			row.cumulative_reset_end, row.reading_gap, row.reading_variation, row.reading_duplication, row.time_sort,
			row.end_only_time, row.reading, row.start_timestamp, row.end_timestamp, row.previous_end, row.unit_id, row.default_graphic_unit, row.area_unit, row.reading_frequency,
			row.min_val, row.max_val, row.min_date, row.max_date, row.max_error, row.disable_checks);
		meter.unitId = Meter.convertUnitValue(meter.unitId);
		meter.defaultGraphicUnit = Meter.convertUnitValue(meter.defaultGraphicUnit);
		return meter;
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
	 * Returns a promise to retrieve the meter with the given identifier from the database.
	 * @param identifier the meter's identifier
	 * @param conn the connection to be used.
	 * @returns {Promise.<Meter>}
	 */
	static async getByIdentifier(identifier, conn) {
		const row = await conn.one(sqlFile('meter/get_meter_by_identifier.sql'), { identifier: identifier });
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
	 * Returns all meters where unitId is not null.
	 * @param {*} conn The connection to be used.
	 * @returns {Promise.<Array.<Meter>>}
	 */
	static async getUnitNotNull(conn) {
		const rows = await conn.any(sqlFile('meter/get_unit_not_null.sql'));
		return rows.map(Meter.mapRow);
	}

	/**
	 * Returns a promise to insert this meter into the database
	 * @param conn the connection to be used.
	 * @returns {Promise.<>}
	 */
	async insert(conn) {
		Meter.makeMeterDataValid(this);
		const meter = { ...this };
		if (meter.id !== undefined) {
			throw new Error('Attempt to insert a meter that already has an ID');
		}
		meter.unitId = Meter.convertUnitValue(meter.unitId);
		meter.defaultGraphicUnit = Meter.convertUnitValue(meter.defaultGraphicUnit);
		const resp = await conn.one(sqlFile('meter/insert_new_meter.sql'), meter);
		// The ID was set by the DB
		this.id = resp.id;
		// The reading frequency was interpreted by the DB when set so use its value now.
		this.readingFrequency = resp.reading_frequency;
	}

	/**
	 * Updates the meter with values passed if not undefined.
	 * For parameter info see {@link Meter#constructor}.
	 */
	merge(name = this.name, url = this.url, enabled = this.enabled, displayable = this.displayable, type = this.type,
		meterTimezone = this.meterTimezone, gps = this.gps, identifier = this.identifier, note = this.note, area = this.area,
		cumulative = this.cumulative, cumulativeReset = this.cumulativeReset, cumulativeResetStart = this.cumulativeResetStart,
		cumulativeResetEnd = this.cumulativeResetEnd, readingGap = this.readingGap, readingVariation = this.readingVariation,
		readingDuplication = this.readingDuplication, timeSort = this.timeSort, endOnlyTime = this.endOnlyTime,
		reading = this.reading, startTimestamp = this.startTimestamp, endTimestamp = this.endTimestamp,
		previousEnd = this.previousEnd, unitId = this.unitId, defaultGraphicUnit = this.defaultGraphicUnit, areaUnit = this.areaUnit,
		readingFrequency = this.readingFrequency, minVal = this.minVal, maxVal = this.maxVal, minDate = this.minDate,
		maxDate = this.maxDate, maxError = this.maxError, disableChecks = this.disableChecks) {
		this.name = name;
		this.url = url;
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
		this.previousEnd = previousEnd;
		this.unitId = unitId;
		this.defaultGraphicUnit = defaultGraphicUnit;
		this.areaUnit = areaUnit;
		this.readingFrequency = readingFrequency;
		this.minVal = minVal;
		this.maxVal = maxVal;
		this.minDate = minDate;
		this.maxDate = maxDate;
		this.maxError = maxError;
		this.disableChecks = disableChecks;
	}

	/**
	 * Returns a promise to update an existing meter in the database
	 * @param conn the connection to use.
	 * @returns {Promise.<>}
	 */
	async update(conn) {
		Meter.makeMeterDataValid(this);
		const meter = { ...this };
		if (meter.id === undefined) {
			throw new Error('Attempt to update a meter with no ID');
		}
		meter.unitId = Meter.convertUnitValue(meter.unitId);
		meter.defaultGraphicUnit = Meter.convertUnitValue(meter.defaultGraphicUnit);
		// Postgres interprets the readingFrequency and it might not be what was
		// input. Thus, the query returns that value.
		const resp = await conn.one(sqlFile('meter/update_meter.sql'), meter);
		return resp.reading_frequency;
	}

	/**
	 * Returns a promise to get all of the readings for this meter from the database.
	 * @param conn the connection to be used.
	 * @returns {Promise.<Array.<Reading>>}
	 */
	readings(conn) {
		return Reading.getAllByMeterID(this.id, conn);
	}

	/**
	 * Makes the given meter valid.
	 * @param {*} meter The meter.
	 */
	static makeMeterDataValid(meter) {
		if (meter.unitId === -99) {
			// If there is no unitId, set defaultGraphicUnit to -99 and displayable to false.
			if (meter.defaultGraphicUnit !== -99) {
				meter.defaultGraphicUnit = -99;
				log.warn(`defaultGraphicUnit of the meter "${meter.name}" has been removed since there is no unitId.`);
			}
			if (meter.displayable === true) {
				meter.displayable = false;
				log.warn(`displayable of the meter "${meter.name}" has been switched to false since there is no unitId.`);
			}
		}
	}

	/**
	 * Returns null if the unit's id is -99 and vice versa.
	 * This function is used before inserting into the database or after getting data.
	 * @param {*} unit The unit's id.
	 */
	static convertUnitValue(unit) {
		if (unit === -99) {
			// The value of -99 will become null in the database.
			return null
		} else if (unit === null) {
			// The null value in the database will become -99.
			return -99;
		}
		return unit;
	}
}

// The relates to the TS object MeterType for the same use in src/client/app/types/redux/meters.ts.
// They should be kept in sync.
// Enum of meter types
Meter.type = {
	EGAUGE: 'egauge',
	MAMAC: 'mamac',
	METASYS: 'metasys',
	OBVIUS: 'obvius',
	// Other is used when set by OED due to automatic creation and unknown.
	// Can also be used by others when needed.
	OTHER: 'other'
};

module.exports = Meter;
