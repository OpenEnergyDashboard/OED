# Installation #
You can either use Docker Compose to install Node and PostgreSQL in containers, or install Node and PostgreSQL on your system.

## Development ##

### With Docker ###
1. Install [Docker](https://docs.docker.com/engine/installation/) and [docker-compose](https://docs.docker.com/compose/install/).
1. Clone this repository.
1. Create a CSV file with a single column called "ip" with your meter IP addresses and copy it into the directory where the project resides.
1. Set up Node environment and the database by running ```docker-compose run --rm web src/scripts/init.sh <csv file> --default-user``` in the main directory. 
1. Start the app in development mode with ```docker-compose run --rm --service-ports web src/scripts/devstart.sh```.
1. Wait for the Webpack build to finish and then access the app at [localhost:3000](http://localhost:3000).

The app will re-build any time a file is changed. You can log into the app with `test@test.test`, password `testtest` (the result of the `--default-user` flag to the init script).

Killing the running process (ctrl+C) will stop the app. You can get rid of the containers with ```docker-compose down```.

### Without Docker ###
1. Install Node, npm, and git.
1. Clone this repository.
1. Run ```npm install``` in the project root directory.
1. Install PostgreSQL, start the PostgreSQL server, and connect to it via psql.
1. In psql, run ```CREATE DATABASE oed;``` to create the database.
1. Still in psql, run ```CREATE DATABASE oed_testing;``` to create a database for automated tests.
1. Create a .env file in the root directory of the project with the following, replacing (?) with the desired information: <br>
```
OED_SERVER_PORT=?              // The port that the server should run on. 3000 is a good default choice
OED_DB_USER=?                  // The user that should be used to connect to postgres
OED_DB_DATABASE=?              // The database you just created, so likely oed
OED_DB_TEST_DATABASE=?         // The test database you just created, so likely oed_testing
OED_DB_PASSWORD=?              // The password for your postgres user
OED_DB_HOST=?                  // The host for your postgres db, likely localhost
OED_DB_PORT=?                  // The port for your postgres db, likely 5432
OED_TOKEN_SECRET=?             // Token for authentication. Generate something secure and random
OED_LOG_FILE=?                 // Path to the log file, defaults to ./log.txt
```
8. Run ```npm run createdb``` to create the database schema.
1. Run `npm run addMamacMeters` to load mamac meters from an `.csv` file.
1. Run `npm run updateMamacMeters` to fetch new data for mamac meters in the database.
1. Run `npm run createUser` and follow the directions to create a new admin user.
1. Run ```npm run build``` to create the Webpack bundle for production, otherwise run ```npm run dev``` for development.
1. Run ```npm start```


## Production ##
### Installation ###
1. Install [Docker](https://docs.docker.com/engine/installation/) and [docker-compose](https://docs.docker.com/compose/install/).
1. Clone this repository.
1. Create a CSV file with a single column called "ip" with your meter IP addresses and copy it into the directory where the project resides.
1. Set up the environment with `docker-compose run --rm web src/scripts/init.sh <csv file> --build` in the main directory.
1. Edit ```docker-compose.yml``` to change
	1. the secret key (in `services -> web -> environment -> OED_TOKEN_SECRET`) to a random value. Keep it secret.
	1. the port (in `services -> web -> ports`) to a mapping from host to container; e.g., to host on your computer's port 80, set it to `80:3000`.
1. Copy src/scripts/updateMamacMetersOEDCron.bash to /etc/cron.hourly/updateMamacMetersOEDCron.bash and make the necessary modifications to the script. See the script for more detail.
1. Run ```chmod +x updateMamacMetersOEDCron.bash``` to make the script executable.
1. Copy src/scripts/oed.service to /etc/systemd/system/oed.service and make the necessary modifications to the script. See the script for more detail.
1. Run ```systemctl enable oed.service``` to make the service start on server boot.
1. Bring the app online with ```systemctl start oed.service```. Stop the app with ```systemctl stop oed.service```.

### Administration ###

PostgreSQL stores its data in `postgres-data`. This and `node_modules` will be owned by root, becuase the user in the Docker continer is root; to uninstall the app, you need to delete them from inside the container (or as root on your own machine): ```docker-compose run --rm web rm -r postgres-data node_modules```.

You can access the PostgreSQL database through the `database` service. Given that the app is running, you can:

* Get a Postgres shell with `docker-compose exec database psql -U oed`
* Take a database dump with `docker-compose exec database pg_dump -U oed > dump_$(date +%Y-%m-%d"_"%H_%M_%S.sql)`
* Restore a database dump with by first copying the dump into the container with `docker cp /path/to/dump.sql container_name:/dump.sql` and then restoring it into the database with `docker-compose exec database psql -U oed -f /dump.sql`.

### NPM Scripts ###

These can be run by executing `npm run <script>` in the `web` Docker-Compose service.

App actions:
* `start` starts the NodeJS webserver
* `dev` starts Webpack in development mode, dynamically rebuilding the packed file.
* `build` builds the app for production

Validation and CI actions:
* `checkHeader` ensures that there are no source files without MPL headers
* `checkTypescript` ensures that there are no JavaScript source files in the TypeScript portion of the project
* `lint` runs TSLint against the project to ensure style conformity
* `typeCheck` runs the TypeScript compiler without emitting code (i.e. just checks for type errors)
* `test` runs the automated test suite on the server.

Administration:
* `createdb` creates the database schema
* `addMamacMeters` adds meters from a CSV file with the heading `ip`
* `updateMamacMeters` fetches new data from known meters
* `createUser` creates a new user, either with `... createUser <username> <password>` or interactively.

### Upgrading the App ###

To upgrade the app:
1. Stop the app (`systemctl stop oed.service`)
1. Store your local config changes with `git stash` 
1. Update with `git pull`. 
1. Replace your local changes with `git stash pop`
1. Re-build the app (`docker-compose run --rm web ./src/scripts/init.sh NONE --build --no-user`)
1. Restart the app (`systemctl start oed.service`)
