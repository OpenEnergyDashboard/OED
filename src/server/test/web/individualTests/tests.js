/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
    
 const { chai, mocha, expect, app, testDB, testUser } = require('../common');
 const Meter = require('../../models/Meter');
 const Reading = require('../../models/Reading');
 const zlib = require('zlib');
 
 const fs = require('fs');
 const csv = require('csv');
 const promisify = require('es6-promisify');
const { assert } = require('console');
 
 const parseCsv = promisify(csv.parse);
 
 const UPLOAD_METERS_ROUTE = '/api/csv/meters';
 const UPLOAD_READINGS_ROUTE = '/api/csv/readings';
 
 // File buffers for testing
 const readingsPath = `${__dirname}/csvPipeline/sampleReadings.csv`;
 const readingsBuffer = fs.readFileSync(readingsPath);
 const zippedReadingsBuffer = zlib.gzipSync(readingsBuffer);
 const metersPath = `${__dirname}/csvPipeline/sampleMeters.csv`;
 const metersBuffer = fs.readFileSync(metersPath);
 const zippedMetersBuffer = zlib.gzipSync(metersBuffer);
 const metersPathWithHeader = `${__dirname}/csvPipeline/sampleMetersWithHeader.csv`;
 const metersWithHeaderBuffer = fs.readFileSync(metersPathWithHeader);
 const zippedMetersWithHeaderBuffer = zlib.gzipSync(metersWithHeaderBuffer);

/* Commented out for the time being
 function nextIteration(pipeNumber, input, expected) {
    mocha.it(input[pipeNumber] + ' should equal ' + expected[pipeNumber], async () => {
    var input = input[pipeNumber];
    var expected = expected[pipeNumber];
    assert.equal(input, expected);
    })
 }
*/

/*
function nextTest(input, expected) {
    mocha.it(input + ' should pass ' + expected, async () => {
    // What is it going to compare to? Meter ID needed
    // Run the test | Do the comparison
    // Pipeline creates DB | 
    assert.equal(input, expected);
    })
 }
*/

 mocha.describe('csv inputs and expected outputs', () => {
// TODO: Create a dyamic number for the number of tests
    numTests = 52; 

// TODO: Create a structure for the parameters for each file.
// Could be an arr of key:value pairs
    for (currentPipe = 1; currentPipe <= numTests; currentPipe++) {
        inputName = "pipe" + currentPipe + "Input.csv";
        currentInputFile = `${__dirname}/../csvPipeline/automatedTests/${inputName}`;
        expectedName = "pipe" + currentPipe + "Expected.csv";
        currentExpectedFile = `${__dirname}/../csvPipeline/automatedTests/${inputName}`;

        mocha.describe('testing one input files', () => {
            if (currentPipe <= 35) {
                mocha.it('testing ' + filename, async () => {
                    // Attach files
                    // nextTest(currentInputFile, currentExpectedFile);
                })
            }
        })

        mocha.describe('testing ...', () => {
            if (currentPipe > 35 && currentPipe <= 22) {
                mocha.it('should be able to ...', async () => {
                    // Attach files
                    // nextTest(currentInputFile, currentExpectedFile);
                })
            }
        })

        mocha.describe('testing ...', () => {
        if (currentPipe > 22 && currentPipe <= 40) {
                mocha.it('should be able to ...', async () => {
                    // Attach files
                    // nextTest(currentInputFile, currentExpectedFile);
                })
            }
        })

        mocha.describe('testing ...', () => {
        if (currentPipe > 40 && currentPipe <= 52) {
                mocha.it('should be able to ...', async () => {
                    // Attach files
                    // nextTest(currentInputFile, currentExpectedFile);
                })
            }
        })
    }
 });