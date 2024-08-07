#!/bin/bash
# *
# * This Source Code Form is subject to the terms of the Mozilla Public
# * License, v. 2.0. If a copy of the MPL was not distributed with this
# * file, You can obtain one at http://mozilla.org/MPL/2.0/.
# *

printf "\n\n%s\n\n" "***** Starting install of OED at $(date) *****"

USAGE="Usage: $0 [--production] [--nostart] [--keep_node_modules] [--continue_on_db_error] [--skip_db_initialize]"

production=no
dostart=yes
keep_node_modules=no
continue_on_db_error=no
skip_db_initialize=no
# eventually we will transition away from using an email
usernameTest="test"
usernameTestEmail="test@example.com"

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
		--continue_on_db_error)
			shift
			continue_on_db_error=yes
			;;
		--skip_db_initialize)
			shift
			skip_db_initialize=yes
			;;
		"")
			# Empty string so just ignore. Esp. happens if no install_args on docker compose up.
			shift
			;;
		*)
			printf "Unknown argument \"%s\"\n" $1
			printf "%s\n" $USAGE
			exit 1
	esac
done

# Load .env if it exists

if [ -f ".env" ]; then
	source .env
fi

# Skip the install if the node_modules were installed before the package files.
# The two package files
packageFile="package.json"
packageLockFile="package-lock.json"
# node hidden lock file that is changed each time npm install is run.
nodeHiddenLockFile="node_modules/.package-lock.json"
# See if hidden node lock file exists and is newer than the two package files.
if [ -f "$nodeHiddenLockFile" ] && [ "$nodeHiddenLockFile" -nt "$packageFile" ] && [ "$nodeHiddenLockFile" -nt "$packageLockFile" ] ; then
	# The node install happened after the package files were created so don't redo
	keep_node_modules=yes
fi

# Install NPM dependencies
if [ "$keep_node_modules" == "yes" ]; then
	printf "\n%s\n\n" "skipping NPM install as requested or because node_modules seems up to date"
else
	printf "\n%s\n\n" "NPM install..."
	npm ci --loglevel=warn
	if [ $? == 0 ]; then
		printf "\n%s\n\n" "NPM install finished."
	else
		# npm reported an error. Sometimes it does so can skip steps.
		# Using printf since it is more reliable.
		printf "\n%s\n\n" "NPM reported an error so stopping"
		exit 2
	fi
fi

if [ "$skip_db_initialize" == "yes" ]; then
	printf "\n%s\n\n" "skipping database initialization as requested"
else
	create_error=0 # Boolean

	tries=0
	max_tries=10

	# Try to create the schema until it succeeds
	while [ $create_error == 0 ]; do
		# See if exceed allowed number of tries and stop install if you have.
		if [ $tries -ge $max_tries ]; then
			printf "%s\n" "FAILED! Too many tries. Try again but then check if your database at $OED_DB_HOST:$OED_DB_PORT is down."
			exit 1
		fi
		# Sleep to let PostgreSQL chill out
		sleep 3
		printf "%s\n" "Attempting to create database..."
		# Redirect stderr to a file
		npm run createdb |& tee /tmp/oed.error > /dev/null
		createdb_code=${PIPESTATUS[0]}
		# TODO: This should be moved to the error case below once issues with this process are under control.
		# If all is well it could go inside the case where an unknown error occurred.
		# Dump the output from the database creation attempt.
		printf "\n%s\n" "-----start of npm run createdb output-----"
		cat /tmp/oed.error
		printf "%s\n\n" "-----end of npm run createdb output-----"
		if [ $createdb_code -ne 0 ]; then
			# An error occurred during createdb.
			# search the file for the kind of error we can recover from
			# This is not getting a DB connection or if the DB is not yet ready.
			grep -q -e 'Error: connect ECONNREFUSED' -e 'error: the database system is starting up' /tmp/oed.error
			known_error=$?
			if [ $known_error -eq 0 ]; then
				# There was an error in createdb but it is one we believe we can recover from.
				create_error=0
				printf "%s\n" "  known database issue occurred so will try again..."
			else
				# There was an error in createdb and we cannot recover.
				create_error=1
				if [ "$continue_on_db_error" = "no" ]; then
					# We should stop the install process. This means it won't try to bring up the web service.
					printf "%s\n" "FAILURE: creation of database failed so stopping install. Use --continue_on_db_error if you want install to continue"
					exit 3
				else
					printf "\n%s\n" "WARNING: an unknown error occurred during database creation so stopping database creation."
					printf "%s\n" "The validity of the database is uncertain."
					printf "%s\n" "Install continuing because of flag --continue_on_db_error"
				fi
			fi
		else
			# There was no createdb error so assume database ready for use so stop process
			create_error=1
			printf "%s\n" "  database creation had no errors so assume schema creation worked."
		fi
		# Did one more attempt
		((tries=tries+1))
	done

	# Create a user
	set -e
	if [ "$production" == "no" ] && [ ! "$OED_PRODUCTION" == "yes" ]; then
		npm run createUser -- $usernameTest password
		createuserTest_code=$?
		# this second username uses an email: test@example.com and we will remove this eventually
		# as we are moving to using username instead of email
		npm run createUser -- $usernameTestEmail password
		createuserTestEmail_code=$?
		if [ $createuserTest_code -ne 0 ] || [ $createuserTestEmail_code -ne 0 ]; then
			# There was an error so stop process unless asked to continue on DB issues.
			if [ "$continue_on_db_error" = "no" ]; then
				# We should stop the install process. This means it won't try to bring up the web service.
				printf "%s\n" "FAILURE: creation of user failed so stopping install. Use --continue_on_db_error if you want install to continue"
				exit 4
			else
				printf "\n%s\n" "WARNING: an unknown error occurred during user creation."
				printf "%s\n" "The validity of the database and test user is uncertain."
				printf "%s\n" "Install continuing because of flag --continue_on_db_error"
			fi
		else
			# There was no createdb error so assume database ready for use so stop process
			printf "%s\n" "User creation had no errors so default user $usernameTest and $usernameTestEmail with password 'password' should exist"
		fi
		# Create function to shift readings for compare - developer only
		printf "%s\n" "Creating developer DB function"
		npm run developerdb
	fi
fi

# Build webpack if needed
if [ "$production" == "yes" ] || [ "$OED_PRODUCTION" == "yes" ]; then
	npm run webpack:build
elif [ "$dostart" == "no" ]; then
	npm run webpack
fi

printf "%s\n" "OED install finished"

# Start OED
if [ "$dostart" == "yes" ]; then
	if [ "$production" == "yes" ] || [ "$OED_PRODUCTION" == "yes" ]; then
		printf "%s\n" "Starting OED in production mode"
		npm run start
	else
		printf "%s\n" "Starting OED in development mode"
		./src/scripts/devstart.sh
	fi
else
	printf "%s\n" "Not starting OED due to --nostart"
fi
