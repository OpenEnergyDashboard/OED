/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 const express = require('express');
 const { log } = require('../log');
 const { getConnection } = require('../db');
 const Location = require('../models/Location');
 const { validate } = require('jsonschema');
 const { success, failure } = require('./response');
 
 const router = express.Router();
 
 function formatLocationForResponse(loc) {
     return {
         id: loc.id,
         identifier: loc.identifier,
         gps: loc.gps,
         note: loc.note
     };
 }
 
 // GET all locations
 router.get('/', async (req, res) => {
     const conn = getConnection();
     try {
         const rows = await Location.getAll(conn);
         res.json(rows.map(formatLocationForResponse));
     } catch (err) {
         log.error(`Error while performing GET locations query: ${err}`, err);
         failure(res, 500, 'Error fetching locations');
     }
 });
 
 // POST - Add a new location
 router.post('/addLocation', async (req, res) => {
     const validLocation = {
         type: 'object',
         required: ['identifier'],
         properties: {
             identifier: { type: 'string', minLength: 1 },
             gps: { type: 'string' },
             note: { type: ['string', 'null'] }
         }
     };
 
     const result = validate(req.body, validLocation);
     if (!result.valid) {
         log.warn(`Invalid location data: ${result.errors}`);
         return failure(res, 400, `Invalid location data: ${result.errors}`);
     }
 
     const conn = getConnection();
     try {
         const newLocation = new Location(
             undefined,
             req.body.identifier,
             req.body.gps,
             req.body.note
         );
         await newLocation.insert(conn);
         success(res, 'Location added successfully');
     } catch (err) {
         log.error(`Error inserting location: ${err}`, err);
         failure(res, 500, `Error inserting location: ${err}`);
     }
 });
 
 // POST - Edit an existing location
 router.post('/edit', async (req, res) => {
     const validLocation = {
         type: 'object',
         required: ['id', 'identifier'],
         properties: {
             id: { type: 'integer' },
             identifier: { type: 'string', minLength: 1 },
             gps: { type: 'string' },
             note: { type: ['string', 'null'] }
         }
     };
 
     const result = validate(req.body, validLocation);
     if (!result.valid) {
         log.warn(`Invalid location edit data: ${result.errors}`);
         return failure(res, 400, `Invalid location edit data: ${result.errors}`);
     }
 
     const conn = getConnection();
     try {
         const location = await Location.getById(req.body.id, conn);
         location.identifier = req.body.identifier;
         location.gps = req.body.gps;
         location.note = req.body.note;
         await location.update(conn);
         success(res, 'Location updated successfully');
     } catch (err) {
         log.error('Failed to edit location', err);
         failure(res, 500, 'Failed to edit location: ' + err.toString());
     }
 });
 
 // POST - Delete a location
 router.post('/delete', async (req, res) => {
     const validDelete = {
         type: 'object',
         required: ['id'],
         properties: {
             id: { type: 'integer' }
         }
     };
 
     const result = validate(req.body, validDelete);
     if (!result.valid) {
         log.warn(`Invalid location delete data: ${result.errors}`);
         return failure(res, 400, `Invalid location delete data: ${result.errors}`);
     }
 
     const conn = getConnection();
     try {
         await Location.delete(req.body.id, conn);
         success(res, 'Location deleted successfully');
     } catch (err) {
         log.error(`Error deleting location: ${err}`, err);
         failure(res, 500, `Error deleting location: ${err}`);
     }
 });
 
 module.exports = router;
 