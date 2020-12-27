import * as parseCsv from 'csv-parse/lib/sync';
// csv shape after parsing rows? and types and column names

// parse meters
// id,name,ipaddress,enabled,displayable,meter_type // maybe store this elsewhere? or 
function processMeters(metersData: string) {
    const getCsvHeader = (csvHeader: string[]) => { // known error: if first data line has a , then it gets ignored 
        const expectedHeaderLength = 5;
        if (csvHeader.length != expectedHeaderLength) { // check header is the right length
            throw Error(`ERROR: Header should have length: ${expectedHeaderLength}, but has length ${csvHeader.length}`)
        }
        
        return ['name', 'ip_address', 'enabled', 'displayable', 'meter_type'];
    }
    const options = { columns: getCsvHeader };
    const meters: object[] = parseCsv(metersData, options);
    return meters;
}


// parse readings
// meter_id,reading,start_timestamp,end_timestamp
// we need a stage where we try to locate the meter_id from the given unique
// meter name; should displayed meter names be unique? sure for now
function processReadings() {

}

// set column headers

export = {
    processMeters,
    processReadings
}