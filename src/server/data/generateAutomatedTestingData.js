/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


/** 
 * Each of the following function calls will generate a csv file under '../test/db/data/automatedTests' that is needed for automated testing.
 * Running this file will create all the necessary csv files.
 */


const generateTestingData = require('./automatedTestingData.js');



// Generates 1 year of sinusoidal data with data points at 4-day intervals
generateTestingData.generateFourDayTestingData();

// Generates 1 year of sinusoidal data with data points at 4-hour intervals
generateTestingData.generateFourHourTestingData();

// Generates 1 year of sinusoidal data with data points at 4-day intervals
generateTestingData.generateTwentyThreeMinuteTestingData();

// Generates 1 year of sinusoidal data with data points at 4-day intervals
generateTestingData.generateFifteenMinuteTestingData();

// Generates 1 year of sinusoidal data with data points at 4-day intervals
generateTestingData.generateOneMinuteTestingData();


// Generates 7 files, all containing 2 years of sinusoidal data, and each with a unique amplitude between 1 and 7. More specifically,
// the first file contains sine waves with an amplitude of 1, the second contains waves with an amplitude of 2, and so on until 
// the seventh which contains waves an amplitude of 7.
for(var i = 1; i <= 7; i++) {
	generateTestingData.generateVariableSineTestingData(i);
}


// Generates 2 years of sinusoidal data with an amplitude of 2 and with data points at 15-minute intervals.
generateTestingData.generateVariableSineTestingData(15, 2);

// Generates 2 years of cosinusoidal data with an amplitude of 3 and with data points at 2-minute intervals.
generateTestingData.generateVariableCosineTestingData(23, 3);
