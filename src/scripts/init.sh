#!/bin/bash
# *
# * This Source Code Form is subject to the terms of the Mozilla Public
# * License, v. 2.0. If a copy of the MPL was not distributed with this
# * file, You can obtain one at http://mozilla.org/MPL/2.0/.
# *

if [ "$1" == "" ]; then 
    echo "You must provide a filename to get meters from, or the word NONE."
    echo "You may also specify a flag --build to build the Webpack-ed application for production."
    exit 1
fi


BUILD=no
if [ "$2" != "--build" ] && [ "$2" != "" ]; then
    echo "Unknown flag $2. The only valid flag is --build."
    exit 1
fi

if [ "$2" == "--build" ]; then
    BUILD=yes
fi

# Install NPM dependencies
echo "NPM install..."
npm install --loglevel=warn --progress=false
echo "NPM install finished."

create_error=0 # Boolean

tries=0 
max_tries=10

# Try to create the schema until it succeeds
while [ $create_error == 0 ]; do
    # Sleep to let PostgreSQL chill out
    sleep 1
    echo "Attempting to create database."
    # Redirect stderr to a file
    npm run createdb |& tee /tmp/oed.error > /dev/null 
    # search the file for the kind of error we can recover from
    grep -q 'Error: connect ECONNREFUSED' /tmp/oed.error 
    create_error=$?

    # Check loop runtime
    ((tries=tries+1))    
    if [ $tries -ge $max_tries ]; then
        echo "FAILED! Too many tries. Is your database at $DB_HOST:$DB_PORT down?"
        exit 1
    fi
done

echo "Schema created or already exists."

# Pull the meters into the DB and get data
if [ $1 != "NONE"  ]; then
    set -e
    echo "Trying to add meters."
    npm run addMamacMeters $1 2> /dev/null
    echo "Trying to update meters."
    npm run updateMamacMeters 2> /dev/null
fi

# Build webpack if needed
if [ $BUILD == "yes" ]; then
    npm run build
fi
