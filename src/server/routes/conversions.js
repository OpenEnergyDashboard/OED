/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const bcrypt = require("bcryptjs");
const express = require("express");
const Conversion = require("../models/Conversion");
const { log } = require("../log");
const validate = require("jsonschema").validate;
const { getConnection } = require("../db");
const { adminAuthMiddleware } = require("./authenticator");
const jwt = require("jsonwebtoken");
const secretToken = require("../config").secretToken;
const { convertUnitValue } = require("../models/Meter");

const router = express.Router();

/**
 * Route for getting all the Conversions in the database
 */

router.get(
	"/",
	adminAuthMiddleware("get all conversions"),
	async (req, res) => {
		const conn = getConnection();
		try {
			const rows = await Conversion.getAll(conn);
			res.json(rows);
		} catch (err) {
			log.error(
				`Error while performing GET all conversions query: ${err}`,
				err
			);
		}
	}
);

/**
 * Route for getting a conversion with source and destination id
 */

router.get(
	"/:sourceId&:destinationId",
	adminAuthMiddleware("get conversion by source and destination id"),
	async (res, req) => {
		const conn = getConnection();
		const validParams = {
			type: "object",
			maxProperties: "2",
			required: ["sourceId", "destinationId"],
		};
	}
);

/**
 * Route for creating a new Conversion
 */
router.post(
	"/create",
	adminAuthMiddleware("create a conversion", async (req, res) => {
		const validParams = {
			type: "object",
			require: [
				"sourceId",
				"destinationId",
				"bidirectional",
				"slope",
				"intercept",
				"note",
			],
			properties: {
				sourcId: {
					type: "number",
				},
				destinationId: {
					type: "number",
				},
				bidirectional: {
					type: "bool",
				},
				slope: {
					type: "number",
				},
				intercept: {
					type: "number",
				},
				note: {
					type: "string",
				},
			},
		};
		if (!validate(req.body, validParams).valid) {
			res.status(400).json({ message: "Invalid params" });
		} else {
			try {
				const conn = getConnection();
				const {
					sourcId,
					destinationId,
					bidirectional,
					slope,
					intercept,
					note,
				} = req.body;
				const convs = new Conversion(
					sourcId,
					destinationId,
					bidirectional,
					slope,
					intercept,
					note
				);
				conv.insert(conn);
				res.sendStatus(200);
			} catch (error) {
				log.error(
					`Error while performing POST request to create Conversion: ${error}`,
					error
				);
				res
					.status(500)
					.json({ message: "Internal Server Error", error: error });
			}
		}
	})
);

/**
 * Route for updating Conversions
 */
router.post(
	"/edit",
	adminAuthMiddleware("updating a conversion"),
	async (req, res) => {
		const validParams = {
			type: "object",
			required: [
				"sourceId",
				"destinationId",
				"bidirectional",
				"slope",
				"intercept",
				"note",
			],
			properties: {
				sourceId: {
					type: "number",
				},
				destinationId: {
					type: "number",
				},
				bidirectional: {
					type: "bool",
				},
				slope: {
					type: "number",
				},
				intercept: {
					type: "number",
				},
				note: {
					type: "string",
				},
			},
		};
		if (!validate(req.body, validParams).valid) {
			res.status(400).json({ message: "Invalid params" });
		} else {
			try {
				const conn = getConnection();
				const conversion = req.body;
				const upConversion = new Conversion(
					conversion.sourceId,
					conversion.destinationId,
					conversion.bidirectional,
					conversion.slope,
					conversion.intercept,
					conversion.note
				);
				upConversion.update(conn);
				res.sendStatus(200);
			} catch (error) {
				log.error("Error while performing edit conversion request");
				res.sendStatus(500);
			}
		}
	}
);
