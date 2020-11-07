/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file tests the API for retrieving meters, by artificially
 * inserting meters prior to executing the test code. */

// The test line below does not work if you cannot properly connect
// to the database.
// let { chai, mocha, expect, app, testDB, testUser } = require('../common');
mocha = require('mocha');
chai = require('chai');
const Meter = require('../../models/Meter');
const ini = require('ini');
const fs = require('fs'); 

mocha.describe('Obvius meter config processing', () => {
    mocha.it('should create the right meters based on the config file', () => {
       const configSerialNumber = 'mb-001';
       const configFilePath = `./obvius/${configSerialNumber}.ini`;
       const config = ini.parse(fs.readFileSync(configFilePath, 'utf-8')); 
       const regularExpression = /([0-9][0-9])/;
       // For the metersHash we assume each key corresponds 
       // to a hash of structure { NAME: <alternative name>, UNITS: <units>, LOW:<>, HIGHT:<>, CONSOLE:<> }
       const metersHash = {};
       // Array of Meter (from models) objects
       const metersArray = [];
       for(key in config){
           const [, number, characteristic] = key.split(regularExpression);
           const internalMeterName = `${configSerialNumber}.${parseInt(number)}`
           const meter = metersHash[internalMeterName];
           metersHash[internalMeterName] = {...meter, [characteristic]: config[key]}
       };
       for(internalMeterName in metersHash){
           metersArray.push(new Meter(undefined, internalMeterName, undefined, undefined, undefined, undefined, metersHash[internalMeterName].NAME));
       }
       console.log('', metersHash);
       console.log(metersArray);
    });
});