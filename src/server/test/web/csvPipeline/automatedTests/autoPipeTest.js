/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { chai, mocha, expect, app, testDB, testUser } = require('../../../common');
const Meter = require('../../../../models/Meter');
const Reading = require('../../../../models/Reading');
const zlib = require('zlib');

const fs = require('fs');
const csv = require('csv');
const promisify = require('es6-promisify');

const parseCsv = promisify(csv.parse);

const UPLOAD_METERS_ROUTE = '/api/csv/meters';
const UPLOAD_READINGS_ROUTE = '/api/csv/readings';

const CHAI_READINGS_REQUEST = "chai.request(app).post(UPLOAD_READINGS_ROUTE).field('email', testUser.email).field('password', testUser.password)";
const CHAI_METERS_REQUEST = "chai.request(app).post(UPLOAD_METERS_ROUTE).field('email', testUser.email).field('password', testUser.password)";


const testStrings = {
    pipe1: {
        chaiRequest: [CHAI_READINGS_REQUEST + ".field('createMeter', 'true').field('meterName', 'pipe1').field('gzip', 'false')"],
        fileName: ['pipe1Input.csv'],
        responseCode: [200]
    },
    pipe2: {
        chaiRequest: [CHAI_READINGS_REQUEST + ".field('createMeter', 'true').field('meterName', 'pipe2').field('gzip', 'false')"],
        fileName: ['pipe2Input.csv'],
        responseCode: [200]
    },
    pipe3: {
        chaiRequest: [CHAI_READINGS_REQUEST + ".field('createMeter', 'true').field('meterName', 'pipe3').field('gzip', 'false').field('cumulative', 'true')"],
        fileName: ['pipe3Input.csv'],
        responseCode: [400]
    },
    pipe4: {
        chaiRequest: [CHAI_READINGS_REQUEST + ".field('createMeter', 'true').field('meterName', 'pipe4').field('gzip', 'false').field('cumulative', 'true').field('cumulativeReset','true')"],
        fileName: ['pipe4Input.csv'],
        responseCode: [400]
    },
    pipe5: {
        chaiRequest: [CHAI_READINGS_REQUEST + ".field('createMeter', 'true').field('meterName', 'pipe5').field('gzip', 'false').field('cumulative', 'true').field('cumulativeReset','true').field('cumulativeResetStart','23:45').field('cumulativeResetEnd','00:15')"],
        fileName: ['pipe5Input.csv'],
        responseCode: [400]
    },
    pipe6: {
        chaiRequest: [CHAI_READINGS_REQUEST + ".field('createMeter', 'true').field('meterName', 'pipe6').field('gzip', 'false').field('cumulative', 'true').field('cumulativeReset','true').field('cumulativeResetStart','11:45').field('cumulativeResetEnd','12:15')"],
        fileName: ['pipe6Input.csv'],
        responseCode: [400]
    },
    pipe7: {
        chaiRequest: [CHAI_READINGS_REQUEST + ".field('createMeter', 'true').field('meterName', 'pipe7').field('gzip', 'false').field('cumulative', 'true').field('cumulativeReset','true').field('cumulativeResetStart','00:00').field('cumulativeResetEnd','00:00.001')"],
        fileName: ['pipe7Input.csv'],
        responseCode: [400]
    },
    pipe8: {
        chaiRequest: [CHAI_READINGS_REQUEST + ".field('createMeter', 'true').field('meterName', 'pipe8').field('gzip', 'false').field('cumulative', 'true')"],
        fileName: ['pipe8Input.csv'],
        responseCode: [400]
    },
    // pipe9: {
    //     chaiRequest: [CHAI_READINGS_REQUEST + ".field('createMeter', 'true').field('meterName', 'pipe9').field('gzip', 'false').field('cumulative', 'true').field('cumulativeReset','true')"],
    //     fileName: ['pipe9Input.csv'],
    //     responseCode: [400]
    // },
    // pipe10: {
    //     chaiRequest: [CHAI_READINGS_REQUEST + ".field('createMeter', 'true').field('meterName', 'pipe10').field('gzip', 'false').field('cumulative', 'true').field('cumulativeReset','true')"],
    //     fileName: ['pipe10Input.csv'],
    //     responseCode: [400]
    // },
    // pipe11: {
    //     chaiRequest: [CHAI_READINGS_REQUEST + ".field('cumulative','true').field('cumulativeReset','true').field('cumulativeResetStart','11:45').field('cumulativeResetEnd','12:15').field('meterName','pipe11').field('createMeter','true').field('gzip', 'false')"],
    //     fileName: ['pipe11Input.csv'],
    //     responseCode: [400]
    // },
    // pipe12: {
    //     chaiRequest: [CHAI_READINGS_REQUEST + ".field('cumulative','true').field('cumulativeReset','true').field('cumulativeResetStart','23:45').field('cumulativeResetEnd','00:15').field('createMeter','true').field('gzip', 'false')"],
    //     fileName: ['pipe12Input.csv'],
    //     responseCode: [400]
    // },
    // pipe13: {
    //     chaiRequest: [CHAI_READINGS_REQUEST + ".field('meterName','pipe13').field('createMeter','true').field('gzip', 'false')"],
    //     fileName: ['pipe13Input.csv'],
    //     responseCode: [200]
    // },
    // pipe14: {
    //     chaiRequest: [CHAI_READINGS_REQUEST + ".field('meterName','pipe14').field('lengthVariation','60').field('createMeter','true').field('gzip', 'false')"],
    //     fileName: ['pipe14Input.csv'],
    //     responseCode: [200]
    // },
    // pipe15: {
    //     chaiRequest: [CHAI_READINGS_REQUEST + ".field('meterName','pipe15').field('lengthVariation','120').field('createMeter','true').field('gzip', 'false')"],
    //     fileName: ['pipe15Input.csv'],
    //     responseCode: [200]
    // },
    // pipe16: {
    //     chaiRequest: [CHAI_READINGS_REQUEST + ".field('meterName','pipe16').field('lengthVariation','121').field('createMeter','true').field('gzip', 'false')"],
    //     fileName: ['pipe16Input.csv'],
    //     responseCode: [200]
    // },
    // pipe17: {
    //     chaiRequest: [CHAI_READINGS_REQUEST + ".field('meterName','pipe17').field('lengthGap','60').field('lengthVariation','121').field('createMeter','true').field('gzip', 'false')"],
    //     fileName: ['pipe17Input.csv'],
    //     responseCode: [200]
    // },
    // pipe18: {
    //     chaiRequest: [CHAI_READINGS_REQUEST + ".field('meterName','pipe18').field('lengthGap','120').field('lengthVariation','121').field('createMeter','true').field('gzip', 'false')"],
    //     fileName: ['pipe18Input.csv'],
    //     responseCode: [200]
    // },
    // pipe19: {
    //     chaiRequest: [CHAI_READINGS_REQUEST + ".field('headerRow','true').field('cumulative','true').field('meterName','pipe19').field('createMeter','true').field('gzip', 'false')"],
    //     fileName: ['pipe19Input.csv'],
    //     responseCode: [400]
    // },
    // pipe20: {
    //     chaiRequest: [CHAI_READINGS_REQUEST + ".field('headerRow','true').field('cumulative','true').field('meterName','pipe20').field('createMeter','true')"],
    //     fileName: ['pipe20Input.csv'],
    //     responseCode: [400]
    // },
    // pipe21: {
    //     chaiRequest: CHAI_READINGS_REQUEST + ".field('duplications','3').field('cumulative')"
    // },
    // pipe22: {
    // },
    // pipe23: {
    // },
    // pipe24: {
    // },
    // pipe25: {
    // },
    // pipe40: {
    //     chaiRequest: [CHAI_READINGS_REQUEST + ".field('headerRow','true').field('cumulative','true').field('createMeter','true')"],
    //     fileName: ['pipe40Input.csv.gz'],
    //     responseCode: [400]
    // },
    pipe75: {
        chaiRequest: [CHAI_METERS_REQUEST + ".field('headerRow','true').field('gzip', 'false')", CHAI_READINGS_REQUEST + ".field('meterName','pipe32').field('gzip', 'false')"],
        fileName: ['pipe75AInputMeter.csv', 'pipe75BInput.csv'],
        responseCode: [200, 200]
    }
}

for (let keys in testStrings) {
    mocha.describe(keys, () => {
        let lastStatus;
        const conn = testDB.getConnection();
        for (let index = 0; index < testStrings[keys]['chaiRequest'].length; index++) {
            let inputFile = '/' + testStrings[keys]['fileName'][index];
            let expectedFile = '/' + keys + 'Expected.csv';
            let inputPath = `${__dirname}` + inputFile;
            let expectedPath = `${__dirname}` + expectedFile;
            let inputBuffer = fs.readFileSync(inputPath);
            let expectedBuffer = fs.readFileSync(expectedPath);
            let evalString;
            // Zipped section
            let zippedBuffer = zlib.gzipSync(inputBuffer);
            let isZipped = testStrings[keys]["chaiRequest"][index].search("'gzip', 'false'");
            if (isZipped < 0) {
                evalString = testStrings[keys]["chaiRequest"][index] + ".attach('csvfile', zippedBuffer, `${inputPath}`)";
                //console.log(keys + ' ' + index + 'ZIPPED');
            }
            else {
                evalString = testStrings[keys]["chaiRequest"][index] + ".attach('csvfile', inputBuffer, `${inputPath}`)";
                //console.log(keys + ' ' + index + 'NOT ZIPPED');
            }
            mocha.it(keys + ' ' + index, async () => {
                console.log('DescriptionString');
                const res = await eval(evalString);
                lastStatus = res.status;
                expect(res).to.have.status(testStrings[keys]['responseCode'][index]);
                expect(res).to.be.html;
            });
        }
        // if (res.status == 200 && index == testStrings[keys]['chaiRequest'].length - 1) {
        if (lastStatus == 200) {
            mocha.it('Comparison Test', async () => {
                const meter = await Meter.getByName(keys, conn);
                const readings = await Reading.getAllByMeterID(meter.id, conn);
                const extractedReadings = readings.map(reading => {
                    return [`${reading.reading}`, reading.startTimestamp.format('YYYY-MM-DD HH:mm:ss'), reading.endTimestamp.format('YYYY-MM-DD HH:mm:ss')];
                });
                const fileReadings = await parseCsv(expectedBuffer);
                expect(extractedReadings).to.deep.equals(fileReadings);
            });
        }
        else {
            console.log(lastStatus + ' else');
            //output oed return string
        }
    });
}


