const ini = require('ini');
const Meter = require('../../models/Meter');
const ConfigFile = require('../../models/obvius/Configfile');

/**
 * Creates meters from a config file 
 * @param {ConfigFile} configFile
 * @returns {Meter[]} an array of Meter objects
 */
function processConfigFile(configFile) {
    const config = ini.parse(configFile.contents);
    const regularExpression = /([0-9][0-9])/;
    // For the metersHash we assume each key corresponds 
    // to a hash of structure { NAME: <alternative name>, UNITS: <units>, LOW:<>, HIGHT:<>, CONSOLE:<> }
    const metersHash = {};
    // Array of Meter (from models) objects
    const metersArray = [];
    for (key in config) {
        const [, number, characteristic] = key.split(regularExpression);
        const internalMeterName = `${configFile.serialId}.${parseInt(number)}`
        const meter = metersHash[internalMeterName];
        metersHash[internalMeterName] = { ...meter, [characteristic]: config[key] }
    };
    for (internalMeterName in metersHash) {
        metersArray.push(new Meter(
            undefined, 
            internalMeterName, 
            undefined, 
            false, 
            false, 
            Meter.type.OBVIUS, 
            metersHash[internalMeterName].NAME));
    }
    return metersArray;
};

module.exports = {
    processConfigFile
};