/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
	This file tests the readings retrieval API compare chart meters.
	See: https://github.com/OpenEnergyDashboard/DesignDocs/blob/main/testing/testing.md for information.
*/
const { chai, mocha, app } = require('../common');
const Unit = require('../../models/Unit');
const { prepareTest,
	expectCompareToEqualExpected,
	getUnitId,
	GROUP_ID,
	METER_ID,
	unitDatakWh, 
	conversionDatakWh
 } = require('../../util/readingsUtils');

mocha.describe('readings API', () => {
	mocha.describe('readings test, test if data returned by API is as expected', () => {
		mocha.describe('for compare charts', () => {
			mocha.describe('for groups', () => {
				// Test CG15					
				mocha.it('CG15: 7 day shift end 2022-10-31 17:00:00 for 15 minute reading intervals and flow units & kW as kW ', async () => {
					
                    // unit data
					const unitDatakW = [
                        { 
                            // u4
                            name: 'kW', 
                            identifier: '', 
                            unitRepresent: Unit.unitRepresentType.FLOW, 
                            secInRate: 3600, 
                            typeOfUnit: Unit.unitType.UNIT, 
                            suffix: '', 
                            displayable: Unit.displayableType.ALL, 
                            preferredDisplay: true, 
                            note: 'kilowatts' 
                        },
                        { 
                            // u5
                            name: 'Electric', 
                            identifier: '', 
                            unitRepresent: Unit.unitRepresentType.FLOW, 
                            secInRate: 3600, 
                            typeOfUnit: Unit.unitType.METER, 
                            suffix: '', 
                            displayable: Unit.displayableType.NONE, 
                            preferredDisplay: false, 
                            note: 'special unit' 
                        },
                    ];
                    // conversion data
                    const conversionDatakW = [
                        { 
                            // c4
                            sourceName: 'Electric', 
                            destinationName: 'kW', 
                            bidirectional: false, 
                            slope: 1, 
                            intercept: 0, 
                            note: 'Electric → kW' 
                        }
                    ];
                    // meter groups
                    const meterDatakWGroups = [
                        {
                            name: 'meterDatakW',
                            unit: 'Electric',
                            defaultGraphicUnit: 'kW',
                            displayable: true,
                            gps: undefined,
                            note: 'special meter',
                            file: 'test/web/readingsData/readings_ri_15_days_75.csv',
                            deleteFile: false,
                            readingFrequency: '15 minutes',
                            id: METER_ID
                        },
                        {
                            name: 'meterDatakWOther',
                            unit: 'Electric',
                            defaultGraphicUnit: 'kW',
                            displayable: true, 
                            gps: undefined,
                            note: 'special meter',
                            file: 'test/web/readingsData/readings_ri_20_days_75.csv',
                            deleteFile: false,
                            readingFrequency: '20 minutes',
                            id: (METER_ID + 1)
                        }
                    ];
                    // group data
                    const groupDatakW = [
                        {
                            id: GROUP_ID,
                            name: 'meterDatakW + meterDatakWOther',
                            displayable: true,
                            note: 'special group',
                            defaultGraphicUnit: 'kW',
                            childMeters: ['meterDatakW', 'meterDatakWOther'],
                            childGroups: [], 
                        }
                    ]
                    //load data into database
                    await prepareTest(unitDatakW, conversionDatakW, meterDatakWGroups, groupDatakW);
                    //get unit ID since the DB could use any value.
                    const unitId = await getUnitId('kW');
					const expected = [4008.97545574702, 4182.62793481036];
					//for compare, need the unitID, currentStart, currentEnd, shift
					const res = await chai.request(app).get(`/api/compareReadings/groups/${GROUP_ID}`)
						.query({
							curr_start: '2022-10-30 00:00:00',
							curr_end: '2022-10-31 17:00:00',
							shift: 'P7D',
							graphicUnitId: unitId,
						});
					expectCompareToEqualExpected(res, expected, GROUP_ID);
				});

				mocha.it('CG16: 7 day shift end 2022-10-31 17:00:00 for 15 minute reading intervals and flow units & thing as thing where rate is 36 ', async () => {
					
					const unitData = [
                        { 
                            // u14
                            name: 'Thing_36',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.FLOW,
                            secInRate: 36,
                            typeOfUnit: Unit.unitType.METER,
                            suffix: '',
                            displayable: Unit.displayableType.NONE,
                            preferredDisplay: false,
                            note: 'special unit'
                        },
                        { 
                            // u15
                            name: 'thing unit',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.FLOW,
                            secInRate: 3600,
                            typeOfUnit: Unit.unitType.UNIT,
                            suffix: '',
                            displayable: Unit.displayableType.ALL,
                            preferredDisplay: false,
                            note: 'special unit'
                        },
                    ];
                    const conversionData = [
                        { 
                            // c15
                            sourceName: 'Thing_36',
                            destinationName: 'thing unit',
                            bidirectional: false,
                            slope: 1,
                            intercept: 0,
                            note: 'Thing_36 → thing unit'
                        }
                    ];
                    // meter groups
                    const meterDatakGroups = [
                        {
                            name: 'meterData',
                            unit: 'Thing_36',
                            defaultGraphicUnit: 'thing unit',
                            displayable: true,
                            gps: undefined,
                            note: 'special meter',
                            file: 'test/web/readingsData/readings_ri_15_days_75.csv',
                            deleteFile: false,
                            readingFrequency: '15 minutes',
                            id: METER_ID
                        },
                        {
                            name: 'meterDataOther',
                            unit: 'Thing_36',
                            defaultGraphicUnit: 'thing unit',
                            displayable: true, 
                            gps: undefined,
                            note: 'special meter',
                            file: 'test/web/readingsData/readings_ri_20_days_75.csv',
                            deleteFile: false,
                            readingFrequency: '20 minutes',
                            id: (METER_ID + 1)
                        }
                    ];
                    // group data
                    const groupData = [
                        {
                            id: GROUP_ID,
                            name: 'meterData + meterDataOther',
                            displayable: true,
                            note: 'special group',
                            defaultGraphicUnit: 'thing unit',
                            childMeters: ['meterData', 'meterDataOther'],
                            childGroups: [], 
                        }
                    ]

                    // load data into database
                    await prepareTest(unitData, conversionData, meterDatakGroups, groupData);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('thing unit');
					const expected = [400897.545574702, 418262.793481036];

                    const res = await chai.request(app).get(`/api/compareReadings/groups/${GROUP_ID}`)
						.query({
							curr_start: '2022-10-30 00:00:00',
							curr_end: '2022-10-31 17:00:00',
							shift: 'P7D',
							graphicUnitId: unitId,
						});
					expectCompareToEqualExpected(res, expected, GROUP_ID);
				});
			});
		});
	});
});