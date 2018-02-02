#!/bin/bash
# *
# * This Source Code Form is subject to the terms of the Mozilla Public
# * License, v. 2.0. If a copy of the MPL was not distributed with this
# * file, You can obtain one at http://mozilla.org/MPL/2.0/.
# *

USAGE="Usage: init.sh <filename | NONE> [--default-user | --no-user] [--build] [--no-npm-instal]; -u or --default-user creates the default test user, while --no-user creates no new user; -b builds webpack; -n skips npm install"

BUILD=no
DEFAULT_USER=no
SKIP_USER=no
NPM_INSTALL=yes

if [ "$1" == "" ]; then
    echo $USAGE
    exit 1
fi

if [ ! -e "$1" ] && [ "$1" != "NONE" ]; then
    echo "File $1 not found."
    exit 1
fi

IPS_FILE=$1

while [ "$2" != "" ]; do
    case "$2" in
        -b) BUILD=yes;;
        --build) BUILD=yes;;
        -u) DEFAULT_USER=yes;;
        --default-user) DEFAULT_USER=yes;;
        --no-user) SKIP_USER=yes;;
        -n) NPM_INSTALL=no;;
        --no-npm-install) NPM_INSTALL=no;;
        *) echo "Invalid option $2" >&2; echo $USAGE; exit 1;;
    esac
    shift
done

if [ "$SKIP_USER" == yes ] && [ "$DEFAULT_USER" == yes ]; then
    echo "--no-user and --default-user are mutually exclusive."
    exit 1
fi

# Install NPM dependencies
if [ "$NPM_INSTALL" == "yes" ]; then
    echo "NPM install..."
    npm install --loglevel=warn --progress=false
    echo "NPM install finished."
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
    echo "Trying to add meters from '$IPS_FILE'."
    npm run addMamacMeters $IPS_FILE 2> /dev/null
    echo "Trying to update meters."
    npm run updateMamacMeters 2> /dev/null
fi

# Create a user
set -e
if [ "$DEFAULT_USER" == "yes" ]; then
    npm run createUser -- test@example.com password
    echo "Created a user 'test@example.com' with password 'password'."
elif [ "$SKIP_USER" != "yes" ]; then
    npm run createUser
else
    echo "WARNING: No user was created during init.sh run. You may wish to set up a user with the createUser npm script."
fi

# Build webpack if needed
if [ "$BUILD" == "yes" ]; then
    npm run build
fi
