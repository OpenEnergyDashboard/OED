/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file tests the API for retrieving units, by artificially
 * inserting units prior to executing the test code. */

const { chai, mocha, expect, app, testDB, testUser } = require('../common');
const Unit = require('../../models/Unit');
const { expectUnitToBeEquivalent, expectArrayOfUnitsToBeEquivalent } = require('../../util/compareUnits');

mocha.describe("Units routes", () => {
    mocha.it('returns nothing with no units present', async () => {
        const res = await chai.request(app).get('/api/units');
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.have.lengthOf(0);
    });

    mocha.it('returns one visible unit', async () => {
        const conn = testDB.getConnection();
        const expected = new Unit(undefined, 'kwh', 'kWh', Unit.unitRepresentType.QUANTITY, undefined, Unit.unitType.UNIT, null, '', Unit.displayableType.ALL, true, "standard unit");
        await expected.insert(conn);
        const res = await chai.request(app).get('/api/units');
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.have.lengthOf(1);
        expectUnitToBeEquivalent(expected, res.body[0]);
    });

    mocha.it('returns all visible units', async () => {
        const conn = testDB.getConnection();
        // Code similar to src/server/data/automatedTestingData.js
        // Define the values of the units
        const units =
            [
                ['kWh', 'kWh', Unit.unitRepresentType.QUANTITY, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true],
                ['MJ', 'MegaJoules', Unit.unitRepresentType.QUANTITY, Unit.unitType.UNIT, '', Unit.displayableType.ADMIN, false],
                ['BTU', 'BTU', Unit.unitRepresentType.QUANTITY, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true],
                ['M3_gas', 'cubic meters of gas', Unit.unitRepresentType.QUANTITY, Unit.unitType.UNIT, '', Unit.displayableType.ALL, false],
                ['kg', 'kg', Unit.unitRepresentType.QUANTITY, Unit.unitType.METER, '', Unit.displayableType.NONE, false],
                ['Metric_ton', 'Metric ton', Unit.unitRepresentType.FLOW, Unit.unitType.UNIT, '', Unit.displayableType.ALL, false],
                ['Fahrenheit', 'Fahrenheit', Unit.unitRepresentType.RAW, Unit.unitType.UNIT, '', Unit.displayableType.ALL, false],
                ['Celsius', 'Celsius', Unit.unitRepresentType.RAW, Unit.unitType.UNIT, '', Unit.displayableType.ALL, false]
            ];
        // Create and insert units
        const expectedUnits = [];
        for (let i = 0; i < units.length; ++i) {
            const unitData = units[i];
            const aUnit = new Unit(undefined, unitData[0], unitData[1], unitData[2], undefined,
                unitData[3], null, unitData[4], unitData[5], unitData[6], 'test unit' + i);
            expectedUnits.push(aUnit);
            await aUnit.insert(conn);
        }

        const res = await chai.request(app).get('/api/units');
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.have.lengthOf(8);
        expectArrayOfUnitsToBeEquivalent(expectedUnits, res.body);
    });
});
