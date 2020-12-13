const { mocha, expect } = require('../../common');
const { processMeters, processReadings } = require('../../../models/csvPipeline/processCsv'); // get this file by compiling processCsv.ts
const fs = require('fs').promises; 
const parseCsv = require('csv-parse/lib/sync');

mocha.describe('meters processing function', () => {
	mocha.it('should exist', () => {
	   expect(processMeters).to.be.a('function'); 
	});
	mocha.it('should read from file', async () => {
		const filename = 'sampleMeters.csv';
		const csvHeader = (array) => { // known error: if first data line has a , then it gets ignored 
			const headerLength = 5;
			if (array.length != headerLength){
				throw Error(`ERROR: Header should have length: ${headerLength}, but has length ${array.length}`)
			}
			console.log('header: ',array);
			// return 's';
			return ['name', 'ip_address', 'enabled', 'displayable', 'meter_type'];
		}
		const onRecord = (record, {lines}) => {
			console.log('line: ', lines);
			console.log('record: ', record);
			return record;
		}
		const options = { columns: csvHeader , on_record: onRecord};
		const csvData = await fs.readFile(`${__dirname}/${filename}`); 
		const metersData = (parseCsv( csvData, options));
		expect(processMeters(csvData)).to.deep.equal(metersData);
	});
});

mocha.describe('readings processing function', () => {
	mocha.it('should exist', () => {
	   expect(processReadings).to.be.a('function'); 
	});
	mocha.it('should read from file', async () => {
		const filename = 'sampleReadings.csv';
		const readingsData = await fs.readFile(`${__dirname}/${filename}`); 
		console.log(parseCsv( readingsData ));
	});

});