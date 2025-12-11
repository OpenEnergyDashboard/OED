/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');
const sqlFile = database.sqlFile;

class Conversion {
	/**
	 * @param {*} sourceId The unit id of the source.
	 * @param {*} destinationId The unit id of the destination.
	 * @param {*} bidirectional Is this conversion bidirectional?
	 * @param {*} slope The slope of the conversion.
	 * @param {*} intercept The intercept of the conversion.
	 * @param {*} note Comments by the admin or OED inserted.
	 */
	constructor(sourceId, destinationId, bidirectional, slope, intercept, note) {
		this.sourceId = sourceId;
		this.destinationId = destinationId;
		this.bidirectional = bidirectional;
		this.slope = slope;
		this.intercept = intercept;
		this.note = note;
	}

	/**
	 * Returns a promise to create the conversions table.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<>}
	 */
	static createTable(conn) {
		return conn.none(sqlFile('conversion/create_conversions_table.sql'));
	}

	/**
	 * Creates a new conversion from the row's data.
	 * @param {*} row The row from which the conversion will be created.
	 * @returns The new conversion object.
	 */
	static mapRow(row) {
		return new Conversion(row.source_id, row.destination_id, row.bidirectional, row.slope, row.intercept, row.note);
	}

	/**
	 * Get all conversions in the database.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<Array.<Conversion>>}
	 */
	static async getAll(conn) {
		const rows = await conn.any(sqlFile('conversion/get_all.sql'));
		return rows.map(Conversion.mapRow);
	}

	/**
	 * Returns the conversion associated with source and destination. If the conversion doesn't exist then return null.
	 * @param {*} source The source unit id.
	 * @param {*} destination The destination unit id.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<Conversion>}
	 */
	static async getBySourceDestination(source, destination, conn) {
		const row = await conn.oneOrNone(sqlFile('conversion/get_by_source_destination.sql'), {
			source: source,
			destination: destination
		});
		return row === null ? null : Conversion.mapRow(row);
	}

	/**
	 * Inserts a new conversion to the database.
	 * @param {*} conn The connection to use.
	 */
	async insert(conn) {
		const conversion = this;
		await conn.none(sqlFile('conversion/insert_new_conversion.sql'), conversion);
	}

	/**
	 * Updates an existed conversion in the database.
	 * @param {*} conn The connection to use.
	 */
	async update(conn) {
		const conversion = this;
		await conn.none(sqlFile('conversion/update_conversion.sql'), conversion);
	}

	/**
	 * Deletes the conversion associated with source and destination from the database.
	 * @param {*} source The source unit id.
	 * @param {*} destination The destination unit id.
	 * @param {*} conn The connection to use.
	 */
	static async delete(source, destination, conn) {
		await conn.none(sqlFile('conversion/delete_conversion.sql'), {
			source: source,
			destination: destination
		});
	}

	/**
	 * Gets all conversions involving a specific unit (as source or destination).
	 * @param {number} unitId The unit ID to search for
	 * @param {*} conn The connection to use
	 * @returns {Promise.<Array.<Conversion>>} Array of conversions involving the unit
	 */
	static async getConversionsByUnitId(unitId, conn) {
		const rows = await conn.any(`
			SELECT * FROM conversions 
			WHERE source_id = $1 OR destination_id = $1
		`, [unitId]);
		return rows.map(Conversion.mapRow);
	}

	/**
	 * Deletes a conversion and all related suffix units/conversions in a transaction.
	 * Checks for dependencies before deletion and throws error if unit is used in meters/groups.
	 * @param {number} sourceId The source unit ID
	 * @param {number} destinationId The destination unit ID
	 * @param {*} conn The connection to use (should be a transaction)
	 * @returns {Promise.<Object>} Object with deletedUnits and deletedConversions arrays
	 * @throws {Error} If unit has dependencies (meters/groups)
	 */
	static async deleteConversionAndRelatedSuffixes(sourceId, destinationId, conn) {
		const Unit = require('./Unit');
		const { checkUnitDependencies } = require('../services/graph/checkUnitDependencies');
		const { removeAdditionalConversionsAndUnits } = require('../services/graph/handleSuffixUnits');

		const deletedUnits = [];
		const deletedConversions = [];

		// Get source and destination units
		const source = await Unit.getById(sourceId, conn);
		const dest = await Unit.getById(destinationId, conn);

		if (!source || !dest) {
			throw new Error('Source or destination unit not found');
		}

		// Check dependencies for suffix units
		if (source.typeOfUnit === Unit.unitType.SUFFIX) {
			const deps = await checkUnitDependencies(sourceId, conn);
			if (deps.meters.length > 0 || deps.groups.length > 0) {
				const meterNames = deps.meters.map(m => m.name).join(', ');
				const groupNames = deps.groups.map(g => g.name).join(', ');
				throw new Error(`Cannot delete: source unit "${source.name}" is used in ${deps.meters.length} meter(s): ${meterNames} and ${deps.groups.length} group(s): ${groupNames}`);
			}
			await removeAdditionalConversionsAndUnits(source, conn);
		}

		if (dest.typeOfUnit === Unit.unitType.SUFFIX) {
			const deps = await checkUnitDependencies(destinationId, conn);
			if (deps.meters.length > 0 || deps.groups.length > 0) {
				const meterNames = deps.meters.map(m => m.name).join(', ');
				const groupNames = deps.groups.map(g => g.name).join(', ');
				throw new Error(`Cannot delete: destination unit "${dest.name}" is used in ${deps.meters.length} meter(s): ${meterNames} and ${deps.groups.length} group(s): ${groupNames}`);
			}
			await removeAdditionalConversionsAndUnits(dest, conn);
		}

		// Delete the conversion
		await Conversion.delete(sourceId, destinationId, conn);
		deletedConversions.push({ sourceId, destinationId });

		// Handle bidirectional conversion
		const conversion = await Conversion.getBySourceDestination(sourceId, destinationId, conn);
		if (conversion && conversion.bidirectional) {
			const reverseConversion = await Conversion.getBySourceDestination(destinationId, sourceId, conn);
			if (reverseConversion) {
				await Conversion.delete(destinationId, sourceId, conn);
				deletedConversions.push({ sourceId: destinationId, destinationId: sourceId });
			}
		}

		return { deletedUnits, deletedConversions };
	}
}

module.exports = Conversion;
