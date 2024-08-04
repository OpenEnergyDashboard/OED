/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const axios = require('axios');
const crypto = require('crypto');
const { log } = require('../../log');
const md5 = require('md5');
const moment = require('moment-timezone');
const Meter = require('../Meter');
const { meterTimezone } = require('../../services/meterTimezone');
class EgaugeRequestor {

	/**
	 * Create object for reading an eGauge meter.
	 * @param {Meter} meter associated with the eGauge readings.
	 */
	constructor(meter) {
		// Information expected by the eGauge API and needed by OED.
		const url = new URL(`https://${meter.url}`);
		this.apiUrl = `${url.origin}/api`; // can we add an ending slash??
		// TODO:
		// Allowing for backwards compatibility if previous eGuage meters are using the 'email' parameter instead of
		// the 'username' parameter to login. Developers need to decide in the future if we should deprecate email
		// or continue to allow this backwards compatibility
		const username = url.searchParams.get('username') || url.searchParams.get('email');
		this.username = username;
		this.password = url.searchParams.get('password');
		this.registerName = url.searchParams.get('registerName');
		this.meter = meter;
		this.jwt = undefined;
		this.registerId = undefined;
		this.requestHeaders = undefined;
	}

	/**
	 * Login to the eGauge device via the provided url on the meter.
	 * @post this.jwt is set to a valid jwt obtained from the eGauge device.
	 * @returns jwt
	 */
	async login() {
		// Perform login via digest protocol as documented in eGauge JSON web api.
		const authUrl = `${this.apiUrl}/auth/`;
		const loginUrl = authUrl + 'login';
		let rlm;
		let nnc;
		try {
			await axios.get(authUrl);
			// the request is expected to fail and supply the realm and nnc
		} catch (error) {
			({ rlm, nnc } = (error.response.data));
		}

		const USERNAME = this.username;
		const PASSWORD = this.password;

		// This use of MD5 is specified in the eGauge api.
		const CNONCE = crypto.randomBytes(64).toString('hex');
		const HA1 = md5(`${USERNAME}:${rlm}:${PASSWORD}`);
		const HA2 = md5(`${HA1}:${nnc}:${CNONCE}`);

		const res = await axios.post(loginUrl, {
			'rlm': rlm,
			'usr': USERNAME,
			'nnc': nnc,
			'cnnc': CNONCE,
			'hash': HA2
		});

		const { jwt } = res.data;
		this.jwt = jwt;
		this.requestHeaders = { Authorization: `Bearer ${jwt}` };
		return jwt;
	}

	/**
	 * Fetches eGauge data within a time interval. If the reading unit is detected to be Power (recorded as W*s), we convert it kWh.
	 * @param {number | string} startTimestamp unix start timestamp or 'epoch' which is an eGauge keyword for when the device began gathering data.
	 * @param {number | string} endTimestamp unix end timestamp or 'soh' which is an eGauge keyword for the start of the current hour.
	 * @param {number} timeStep time step between readings in seconds.
	 * @param {string} timezoneUse timezone to interpret the readings in since eGauge uses Unix timestamps that depend on the timezone.
	 * @returns {Promise<[[number, moment, moment]]>} a matrix whose rows consists of the reading value and the end timestamp as a moment.
	 */
	async getMeterReadingsBetweenInterval(startTimestamp, endTimestamp, timeStep, timezoneUse) {
		// Get data from the eGauge device.
		const res = await this.get(`${this.apiUrl}/register/?rate&format=json&time=${startTimestamp}:${timeStep}:${endTimestamp}&reg=${this.registerId}`);
		const data = res.data;
		if (data.error !== undefined) {
			// An error can occur if the time range is improper. For example, if the endTimestamp is
			// after the startTimestamp. In this case no readings are recorded.
			log.error("No data received/stored in getting eGauge readings due to error: " + data.error);
			return [];
		}
		const meterReadings = [];
		// What type of reading data was sent.
		const readingType = data.registers[0].type;

		// Loop over all data received.
		for (const dataRange of data.ranges) {
			// The readings sent.
			const readingValues = dataRange.rows;
			// TODO what is the 's' parameter for? I removed it and it still works.
			const endTs = moment.unix(dataRange.ts).tz(timezoneUse);
			// timeDelta is in seconds which is time between readings.
			const timeDelta = dataRange.delta;
			// Loop over all readings.
			for (let i = 0; i < readingValues.length; i++) {
				// eGauge sends data that is relative to the dataRange.ts where each
				// point is one more timeDelta back in time.
				// Need to create a new moment since these function mutate.
				const startTime = endTs.clone().subtract(timeDelta * (i + 1), 's');
				// The end time is just a shift of the time of each reading in seconds.
				const endTime = startTime.clone().add(timeDelta, 's');
				// This is the reading value which is an integer.
				let val = parseInt(readingValues[i][0]);
				// if unit is P then we know that the upload data is in W*s so we convert to kWh; otherwise, we don't convert.
				// TODO in the future with units we should use the raw meter value and have it converted when graphing. We also need to deal with other unit types.
				if (readingType === 'P') {
					val = val / (1000 * 3600);
				}
				meterReadings.push([val, startTime, endTime]);
			}
		}
		return meterReadings;
	}

	/**
	 * Fetches the next hour of eGauge data for this.meter if fetched the last hour. Otherwise, it fetches
	 * data back to the last time fetched or all time if never fetched before.
	 * @returns {Promise<[[number, moment]]>} a matrix whose rows consists of the reading value and the end timestamp as a moment.
	 */
	async getMeterReadings() {
		// The meter endTimestamp is stored as a string so we need to parse and then convert to UTC.
		const endTimestampTz = moment.parseZone(this.meter.endTimestamp, true);
		// Note this modifies the endTimestampTz object.
		const lastTimestamp = moment.parseZone(endTimestampTz.tz('UTC', true));
		let startTimestamp;
		// The timezone we interpret the readings in.
		const timezoneUse = await meterTimezone(this.meter);
		// Using 'soh' for the endTimestamp allows us to cover the case where
		// we miss a batch(es) of readings, for example if the OED web server goes down.
		// 'soh' will instruct eGauge to respond with all the data from the startTimestamp
		// to the start of the current hour.
		const endTimestamp = 'soh';
		// This is the time stored when a meter is created and means no readings have yet been acquired.
		const E0 = moment(0).utc();
		// 900 seconds is 15 minutes, which is the default granularity that we will store for eGauge registers.
		// TODO We should allow the admin to decide the frequency of readings acquired.
		const timeStep = 900;
		// The eGauge meters stored on OED should be also have cumulative set to true.
		// We would have preferred gzip on the pull system, but we will continue with the assumption that transmissions are clean.
		if (E0.format('YYYY-MM-DD HH:mm:ss') === lastTimestamp.format('YYYY-MM-DD HH:mm:ss')) {
			// We assume that there is not so much data that crashes OED. Thus, we get all the data that the meter has.
			startTimestamp = 'epoch';
		} else {
			// This takes the date/time in the database on the meter, sets its timezone to be the one desired with
			// the same date/time and finally converts it to a unit timestamp. This will be the time to start
			// getting the meter readings.
			startTimestamp = moment(lastTimestamp).tz(timezoneUse, true).unix();
		}
		return this.getMeterReadingsBetweenInterval(startTimestamp, endTimestamp, timeStep, timezoneUse);
	}

	/**
	 * Sets the register id on this instance based on the register name.
	 * The register id cannot be found on the eGauge UI side and so
	 * must be found programmatically.
	 * @post this.registerId is set to the correct register id on the eGauge device.
	 */
	async setRegisterId() {
		const REGISTER_NAME = this.registerName;
		const res = await this.get(`${this.apiUrl}/register/?rate&format=json&time=now`);
		const register = res.data.registers.filter(reg => reg.name === REGISTER_NAME);
		const REGISTER_ID = register[0].idx;
		this.registerId = REGISTER_ID;
	}

	/**
	 * Logout the jwt.
	 * this.jwt and this.request headers are set to undefined.
	 */
	async logout() {
		if (this.jwt !== undefined) {
			await this.get(`${this.apiUrl}/auth/logout`);
			this.jwt = undefined;
			this.requestHeaders = undefined;
		}
	}

	/**
	 * A wrapper for axios.get; includes headers.
	 * @param {string} url for the request.
	 * @returns 
	 */
	async get(url) {
		return await axios.get(url, {
			headers: this.requestHeaders
		});
	}
}


module.exports = EgaugeRequestor;
