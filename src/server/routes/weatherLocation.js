/* This Source Code Form is subject to the terms of the Mozilla Public
  * License, v. 2.0. If a copy of the MPL was not distributed with this
  * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { log } = require('../log');
const { getConnection } = require('../db');
const WeatherLocation = require('../models/WeatherLocation');
const moment = require('moment');
const Reading = require('../models/Reading');
const validate = require('jsonschema').validate;
const Point = require('../models/Point');
const { success, failure } = require('./response');

const router = express.Router();

function formatWeatherLocationForResponse(item) {
    return {
        id: item.id,
        identifier: item.identifier,
        gps: item.gps,
        note: item.note
    };
}

/**
 * Route for getting all weather locations.
 */
router.get('/', async (req, res) => {
    const conn = getConnection();
    try {
        const rows = await WeatherLocation.getAll(conn);
        res.json(rows.map(formatWeatherLocationForResponse));
    } catch (err) {
        log.error(`Error while performing GET weather location details query: ${err}`, err);
    }
});

// This checks params for both edit and create. In principle they could differ since not all needed for create
// but they are the same due to current routing for now.
function validateWeatherLocationParams(params) {
    const validParams = {
        type: 'object',
        required: ['identifier', 'gps'],
        properties: {
            // Removed id from properties list since it is set to undefined no matter what is passed.
            identifier: {
                type: 'string',
                minLength: 1
            },
            gps: {
                oneOf: [
                    {
                        type: 'object',
                        required: ['latitude', 'longitude'],
                        properties: {
                            latitude: { type: 'number', minimum: '-90', maximum: '90' },
                            longitude: { type: 'number', minimum: '-180', maximum: '180' }
                        }
                    },
                    { type: 'null' }
                ]
            },
            note: {
                oneOf: [
                    { type: 'string' },
                    { type: 'null' }
                ]
            }
        }
    }
    const paramsValidationResult = validate(params, validParams);
    return { valid: paramsValidationResult.valid, errors: paramsValidationResult.errors };
}

/**
 * Route for POST add weather location.
 */
router.post('/addWeatherLocation', async (req, res) => {
    const response = validateWeatherLocationParams(req.body);
    if (!response.valid) {
        log.warn(`Got request to edit a weather location with invalid weather data, errors: ${response.errors}`);
        failure(res, 400, 'validation failed with ' + response.errors.toString());
    } else {
        const conn = getConnection();
        try {
            const newLocation = new WeatherLocation(
                undefined, // id
                req.body.identifier,
                req.body.gps ? new Point(req.body.gps.longitude, req.body.gps.latitude) : null,
                req.body.note
            );
            await newLocation.insert(conn);
            res.json(formatWeatherLocationForResponse(newLocation));

            //   const earliestMoment = await Reading.getEarliestTimeStamp(conn);

            //   const earliestDate = earliestMoment.format('YYYY-MM-DD');
            //   const latestDate = moment().subtract(3, 'days').format('YYYY-MM-DD');

            //   const weatherData = fetchWeatherData(newLocation.latitude, newLocation.longitude, earliestDate, latestDate);

            //   // Assuming weatherData is an array of {time, temperature}
            //   for (const data of weatherData) {
            //     const newData = new WeatherData({
            //         weather_location_id: newLocation.id,  // Assuming this ID is returned or accessible after insertion
            //         start_time: data.time,
            //         end_time: latestDate,  // Assuming end_time is the 3 days ago (this might need to be changed)
            //         temperature: data.temperature
            //     });
            //     await newData.insert(t);
            // }

        } catch (err) {
            log.error(`Error while inserting new weather location ${err}`, err);
            failure(res, 500, `Error while inserting new weather location ${err}`);
        }
    }
});

/**
 * Route for POST, delete unit.
 */
router.post('/delete', async (req, res) => {
    const validParams = {
        type: 'object',
        maxProperties: 1,
        required: ['id'],
        properties: {
            id: { type: 'integer' }
        }
    };

    // Ensure delete request is valid
    const validatorResult = validate(req.body, validParams);
    if (!validatorResult.valid) {
        const errorMsg = `Got request to delete a weather location with invalid data, error(s):  ${validatorResult.errors}`;
        log.warn(errorMsg);
        failure(res, 400, errorMsg);
    } else {
        const conn = getConnection();
        try {
            // Don't worry about checking if the weather location already exists
            // Just try to delete it to save the extra database call, since the database will return an error anyway if the row does not exist
            await WeatherLocation.delete(req.body.id, conn);
        } catch (err) {
            const errorMsg = `Error while deleting conversion with error(s): ${err}`;
            log.error(errorMsg);
            failure(res, 500, errorMsg);
        }
        success(res, 'Successfully deleted conversion');
    }
});

/**
* Route for POST, edit location.
*/
router.post('/edit', async (req, res) => {
    const validLocation = {
        type: 'object',
        required: ['id', 'identifier'],
        properties: {
            id: {
                type: 'integer'
            },
            identifier: {
                type: 'string'
            },
            gps: {
                oneOf: [
                    {
                        type: 'object',
                        required: ['latitude', 'longitude'],
                        properties: {
                            latitude: { type: 'number', minimum: '-90', maximum: '90' },
                            longitude: { type: 'number', minimum: '-180', maximum: '180' }
                        }
                    },
                    { type: 'null' }
                ]
            },
            note: {
                type: 'string',

            }
        }
    };

    const validatorResult = validate(req.body, validLocation);
    if (!validatorResult.valid) {
        log.warn(`Got request to edit location with invalid data, errors:${validatorResult.errors}`);
        failure(res, 400, `Got request to edit location with invalid data, errors:${validatorResult.errors}`);
    } else {
        const conn = getConnection();
        try {
            const location = await WeatherLocation.getByID(req.body.id, conn);
            const newGPS = (req.body.gps) ? new Point(req.body.gps.longitude, req.body.gps.latitude) : null;
            location.identifier = req.body.identifier;
            location.gps = newGPS,
            location.note = req.body.note;
            await location.update(conn);
        } catch (err) {
            log.error('Failed to edit location', err);
            failure(res, 500, 'Unable to edit location ' + err.toString());
        }
        success(res, `Successfully edited location`);
    }
});

module.exports = router;
