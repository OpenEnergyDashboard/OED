/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');
const sqlFile = database.sqlFile;

/**
 * Represents the CikVary conversion model for time-varying conversions.
 * Each conversion has a time range (start_time, end_time).
 */
class CikVary {
    /**
     * @param {*} meterUnitId The id of the meter unit.
     * @param {*} nonMeterUnitId The id of the non meter unit.
     * @param {*} startTime The start time of the conversion validity.
     * @param {*} endTime The end time of the conversion validity.
     * @param {*} slope The slope of the conversion.
     * @param {*} intercept The intercept of the conversion.
     */
    constructor(meterUnitId, nonMeterUnitId, startTime, endTime, slope, intercept) {
        this.meterUnitId = meterUnitId;
        this.nonMeterUnitId = nonMeterUnitId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.slope = slope;
        this.intercept = intercept;
    }

    /**
     * Returns a promise to create the cik_vary table.
     * @param {*} conn The connection to use.
     * @returns {Promise}
     */
    static createTable(conn) {
        return conn.none(sqlFile('cik_vary/create_cik_vary_table.sql'));
    }

    /**
     * Create a new CikVary object from row's data.
     * @param {*} row The row from which CikVary will be created.
     * @returns the created CikVary object
     */
    static mapRow(row) {
        return new CikVary(
            row.meter_unit_id || row.source_id,
            row.non_meter_unit_id || row.destination_id,
            row.start_time,
            row.end_time,
            row.slope,
            row.intercept
        );
    }

    /**
     * Get all CikVary objects
     * @param {*} conn The database connection to use.
     * @returns all CikVary objects
     */
    static async getAll(conn) {
        const rows = await conn.any(sqlFile('cik_vary/get_cik_vary.sql'));
        return rows.map(CikVary.mapRow);
    }

    /**
     * Get CikVary conversions valid at a specific time.
     * @param {*} conn The database connection to use.
     * @param {*} sourceId Source unit id.
     * @param {*} destinationId Destination unit id.
     * @param {*} queryTime Timestamp to check validity.
     * @returns Matching CikVary objects
     */
    static async getConversionAtTime(conn, sourceId, destinationId, queryTime) {
        const rows = await conn.any(sqlFile('cik_vary/get_conversion.sql'), {
            sourceId,
            destinationId,
            queryTime
        });
        return rows.map(CikVary.mapRow);
    }

    /**
     * Inserts each element of the array with an actual time-varying conversion into the cik_vary table.
     * The current values in the table are removed first.
     * @param {*} cikVaryArr Array of time-varying conversions.
     * @param {*} conn The database connection to use.
     */
    static async insert(cikVaryArr, conn) {
        // Remove all the current values in the table.
        await conn.none(sqlFile('cik_vary/delete_all_conversions.sql'));

        // Loop over all conversions in array and insert each in DB.
        for (const conversion of cikVaryArr) {
            await conn.none(sqlFile('cik_vary/insert_new_conversion.sql'), {
                sourceId: conversion.source,
                destinationId: conversion.destination,
                startTime: conversion.start_time,
                endTime: conversion.end_time,
                slope: conversion.slope,
                intercept: conversion.intercept
            });
        }
    }
}

module.exports = CikVary;
