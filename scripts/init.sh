#!/bin/bash
# Try to set up the datbase, retrying to work around 

if [ "$1" == "" ]; then 
    echo "You must provide a filename to get meters from, or the word NONE."
    exit 1
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
    echo "Trying to add meters."
    npm run addMamacMeters $1 2> /dev/null
    echo "Trying to update meters."
    npm run updateMamacMeters 2> /dev/null
fi
