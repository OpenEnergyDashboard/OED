#!/bin/bash
# *
# * This Source Code Form is subject to the terms of the Mozilla Public
# * License, v. 2.0. If a copy of the MPL was not distributed with this
# * file, You can obtain one at http://mozilla.org/MPL/2.0/.
# *

USAGE="Usage: $0 [--production] [--nostart] [--keep_node_modules]"

production=no
dostart=yes
keep_node_modules=no

# Run through all flags and match
while test $# -gt 0; do
	case "$1" in
		--production)
			shift
			production=yes
			;;
		--nostart)
			shift
			dostart=no
			;;
		--keep_node_modules)
			shift
			keep_node_modules=yes
			;;
		*)
			echo $USAGE
			exit 1
	esac
done

# Load .env if it exists

if [ -f ".env" ]; then
	source .env
fi

# Install NPM dependencies
if [ "$keep_node_modules" == "yes" ]; then
	echo "skipping NPM install as requested"
else
	echo "NPM install..."
	npm ci --loglevel=warn
	if [ $? == 0 ]; then
		echo "NPM install finished."
	else
		# npm reported an error. Sometimes it does so can skip steps.
		# Using printf since it is more reliable.
		printf "\n%s\n" "NPM reported an error so stopping"
		exit 2
	fi
fi

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
	# This is not getting a DB connection or if the DB is not yet ready.
    grep -q -e 'Error: connect ECONNREFUSED' -e 'error: the database system is starting up' /tmp/oed.error
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
if [ "$production" == "no" ] && [ ! "$OED_PRODUCTION" == "yes" ]; then
    npm run createUser -- test@example.com password
	echo "Created development user 'test@example.com' with password 'password'"
fi

# Build webpack if needed
if [ "$production" == "yes" ] || [ "$OED_PRODUCTION" == "yes" ]; then
    npm run webpack:build
elif [ "$dostart" == "no" ]; then
	npm run webpack
fi

echo "OED install finished"

# Start OED
if [ "$dostart" == "yes" ]; then
	if [ "$production" == "yes" ] || [ "$OED_PRODUCTION" == "yes" ]; then
		echo "Starting OED in production mode"
		npm run start
	else
		echo "Starting OED in development mode"
		./src/scripts/devstart.sh
	fi
else
	echo "Not starting OED due to --nostart"
fi
