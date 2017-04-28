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

echo "Building OED PSQL Docker container."
docker build -t oed_postgres ./docker

echo "Starting OED PSQL Docker container."
docker run -d -p 54321:5432 --name oed_database oed_postgres

echo "Copying environment file."
cp docker/docker.env .env

echo "---------------------------"
echo "Good to go! You should run:"
echo "  npm run createdb;           to create the schema"
echo "  npm run addMamacMeters;     to load mamac meters data"
echo "  npm run updateMamacMeters;  to fetch new data for meters in the DB"
echo "  npm run build;              to create Webpack bundle for production"
echo "  npm run dev;                to create Webpack bundle for development"
echo "  npm start;                  to serve the app with Node"
echo "--------------------------"
echo " Once you're done, run docker/stop_psql_container.sh"_
