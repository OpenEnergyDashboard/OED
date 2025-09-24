/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
* This class is for testing javascript objects against enum types in the database
* Currently these are stored in both locations, so these tests ensure they are equal
*/
const Meter = require('../../models/Meter');
const User = require('../../models/User');
const Unit = require('../../models/Unit');

//pulls from real database instead of test database,
//since the actual enum values are needed
const Database = require('../../models/database');
const DB = require('../../db');
const { expectArrayOfUnitsToBeEquivalent } = require('../../util/compareUnits');
const { mocha, expect } = require('../common');

mocha.describe('Enums JS to DB', () => {
	//Meter.type JS object to meter_type SQL ENUM
	mocha.it('can equate Meter.type to SQL enum', async () => {
		const conn = DB.getConnection();
		let serverEnum = [];
		let jsObject = [];
		//SQL query returning meter_type ENUM
		await conn.result('SELECT unnest(enum_range(NULL::meter_type));')
			.then(data => {
				//get meter_type enum as nested enumerations
				let resultArray = data.rows;
				//unnest into array for comparison
				resultArray.forEach((item) => {
					serverEnum.push(item.unnest);
				});
				//convert Meter.type JS object properties to array for comparison
				for (let key in Meter.type) {
					if (Meter.type.hasOwnProperty(key)) {
						let value = Meter.type[key];
						jsObject.push(value);
					}
				}
				//sort each array before testing against each other
				serverEnum.sort();
				jsObject.sort();
				expect(serverEnum.toString()).to.equal(jsObject.toString());
			}
			)
	})

	//Unit.displayableType JS object to displayable_type SQL ENUM
	mocha.it('can equate displayableType to SQL enum', async () => {
		const conn = DB.getConnection();
		let serverEnum = [];
		let jsObject = [];
		//SQL query returning displayable_type ENUM
		await conn.result('SELECT unnest(enum_range(NULL::displayable_type));')
			.then(data => {
				//get displayable_type enum as nested enumerations
				let resultArray = data.rows;
				//unnest into array for comparison
				resultArray.forEach((item) => {
					serverEnum.push(item.unnest);
				});
				//convert Unit.displayableType JS object properties to array for comparison
				for (let key in Unit.displayableType) {
					if (Unit.displayableType.hasOwnProperty(key)) {
						let value = Unit.displayableType[key];
						jsObject.push(value);
					}
				}
				//sort each array before testing against each other
				serverEnum.sort();
				jsObject.sort();
				expect(serverEnum.toString()).to.equal(jsObject.toString());
			}
			)
	})

	//User.role JS object to user_type SQL ENUM
	mocha.it('can equate User.role to SQL enum', async () => {
		const conn = DB.getConnection();
		let serverEnum = [];
		let jsObject = [];
		//SQL query returning user_type ENUM
		await conn.result('SELECT unnest(enum_range(NULL::user_type));')
			.then(data => {
				//get user_type enum as nested enumerations
				let resultArray = data.rows;
				//unnest into array for comparison
				resultArray.forEach((item) => {
					serverEnum.push(item.unnest);
				});
				//convert User.role JS object properties to array for comparison
				for (let key in User.role) {
					if (User.role.hasOwnProperty(key)) {
						let value = User.role[key];
						jsObject.push(value);
					}
				}
				//sort each array before testing
				serverEnum.sort();
				jsObject.sort();
				expect(serverEnum.toString()).to.equal(jsObject.toString());
			}
			)
	})

	//Unit.areaUnitType JS object to area_unit_type SQL ENUM
	mocha.it('can equate Unit.areaUnitType to SQL enum', async () => {
		const conn = DB.getConnection();
		let serverEnum = [];
		let jsObject = [];
		//SQL query returning area_unit_type ENUM
		await conn.result('SELECT unnest(enum_range(NULL::area_unit_type));')
			.then(data => {
				//get area_unit_type enum as nested enumerations
				let resultArray = data.rows;
				//unnest into array for comparison
				resultArray.forEach((item) => {
					serverEnum.push(item.unnest);
				});
				//convert Unit.areaUnitType JS object properties to array for comparison
				for (let key in Unit.areaUnitType) {
					if (Unit.areaUnitType.hasOwnProperty(key)) {
						let value = Unit.areaUnitType[key];
						jsObject.push(value);
					}
				}
				//sort each array before testing
				serverEnum.sort();
				jsObject.sort();
				expect(serverEnum.toString()).to.equal(jsObject.toString());
			}
			)
	})

	//Unit.unitType JS object to unit_type SQL ENUM
	mocha.it('can equate Unit.unitType to SQL enum', async () => {
		const conn = DB.getConnection();
		let serverEnum = [];
		let jsEnum = [];
		//SQL query returning unit_type ENUM
		await conn.result('SELECT unnest(enum_range(NULL::unit_type));')
			.then(data => {
				//get unit_type enum as nested enumerations
				let resultArray = data.rows;
				//unnest into array for comparison
				resultArray.forEach((item) => {
					serverEnum.push(item.unnest);
				});
				//convert Unit.unitType JS object properties to array for comparison
				for (let key in Unit.unitType) {
					if (Unit.unitType.hasOwnProperty(key)) {
						let value = Unit.unitType[key];
						jsEnum.push(value);
					}
				}
				//sort each array before testing
				serverEnum.sort();
				jsEnum.sort();
				expect(serverEnum.toString()).to.equal(jsEnum.toString());
			}
			)
	})

	//Unit.disableChecksType JS object to disable_checks_type SQL ENUM
	mocha.it('can equate Unit.disableChecksType to SQL enum', async () => {
		const conn = DB.getConnection();
		let serverEnum = [];
		let jsEnum = [];
		//SQL query returning disable_checks_type ENUM
		await conn.result('SELECT unnest(enum_range(NULL::disable_checks_type));')
			.then(data => {
				//get disable_checks_type enum as nested enumerations
				let resultArray = data.rows;
				//unnest into array for comparison
				resultArray.forEach((item) => {
					serverEnum.push(item.unnest);
				});
				//convert Unit.disableChecksType JS object properties to array for comparison
				for (let key in Unit.disableChecksType) {
					if (Unit.disableChecksType.hasOwnProperty(key)) {
						let value = Unit.disableChecksType[key];
						jsEnum.push(value);
					}
				}
				//sort each array before testing
				serverEnum.sort();
				jsEnum.sort();
				expect(serverEnum.toString()).to.equal(jsEnum.toString());
			}
			)
	})
});
