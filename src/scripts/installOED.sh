#!/bin/bash
# *
# * This Source Code Form is subject to the terms of the Mozilla Public
# * License, v. 2.0. If a copy of the MPL was not distributed with this
# * file, You can obtain one at http://mozilla.org/MPL/2.0/.
# *

USAGE="Usage: install.sh [--production]"

production=no

if [ "$1" == "--production" ]; then
	production=yes
    echo "OED production install"
elif [ "$1" != "" ]; then
	echo $USAGE
	exit 1
else
	echo "OED development install"
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
        echo "FAILED! Too many tries. Is your database at $OED_DB_HOST:$OED_DB_PORT down?"
        exit 1
    fi
done

echo "Schema created or already exists."

# Create a user
set -e
if [ "$production" == "yes" ]; then
	npm run createUser
else
    npm run createUser -- test@example.com password
fi

# Build webpack if needed
if [ "$production" == "yes" ]; then
    npm run webpack:build
else
	npm run webpack
fi

echo "OED install finished"
