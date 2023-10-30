/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
    This file tests the readings retrieval API for rejections.
    See: https://github.com/OpenEnergyDashboard/DesignDocs/blob/main/testing/testing.md for information.
*/

const { chai, mocha, expect, app } = require('../common');
const { ETERNITY,
    METER_ID,
    GROUP_ID,
    HTTP_CODE } = require('../../util/readingsUtils');

// These tests check the API behavior when improper calls are made, typically with incomplete parameters
// The API should return status code 400 regardless of what is in the database, so no data is loaded in these tests
mocha.describe('rejection tests, test behavior with invalid api calls', () => {
    mocha.describe('for line charts', () => {
        mocha.describe('for meters', () => {
            // A request is required to have both timeInterval and graphicUnitId as parameters
            mocha.it('rejects requests without a timeInterval or graphicUnitId', async () => {
                const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`);
                expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
            });
            mocha.it('reject if request does not have timeInterval', async () => {
                const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
                    .query({ graphicUnitId: 1 });
                expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
            });
            mocha.it('reject if request does not have graphicUnitID', async () => {
                const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
                    .query({ timeInterval: ETERNITY.toString() });
                expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
            });
        });
        mocha.describe('for groups', () => {
            // A request is required to have both timeInterval and graphicUnitId as parameters
            mocha.it('rejects requests without a timeInterval or graphicUnitId', async () => {
                const res = await chai.request(app).get(`/api/unitReadings/line/groups/${GROUP_ID}`);
                expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
            });
            mocha.it('reject if request does not have timeInterval', async () => {
                const res = await chai.request(app).get(`/api/unitReadings/line/groups/${GROUP_ID}`)
                    .query({ graphicUnitId: 1 });
                expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
            });
            mocha.it('reject if request does not have graphicUnitID', async () => {
                const res = await chai.request(app).get(`/api/unitReadings/line/groups/${GROUP_ID}`)
                    .query({ timeInterval: ETERNITY.toString() });
                expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
            });
        });
    });
    mocha.describe('for bar charts', () => {
        // The logic here is effectively the same as the line charts, however bar charts have an added
        // barWidthDays parameter that must me accounted for, which adds a few extra steps
        mocha.describe('for meters', () => {
            mocha.it('rejects requests without a timeInterval or barWidthDays or graphicUnitId', async () => {
                const res = await chai.request(app).get(`/api/unitReadings/bar/meters/${METER_ID}`);
                expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
            });
            mocha.it('rejects requests without a barWidthDays', async () => {
                const res = await chai.request(app).get(`/api/unitReadings/bar/meters/${METER_ID}`)
                    .query({ timeInterval: ETERNITY.toString(), graphicUnitId: 1 });
                expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
            });
            mocha.it('rejects requests without a timeInterval', async () => {
                const res = await chai.request(app).get(`/api/unitReadings/bar/meters/${METER_ID}`)
                    .query({ barWidthDays: 1, graphicUnitId: 1 });
                expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
            });
            mocha.it('reject if request does not have graphicUnitID', async () => {
                const res = await chai.request(app).get(`/api/unitReadings/bar/meters/${METER_ID}`)
                    .query({ timeInterval: ETERNITY.toString(), barWidthDays: 1 });
                expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
            });
        });
        mocha.describe('for groups', () => {
            mocha.it('rejects requests without a timeInterval or barWidthDays or graphicUnitId', async () => {
                const res = await chai.request(app).get(`/api/unitReadings/bar/groups/${GROUP_ID}`);
                expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
            });
            mocha.it('rejects requests without a barWidthDays', async () => {
                const res = await chai.request(app).get(`/api/unitReadings/bar/groups/${GROUP_ID}`)
                    .query({ timeInterval: ETERNITY.toString(), graphicUnitId: 1 });
                expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
            });
            mocha.it('rejects requests without a timeInterval', async () => {
                const res = await chai.request(app).get(`/api/unitReadings/bar/groups/${GROUP_ID}`)
                    .query({ barWidthDays: 1, graphicUnitId: 1 });
                expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
            });
            mocha.it('reject if request does not have graphicUnitID', async () => {
                const res = await chai.request(app).get(`/api/unitReadings/bar/groups/${GROUP_ID}`)
                    .query({ timeInterval: ETERNITY.toString(), barWidthDays: 1 });
                expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
            });
        });
    });
});
