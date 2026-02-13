/**
 * This file tests specifically uploadMeters.js. It's used for unit testing, not integration testting
 * and thus, only includes tests for isValidDate(), validateYear(), correctDateTimeFormat(), and isDuplicate().
 */
const { equal } = require('assert');
const { isValidDate, validateYear, correctDateTimeFormat } = require('../../services/csvPipeline/uploadMeters');
const { assert } = require('chai');
const moment = require('moment');

// test for validate year
describe ("test validateYear", function() {
    let currentDate;
    let inMinRange;
    let outMinRange;
    let outMaxRange;
    
    this.beforeEach(() => {
        currentDate = moment().toDate();
        inMinRange = "1920-10-02";
        outMinRange = "0000-11-31";
        outMaxRange = "2031-05-20";
    });

    it("current date check", function() {
        const result = validateYear(currentDate);
        assert.equal(result, true);
    });
    it("1920 check", function() {
        const result = validateYear(inMinRange);
        assert.equal(result, true);
    });
    it("2031 check", function() {
        const result = validateYear(outMaxRange);
        assert.notEqual(result, true);
    });
    it("0000 check", function() {
        const result = validateYear(outMinRange);
        assert.equal(result, false);
    });
});

describe("correctDateTimeFormat test", function() {
    const dateTest1 = "2-10-0000";
    const dateTest2 = "2-1-2026";
    const dateTest3 = "2-10-3000";
    const dateTest4 = "2-10-0001";
    const dateTest5 = "2-10-9999";
    const dateTest6 = moment().format("YYYY-MM-DD"); // test current date
    const dateTest7 = moment().format("MM-DD-YYYY"); // test current date
    
    it("check 0000 -> should be valid", function() {
        const result = correctDateTimeFormat(dateTest1).value;
        assert.equal(result, true);
    });
    it("check valid date", function() {
        const result = correctDateTimeFormat(dateTest2).value;
        assert.equal(result, true);
    });
    it("check future date", function() {
        const result = correctDateTimeFormat(dateTest3).value;
        assert.equal(result, true);
    });
    it("check 0001", function() {
        const result = correctDateTimeFormat(dateTest4).value;
        assert.equal(result, true);
    });
    it("check 9999", function() {
        const result = correctDateTimeFormat(dateTest5).value;
        assert.equal(result, true);
    });
    it("check current date", function() {
        const result = correctDateTimeFormat(dateTest6).value;
        assert.equal(result, true);
    });
});

// test for is valid date
describe ("test isValidDate", function() {
    // before(() => alert("testing started - before all tests"));
    // before(() => alert("testing ended - after all tests"));   
    
    it("Is valid format", function () {
        const result = isValidDate("2-10-1920", "10-1-2025").value; 
        assert.equal(result, true);
    });
    it("Valid out of bounds range", function () {
        const result = isValidDate("2-10-0000", "10-1-2025").value; 
        assert.notEqual(result, true);
    });
    it.only("In bounds range", function () {
        const result = isValidDate("02-10-1800", "10-1-2025").value; 
        assert.equal(result, true);
    });
});