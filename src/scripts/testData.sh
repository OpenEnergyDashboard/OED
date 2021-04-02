#!/bin/bash
# *
# * This Source Code Form is subject to the terms of the Mozilla Public
# * License, v. 2.0. If a copy of the MPL was not distributed with this
# * file, You can obtain one at http://mozilla.org/MPL/2.0/.
# *

# This script assumes you have OED running.

# OED main directory (normally this is run from that directory)
oeddir=.
# This is where the postgres directory is for OED.
postgresdir="$oeddir/postgres-data"

# Go to OED directory
cd $oeddir

# The following lines can be used to remove all the readings and meter associated with
# the test data. This is valuable if you want to run the process again and the
# meters and readings already exist. At this time it is not working in the script
# so have to do on the command line.
# NOTE this removes the meters and readings. You may need to remove dependent groups
# before doing this.
# docker-compose exec database psql -U oed
# > delete from readings where meter_id between 300 and 313;
# > delete from meters where id between 300 and 313;
# > q

# Generate the standard sample data.
# Various time lengths & the sin^, cos^2
docker-compose run --rm web npm run generateTestingData
# Sin at various amplitudes
docker-compose run --rm web npm run generateVariableAmplitudeTestingData

# 
# Edit the readings files to add the meter id
# This will not be necessary once we use curl to get the files in
sed -i "" -e "s/^[0-9]/300,&/" src/server/test/db/data/automatedTests/fourDayFreqTestData.csv
sed -i "" -e "s/^[0-9]/301,&/" src/server/test/db/data/automatedTests/fourHourFreqTestData.csv
sed -i "" -e "s/^[0-9]/302,&/" src/server/test/db/data/automatedTests/twentyThreeMinuteFreqTestData.csv
sed -i "" -e "s/^[0-9]/303,&/" src/server/test/db/data/automatedTests/fifteenMinuteFreqTestData.csv
sed -i "" -e "s/^[0-9]/304,&/" src/server/test/db/data/automatedTests/23FreqCosineTestData.csv
sed -i "" -e "s/^[0-9]/305,&/" src/server/test/db/data/automatedTests/2.5AmpSineSquaredTestData.csv
sed -i "" -e "s/^[0-9]/306,&/" src/server/test/db/data/automatedTests/2.5AmpCosineSquaredTestData.csv
sed -i "" -e "s/^[0-9]/307,&/" src/server/test/db/data/automatedTests/15Freq1AmpSineTestData.csv
sed -i "" -e "s/^[0-9]/308,&/" src/server/test/db/data/automatedTests/15Freq2AmpSineTestData.csv
sed -i "" -e "s/^[0-9]/309,&/" src/server/test/db/data/automatedTests/15Freq3AmpSineTestData.csv
sed -i "" -e "s/^[0-9]/310,&/" src/server/test/db/data/automatedTests/15Freq4AmpSineTestData.csv
sed -i "" -e "s/^[0-9]/311,&/" src/server/test/db/data/automatedTests/15Freq5AmpSineTestData.csv
sed -i "" -e "s/^[0-9]/312,&/" src/server/test/db/data/automatedTests/15Freq6AmpSineTestData.csv
sed -i "" -e "s/^[0-9]/313,&/" src/server/test/db/data/automatedTests/15Freq7AmpSineTestData.csv

# Create needed meters.
# This will probably not be necesary once can use curl to get the files in
# CSV with meter info
cat > $postgresdir/testMeters.csv << EOF
id,name,ipaddress,enabled,displayable,meter_type,default_timezone_meter,gps,identifier
300,test4DaySin,123.45.6.0,FALSE,TRUE,mamac,,,test4DaySin
301,test4HourSin,123.45.6.0,FALSE,TRUE,mamac,,,test4HourSin
302,test23MinSin,123.45.6.0,FALSE,TRUE,mamac,,,test23MinSin
303,test15MinSin,123.45.6.0,FALSE,TRUE,mamac,,,test15MinSin
304,test23MinCos,123.45.6.0,FALSE,TRUE,mamac,,,test23MinCos
305,testSqSin,123.45.6.0,FALSE,TRUE,mamac,,,testSqSin
306,testSqCos,123.45.6.0,FALSE,TRUE,mamac,,,testSqCos
307,testAmp1Sin,123.45.6.0,FALSE,TRUE,mamac,,,testAmp1Sin
308,testAmp2Sin,123.45.6.0,FALSE,TRUE,mamac,,,testAmp2Sin
309,testAmp3Sin,123.45.6.0,FALSE,TRUE,mamac,,,testAmp3Sin
310,testAmp4Sin,123.45.6.0,FALSE,TRUE,mamac,,,testAmp4Sin
311,testAmp5Sin,123.45.6.0,FALSE,TRUE,mamac,,,testAmp5Sin
312,testAmp6Sin,123.45.6.0,FALSE,TRUE,mamac,,,testAmp6Sin
313,testAmp7Sin,123.45.6.0,FALSE,TRUE,mamac,,,testAmp7Sin
EOF
# Put meters into OED
docker-compose exec database psql -U oed  -c "copy meters from 'testMeters.csv' CSV HEADER"

# Move generated csv files to Postgres directory
# This will not be necessary once can use curl to get the files in
mv src/server/test/db/data/automatedTests/fourDayFreqTestData.csv $postgresdir
mv src/server/test/db/data/automatedTests/fourHourFreqTestData.csv $postgresdir
mv src/server/test/db/data/automatedTests/twentyThreeMinuteFreqTestData.csv $postgresdir
mv src/server/test/db/data/automatedTests/fifteenMinuteFreqTestData.csv $postgresdir
mv src/server/test/db/data/automatedTests/23FreqCosineTestData.csv $postgresdir
mv src/server/test/db/data/automatedTests/2.5AmpSineSquaredTestData.csv $postgresdir
mv src/server/test/db/data/automatedTests/2.5AmpCosineSquaredTestData.csv $postgresdir
mv src/server/test/db/data/automatedTests/15Freq1AmpSineTestData.csv $postgresdir
mv src/server/test/db/data/automatedTests/15Freq2AmpSineTestData.csv $postgresdir
mv src/server/test/db/data/automatedTests/15Freq3AmpSineTestData.csv $postgresdir
mv src/server/test/db/data/automatedTests/15Freq4AmpSineTestData.csv $postgresdir
mv src/server/test/db/data/automatedTests/15Freq5AmpSineTestData.csv $postgresdir
mv src/server/test/db/data/automatedTests/15Freq6AmpSineTestData.csv $postgresdir
mv src/server/test/db/data/automatedTests/15Freq7AmpSineTestData.csv $postgresdir
# Put readings into OED.
# This will become curl later.
docker-compose exec database psql -U oed  -c "copy readings from 'fourDayFreqTestData.csv' CSV HEADER"
docker-compose exec database psql -U oed  -c "copy readings from 'fourHourFreqTestData.csv' CSV HEADER"
docker-compose exec database psql -U oed  -c "copy readings from 'twentyThreeMinuteFreqTestData.csv' CSV HEADER"
docker-compose exec database psql -U oed  -c "copy readings from 'fifteenMinuteFreqTestData.csv' CSV HEADER"
docker-compose exec database psql -U oed  -c "copy readings from '23FreqCosineTestData.csv' CSV HEADER"
docker-compose exec database psql -U oed  -c "copy readings from '2.5AmpSineSquaredTestData.csv' CSV HEADER"
docker-compose exec database psql -U oed  -c "copy readings from '2.5AmpCosineSquaredTestData.csv' CSV HEADER"
docker-compose exec database psql -U oed  -c "copy readings from '15Freq1AmpSineTestData.csv' CSV HEADER"
docker-compose exec database psql -U oed  -c "copy readings from '15Freq2AmpSineTestData.csv' CSV HEADER"
docker-compose exec database psql -U oed  -c "copy readings from '15Freq3AmpSineTestData.csv' CSV HEADER"
docker-compose exec database psql -U oed  -c "copy readings from '15Freq4AmpSineTestData.csv' CSV HEADER"
docker-compose exec database psql -U oed  -c "copy readings from '15Freq5AmpSineTestData.csv' CSV HEADER"
docker-compose exec database psql -U oed  -c "copy readings from '15Freq6AmpSineTestData.csv' CSV HEADER"
docker-compose exec database psql -U oed  -c "copy readings from '15Freq7AmpSineTestData.csv' CSV HEADER"

# refresh the readings so can see in OED
docker-compose exec web npm run refreshReadingViews

# Remove the data files now that in OED.
# Will be different place once use curl.
rm $postgresdir/testMeters.csv
rm $postgresdir/fourDayFreqTestData.csv
rm $postgresdir/fourHourFreqTestData.csv
rm $postgresdir/twentyThreeMinuteFreqTestData.csv
rm $postgresdir/fifteenMinuteFreqTestData.csv
rm $postgresdir/23FreqCosineTestData.csv
rm $postgresdir/2.5AmpSineSquaredTestData.csv
rm $postgresdir/2.5AmpCosineSquaredTestData.csv
rm $postgresdir/15Freq1AmpSineTestData.csv
rm $postgresdir/15Freq2AmpSineTestData.csv
rm $postgresdir/15Freq3AmpSineTestData.csv
rm $postgresdir/15Freq4AmpSineTestData.csv
rm $postgresdir/15Freq5AmpSineTestData.csv
rm $postgresdir/15Freq6AmpSineTestData.csv
rm $postgresdir/15Freq7AmpSineTestData.csv
