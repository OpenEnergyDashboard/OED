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
	 * @param {Meter} meter 
	 */
	constructor(meter) {
		const url = new URL(`https://${meter.url}`);
		this.apiUrl = `${url.origin}/api`; // can we add an ending slash??
		this.username = url.searchParams.get('username');
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
	 * @param {number} timeStep time step in seconds.
	 * @param {string} timezoneUse timezone to interpret the readings in since eGauge uses Unix timestamps that depend on the timezone.
	 * @returns {Promise<[[number, moment, moment]]>} a matrix whose rows consists of the reading value and the end timestamp as a moment.
	 */
	async getMeterReadingsBetweenInterval(startTimestamp, endTimestamp, timeStep, timezoneUse) {
		const res = await this.get(`${this.apiUrl}/register/?rate&format=json&time=${startTimestamp}:${timeStep}:${endTimestamp}&reg=${this.registerId}`);
		const data = res.data;
		if(data.error !== undefined){
			// An error can occur if the time range is improper. For example, if the endTimestamp is
			// after the startTimestamp.
			log.error(data.error);
			return [];
		}
		const meterReadings = [];
		const readingType = data.registers[0].type;
		
		for (const dataRange of data.ranges) {
			const readingValues = dataRange.rows;
			// TODO what is the 's' parameter for? I removed it and it still works.
			const endTs = moment.unix(dataRange.ts).tz(timezoneUse);

			const timeDelta = dataRange.delta; // timeStep is in seconds 
			for (let i = 0; i < readingValues.length; i++) {
				// eGauge sends data that is relative to the dataRange.ts where each
				// point is one more timeDelta back in time.
				// Need to create a new moment since these function mutate.
				const startTime = endTs.clone().subtract(timeDelta * (i + 1), 's');
				const endTime = startTime.clone().add(timeDelta, 's');
				// This is the reading value which is an integer.
				let val = parseInt(readingValues[i][0]);
				// if unit is P then we know that the upload data is in W*s so we convert to kWh; otherwise, we don't convert.
				// TODO in the future with units we should use the raw meter value and have it converted when graphing.
				if (readingType === 'P') {
					val = val / (1000 * 3600);
				}
				meterReadings.push([val, startTime, endTime]);
			}
		}

		return meterReadings;
	}

	/**
	 * Fetches the next hour of eGauge data for this.meter.
	 * @returns {Promise<[[number, moment]]>} a matrix whose rows consists of the reading value and the end timestamp as a moment.
	 */
	async getMeterReadings() {
		const lastTimestamp = this.meter.endTimestamp;
		let startTimestamp;
		// The timezone we interpret the readings in.
		const timezoneUse = await meterTimezone(this.meter);
		// Using 'soh' for the endTimestamp allows us to cover the case where
		// we miss a batch(es) of readings, for example if the OED web server goes down.
		// 'soh' will instruct eGauge to respond with all the data from the startTimestamp
		// to the start of the current hour.
		const endTimestamp = 'soh';
		const E0 = moment(0).utc();
		const timeStep = 900;
		// 900 seconds is 15 minutes; which is the default granularity that we will store for eGauge registers.
		// The eGauge meters stored on OED should be also have cumulative set to true.
		// We would have preferred gzip on the pull system, but we will continue with the assumption that transmissions are clean;
		if (E0.format('YYYY-MM-DD HH:mm:ss') === lastTimestamp.format('YYYY-MM-DD HH:mm:ss')) {
			startTimestamp = 'epoch'; // We assume that there is not so much data that crashes OED.
		} else {
			// This takes the date/time in the database, sets its timezone to be the one desired with
			// the same date/time and finally converts it to a unit timestamp.
			startTimestamp = moment(lastTimestamp).tz(timezoneUse, true).unix();
		}
		return this.getMeterReadingsBetweenInterval(startTimestamp, endTimestamp, timeStep, timezoneUse);
	}

	/**
	 * Sets the register id based on the register name.
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
	 * Logouts the jwt.
	 * @post this.jwt and this.request headers are set to undefined.
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
	 * @param {string} url 
	 * @returns 
	 */
	async get(url) {
		return await axios.get(url, {
			headers: this.requestHeaders
		});
	}
}


module.exports = EgaugeRequestor;