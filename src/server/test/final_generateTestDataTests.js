/*
 * this source code form is subject to the terms of the mozilla public
 * license, v. 2.0. if a copy of the mpl was not distributed with this
 * file, you can obtain one at http://mozilla.org/mpl/2.0/.
 */

/*
 * imports. we use the testing tdd testing framework mocha and the assertion
 * library chai.
 */

const _ = require('lodash');
const chai = require('chai');
const mocha = require('mocha');
const expect = chai.expect;
const moment = require('moment');

const {
    _generateSineData,
    momenting,
    generateDates,
} = require('../data/generateTestData');

mocha.describe('The generateDates function', () => {
    mocha.it('should exist.', () => {
        expect(typeof (generateDates)).to.equal('function');
    });
    mocha.it('should be able to generate dates at different time steps.', () => {
        const startTimeStamp = '2020-10-01 21:00:00';
        const endTimeStamp = '2020-10-02 21:00:00';
        const timeStep = { days: 1 };
        expect(generateDates(startTimeStamp, endTimeStamp, timeStep)).to.deep.equal(
            [startTimeStamp, endTimeStamp]
        );
    });
    mocha.it('should be able to generate dates at a time step 15 seconds', () => {
        const startTimeStamp = '2020-10-01 21:00:00';
        const endTimeStamp = '2020-10-02 21:00:00';
        const timeStep = { hour: 1 };
        const startMoment = moment(startTimeStamp);
        const endMoment = moment(endTimeStamp);
        const result = [];
        while (!startMoment.isAfter(endMoment)) {
            result.push(startMoment.format('YYYY-MM-DD HH:mm:ss'));
            startMoment.add(timeStep);
        }
        expect(generateDates(startTimeStamp, endTimeStamp, timeStep)).to.deep.equal(
            result
        );
    });
});

mocha.describe('momenting', () => {
    mocha.it('should cover the simple singleton case', () => {
        const date = '2019-09-10 00:00:15';
        const period_of_moments = [moment(date)]
        expect([1]).to.deep.equals(momenting(period_of_moments))
    });
    mocha.it('should cover a simple two case', () => {
        const startMoment = moment('2019-09-10 00:00:15');
        const time_step_ms = 15000;
        expect([0, 1]).to.deep.equals(momenting([startMoment, startMoment.clone().add(time_step_ms)], time_step_ms));
    });
    mocha.it('should cover the a skipped datetime', () => {
        const test = ['2019-09-10T00:00:15',
            '2019-09-10T00:00:30', '2019-09-10T00:01:00'];
        const time_step_ms = 15000;
        expect(momenting(test.map(time_stamp => moment(time_stamp)), time_step_ms)).to.deep.equals([0, 1, 1]);
    });
    mocha.it('should work on irregular timesteps', () => {
        const test = ['2019-09-10T00:00:15',
            '2019-09-10T00:00:30', '2019-09-10T00:00:50'];
        const time_step_ms = 15000;
        expect(momenting(test.map(time_stamp => moment(time_stamp)), time_step_ms)).to.deep.equals([0, 1, 5 / 15]);
    });
});

mocha.describe('Generate sinewave helper', () => {
    mocha.it('should exist', () => {
        expect(typeof (_generateSineData)).to.equal('function');
    });
    mocha.it('should be able to generate data for simply one day', () => {
        const startTimeStamp = '2019-09-10 00:00:00';
        const endTimeStamp = '2019-09-11 00:00:00'
        expect(_generateSineData(startTimeStamp, endTimeStamp)).to.deep.equals([[startTimeStamp, 0], [endTimeStamp, 0]]);
    });
    mocha.it('should be able to generate data for half a day', () => {
        const startTimeStamp = '2019-09-10 00:00:00';
        const endTimeStamp = '2019-09-11 00:00:00'
        expect(_generateSineData(startTimeStamp, endTimeStamp, { timeStep: { hour: 12 } })).to.deep.equals([[startTimeStamp, 0], ['2019-09-10 12:00:00', 0], [endTimeStamp, 0]]);
    })
});