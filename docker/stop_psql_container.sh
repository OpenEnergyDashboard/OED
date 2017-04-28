#!/bin/sh

# If this script is run in OED/docker, ascend to OED/
directory=${PWD##*/}
if [ $directory == "docker" ]; then
    cd ..
fi

# If this script is not running in OED/, it's not safe.
directory=${PWD##*/}
if [ $directory != "OED" ]; then
    echo "You must run this script in either OED/docker or OED/."
    exit -1
fi

echo "Stopping OED PostgreSQL container."
docker stop oed_database

echo "Removing OED PSQL Docker container."
docker rm oed_database

echo "Removing environment file."
rm -f .env

echo "Done!"
