#!/bin/bash
# *
# * This Source Code Form is subject to the terms of the Mozilla Public
# * License, v. 2.0. If a copy of the MPL was not distributed with this
# * file, You can obtain one at http://mozilla.org/MPL/2.0/.
# *

echo "This script assumes you have OED running."
echo "This script is normally run for the main OED directory (where package.json is located)"
echo "The OED output will show any errors and some of the activity going on"
echo "It assumes you have already inserted the special unit (npm run insertSpecialUnitsAndConversions)"

# OED main directory (normally this is run from that directory)
oeddir=.
# This is the directory where the test datais located.
testdatadir=$oeddir/src/server/test/web/units/
# This is the OED user that can upload CSV files and used. It is the default admin.
csvuser=test@example.com
# The password for the user
csvpassword='password' 

# Go to directory with test data
cd $oeddir/$testdatadir

# insert the needed meters
curl localhost:3000/api/csv/meters -X POST -F 'headerRow=true' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@metersUnits.csv'

# This needs to happen in Postgres

# Insert meters, units and conversions as needed
# kW with minute flow for unit
insert into units (name, identifier, unit_represent, sec_in_rate, type_of_unit, displayable, preferred_display, note) values ('kW_meter', 'kW_meter_ID', 'flow', 3600, 'meter', 'all', true, 'testUnitData created');
# Since the sec_in_rate is 60 (1 minute), it will increase all values by x 60 when it is displayed as per hour.
insert into units (name, identifier, unit_represent, sec_in_rate, type_of_unit, displayable, preferred_display, note) values ('kW', 'kW ID', 'flow', 60, 'unit', 'all', true, 'testUnitData created');
# Converting from per hour to per minute
insert into conversions (source_id, destination_id, bidirectional, slope, intercept, note) values ((select id from units where name = 'kW_meter'), (select id from units where name = 'kW'), false, 0.016666667, 0, 'testUnitData created');
# Farenheit
insert into units (name, identifier, unit_represent, sec_in_rate, type_of_unit, displayable, preferred_display, note) values ('Fahrenheit_meter', 'Fahrenheit_meter_ID', 'raw', 3600, 'meter', 'all', true, 'testUnitData created');
insert into conversions (source_id, destination_id, bidirectional, slope, intercept, note) values ((select id from units where name = 'Fahrenheit_meter'), (select id from units where name = 'Fahrenheit'), false, 1, 0, 'testUnitData created');

# TODO We want CSV upload of meters to be able to take a unit name and convert to the unit id rather than having to do it in SQL after meter is uploaded.
update meters set unit_id = (select id from units where name = 'Electric_utility'), default_graphic_unit = (select id from units where name = 'kWh') where name = 'testkWh1-5';
update meters set unit_id = (select id from units where name = 'Natural_Gas_BTU'), default_graphic_unit = (select id from units where name = 'MJ') where name = 'testBTU1-5';
update meters set unit_id = (select id from units where name = 'Electric_utility'), default_graphic_unit = (select id from units where name = 'kWh') where name = 'testkWh2-10';
# The readings are 1-5 but x 60 so 60-300 when graphed.
update meters set unit_id = (select id from units where name = 'kW_meter'), default_graphic_unit = (select id from units where name = 'kW') where name = 'testkW60-300';
update meters set unit_id = (select id from units where name = 'kW_meter'), default_graphic_unit = (select id from units where name = 'kW') where name = 'testkW60-300CrossDay';
update meters set unit_id = (select id from units where name = 'Fahrenheit_meter'), default_graphic_unit = (select id from units where name = 'Celsius') where name = 'testF212-111-167-77-212';

# Back in terminal outside Postgres

# Upload the readings into the meters
curl localhost:3000/api/csv/readings -X POST -F 'meterName=testkWh1-5' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAscQuantity.csv'
curl localhost:3000/api/csv/readings -X POST -F 'meterName=testBTU1-5' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAscQuantity.csv'
curl localhost:3000/api/csv/readings -X POST -F 'meterName=testkWh2-10' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAscQuantityX2.csv'
curl localhost:3000/api/csv/readings -X POST -F 'meterName=testkW60-300' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAscRate.csv'
curl localhost:3000/api/csv/readings -X POST -F 'meterName=testkW60-300CrossDay' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAscRateFractions.csv'
curl localhost:3000/api/csv/readings -X POST -F 'meterName=testF212-111-167-77-212' -F 'gzip=false' -F 'email=test@example.com' -F 'password=password' -F 'csvfile=@regAscTemp.csv'

cd $oeddir
# Update the Cik array
node -e 'require("./src/server/services/graph/redoCik.js").redoCikNoConn()'
node -e 'require("./src/server/services/graph/redoCik.js").createPikNoConn()'
#refresh the readings
npm run refreshAllReadingViews

# Go to OED web and create some groups: GF, GkWh1-5,...
# For the first two set the default_graphic_unit so will show up if not unit is chosen
# Back in Postgres terminal
update groups set default_graphic_unit = (select id from units where name = 'Fahrenheit') where name = 'GF';
update groups set default_graphic_unit = (select id from units where name = 'kWh') where name = 'GkWh1-5';

echo -e "\nThe process is now done."
