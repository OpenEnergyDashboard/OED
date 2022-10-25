# Postgres Database Migration

## Problem

OED uses PostgreSQL running in a Docker container for its database. However, the current version of PostgreSQL used is 10.13 which is several major versions behind the latest version, 14.5. (Note, since the time of writing this Postgres 15 has been released) The goal is to migrate the database up to the current version.

## Requirements

* The migration should migrate the database over all the major versions, up to the current one.
* The migration should transfer all of the existing data in the database. Testing will need to be done to ensure that the migration does not break anything in the database.
* There are multiple users running OED that may not have much technical knowledge, so the migration steps should be as simple as possible. Ideally, it would be a script that the user can run. However, if this is not possible, a detailed guide should be written going over the necessary steps and commands that the user needs to run.

## Potential Solutions

There are two potential solutions that I have found for migrating a PostgreSQL across major versions.

PostgreSQL has documentation for a function called pg_upgrade which "allows data stored in PostgreSQL data files to be upgraded to a later PostgreSQL major version without the data dump/restore typically required for major version upgrades"

https://www.postgresql.org/docs/current/pgupgrade.html

Another option is to do a dump and restore as mentioned in the pg_upgrade documentation. Since the database is in a Docker container, this process seems to be easier than using pg_upgrade.

https://www.cloudytuts.com/tutorials/docker/how-to-upgrade-postgresql-in-docker-and-kubernetes/

Comparing the two methods, the second one seems to be simpler and more likely to be turned into a script if it works. If a guide needs to be written, it has fewer steps and is easier to understand. I spoke with Steve about this method and he thinks that it should work. If it doesn't, when the first method will have to be used.

## Overview of Second Method

The second method consists of three main steps according to the article:
* Performing a pq_dumpall of the database
* Creating a new database Docker container with the PostgreSQL version set to the target version
* Using psql to put the dumpfile into the new database

Notes: 
* For the first step, could potentially use just pg_dump instead of pg_dumpall.
* For the third step, if using pg_dump, might have to use pg_restore instead of psql
* Also for the third step, when creating the database container, OED puts data into it. Not sure if psql or pg_restore will overwrite the data or need to set a flag

## Testing the Method

First, I attempted to follow the steps as they were written in the article. OED has a guide for upgrading versions of OED. In this guide, there is a command for performing a pg_dump. I took the command and changed it to pg_dumpall to fit with the article: docker compose exec database pg_dumpall -U oed > dump_$(date +%Y-%m-%d"_"%H_%M_%S.sql). The command only seemed to work if OED was open in a container, but it produced the .sql file containing the dump.

Next was bringing up the database container with the new PostgreSQL version. According to Steve, the way to change the version should be to change the FROM line in the Docker file under containers/database. Currently there is an issue with restarting OED where the containers need to be removed before OED starts properly, so I changed the version to 14.5, closed the remote connection, removed the containers, and started OED back up again. However, when the script tried to create the database, it ran into an error: Error: getaddrinfo EAI_AGAIN database. This error seems to happen if it can't connect to the database. I have found one solution to get around this error, which is to delete the postgres-data folder. This is probably not the correct solution, but I wanted tot get to the third step to see if I could restore the database. After deleting the postgres-data folder and restarting OED, everything seemed to start up correctly except when creating the database, it seemed to run into multiple Error while inserting log mail Error: connect ECONNREFUSED 172.18.0.2:5432 (Error: connect ECONNREFUSED 172.18.0.2:5432 at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1161:16)) errors, but eventually it ran properly. I could access the OED site on localhost without the database data. I checked the version of PostgreSQL in the container and it was 14.5.

Finally, I tried to restore the database using the psql command. Running the command as it was in the article didn't work, so I changed it to match the pg_dumpall command: docker compose exec database psql -U oed > dump_$(date +%Y-%m-%d"_"%H_%M_%S.sql). This ran the command, but it ran into multiple errors. Like Steve said, when the database container starts, some data is initialized and the psql command was not able to overwrite the existing data. This is as far as I have gotten with my testing.

## Next Steps

Get the method working
* So far, two of the three steps are working, just need to figure out how to overwrite the existing data, or make it so when OED starts the database container, it doesn't initialize anything.
* While the second step is working, deleting the postgres-data folder is probably not the correct method for solving the encountered error. Need to find the proper way to solve it. Potentially, the error might be solved if the database isn't initialized.
* Need to see what the differences are between the different commands, pg_dumpall/psql vs. pg_dump/pg_restore and if one method is better than the other.
* If this method ends up not working, try to use the pg_upgrade method

Make a procedure for migrating the database
* Theoretically, a script could be made that runs some or all of the commands. While I shut down OED and restarted it, it might be possible to just shut down the database container and bring it back up again, or bring up a new container in parallel.
* There will need to be a new help page on the OED website detailing how to migrate the database. It might be as simple as telling the user to run the script, but if a script is not possible, it will have to walk the user through what commands to run.