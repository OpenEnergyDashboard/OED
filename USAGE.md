# Transition to Developer Website

The [developer website](https://openenergydashboard.github.io/developer/) is now available and becoming the preferred way to learn about working with the OED project. The information on this page is being transferred to that site but this page still contains useful information that has yet to be transferred. We suggest you start with the new website and visit here if you want some information not yet on that site. Note that some of the information here is out of date and will updated during the transition. Thanks for your understanding.

# Quick Start With Docker #

If using Docker, you first need to install [Docker](https://docs.docker.com/engine/installation/)
and [docker-compose](https://docs.docker.com/compose/install/).

On Ubuntu, you can do this via:

```bash
sudo apt install docker.io docker-compose
```

You can then install and start OED with:

```bash
docker-compose up
```

Go to `localhost:3000` in your web browser and enjoy!

You probably want to read the rest of this document to learn about the technologies we
use and how to add meters and read data from them.

# Requirements #

The Open Energy Dashboard uses **PostgreSQL** version 9.6 or higher for data storage, and
runs on **Node.js** version 8.11 or higher. These are the version shipped in the Ubuntu
repositories, meaning that Windows users can easily use the Windows Subsystem for Linux
in order to work on the project.

OED can also be installed using the Docker containerization tool. This allows it to be
segregated from the rest of the system, and makes updates easier to perform, since the
dependencies are all taken care of through the container definitions.

The is the only supported method for production deployments.

Under Docker, OED is installed and administered using the `docker-compose` command. You
will need Docker version 18.06 CE or higher and `docker-compose` version 1.21 or higher.
If you want to install OED so you can contribute code, see the "Development" section. If
you are setting up OED in order to gather data from power meters and display it, see the
"Production" section.

### On Linux ###

In order to run OED with Docker on Linux, your operating system must be `docker-compose`
compatible.  A good standard of whether or not your distro will work is if it supports the
x86-64 instruction set; if it does, you're probably in the clear.  It is recommended that
you check [this list](https://github.com/semicolon-madness/RCOS/blob/main/64bitLinuxOSs.md) 
to be sure.

## Notes ##

### On The Terminal ###

This guide requires that you enter some commands into an operating system shell, or
terminal.

- On Windows, this is the "Command Line" (`cmd.exe`).
- On MacOS, you can use Terminal.app (the default), iTerm2, or any other terminal program.
- On Linux, your distribution will provide a terminal; it can generally be opened with
Ctrl+Shift+T or by searching for "Terminal" in your application menu.

### On OED and Non-UNIX Operating Systems ###

Windows is not a supported platform. You can probably run OED there, but you will
experience problems for the following reasons.

First, Docker is a Linux technology. It is based on Linux kernel features including namespaces
and cgroups. On Mac OS, you can use [Docker for Mac](https://docs.docker.com/docker-for-mac/)
to run OED in Docker. Microsoft limits the use of Docker for Windows to the Professional
and Enterprise editions. so you may experience problems.

Second, Open Energy Dashboard universally uses UNIX filenames, which are seperated with forward
slashes. This means all of our convenience scripts are broken on Windows.

# Installation #

The following guides relate how to install, configure, and run OED for the first time, for development
and for production usage.

## Development ##

### With Docker ###

When using OED via Docker, most commands should be issued in the form:

`docker-compose exec web [COMMAND]`

In other words:
- `docker-compose exec` - Execute a command in a Docker container managed by Docker-Compose
- `web` - Run the command in the `web` container (the container with Node and NPM)

This only works if the system is running (started via `docker-compose up`). If, for some
reason, you have to execute a command without starting the system, use	`docker-compose
run --rm web [COMMAND]`, which will start a new `web` container and then remove it
once finished.

Follow the instructions in the Docker Quickstart section at the top of the document.

### Without Docker ###
If you are not using Docker, you need to install the dependencies yourself. Specifically,
install Node.js version 8.11 or higher; NPM, the Node package manager; and PostgreSQL
version 9.6 or higher.

Docker also manages configuration. If you are not using Docker, you will need to create a
.env file (a file whose name is `.env` and nothing else) in the root directory of the project
with the following contents, with any changes needed for your system.

See below for more on what each variable does.

```
OED_PRODUCTION=no
OED_SERVER_PORT=3000
OED_TOKEN_SECRET=asdf
OED_DB_USER=oed
OED_DB_DATABASE=oed
OED_DB_TEST_DATABASE=oed_testing
OED_DB_PASSWORD=opened
OED_DB_HOST=localhost
POSTGRES_PASSWORD=xxx
OED_DB_PORT=5432
OED_LOG_FILE=log.txt
OED_MAIL_METHOD=none
OED_MAIL_IDENT=
OED_MAIL_CREDENTIAL=
OED_MAIL_FROM=
OED_MAIL_TO=
OED_MAIL_ORG=
```

### Installation Steps ###

Set up Node environment and the database by running `src/scripts/installOED.sh` in the main directory.
Wait for the Webpack build to finish and then access the app at [localhost:3000](http://localhost:3000).

You can log into the app with email: `test@example.com`, password: `password`.

### Adding Meters ###

If you have network-connected MAMAC meters, create a CSV file with a single column called "ip"
with your meter IP addresses and copy it into the directory in which the project resides.
It should look something like this:

```csv
ip
127.0.0.1
127.0.0.2
```

Add meters from the ips.csv file with
`docker-compose exec web npm run addMamacMeters ips.csv`,
then fetch data from the meters you just added with
`docker-compose exec web npm run updateMamacMeters`.
Finally, update aggregate readings with
`docker-compose exec web npm run refreshReadingViews`.

### Environment Variables ###
The OED server is configured via environment variables, as follows.

- OED_PRODUCTION: 'yes' if running "for realsies" on a server, 'no' otherwise.
- OED_SERVER_PORT: The port that the server should run on. 3000 is a good default choice
- OED_TOKEN_SECRET: Token for authentication. Generate something secure and random
- OED_DB_USER: The user that should be used to connect to postgres
- OED_DB_DATABASE: The database you just created, so likely oed
- OED_DB_TEST_DATABASE: The test database you just created, so likely oed_testing
- OED_DB_PASSWORD: The password for your postgres user
- POSTGRES_PASSWORD: The password for the postgres running in the container. You might want to change its value for security reasons.
- OED_DB_HOST: The host for your postgres db, likely localhost
- OED_DB_PORT: The port for your postgres db, likely 5432
- OED_LOG_FILE: Path to the log file, defaults to ./log.txt
- OED_MAIL_METHOD: Method of sending mail. Supports "gmail", "mailgun", "none". Case insensitive.
- OED_MAIL_IDENT: Username for gmail, domain for mailgun. Ex: user@example.com
- OED_MAIL_CREDENTIAL: Password for gmail, or API key for mailgun.
- OED_MAIL_FROM: From address for email. If using GMail, make sure this is set
- OED_MAIL_TO: Who gets error e-mail. Ex: admin@example.com
- OED_MAIL_ORG: Organization name, used in e-mail subject line

## Production ##
### Installation ###
1. Install [Docker](https://docs.docker.com/engine/installation/) and [docker-compose](https://docs.docker.com/compose/install/).
1. Clone this repository. `git clone https://github.com/OpenEnergyDashboard/OED.git [directory]`
1. Create a CSV file with a single column called "ip" with your meter IP addresses and copy it into the directory where the project resides. These are the IPs of Mamac meters from which this OED instance will pull data. If the site has no Mamac meters, you may skip this step.
1. Edit ```docker-compose.yml``` to change
	1. OED_PRODUCTION to `yes`.
	1. the secret key (in `services -> web -> environment -> OED_TOKEN_SECRET`) to a random value. Keep it secret.
	1. the port (in `services -> web -> ports`) to a mapping from host to container; e.g., to host on your computer's port 80, set it to `80:3000`.

1. Copy ```src/scripts/updateMamacMetersOEDCron.bash``` to ```/etc/cron.hourly/updateMamacMetersOEDCron.bash``` and make the necessary modifications to the script. See the script for more detail.
1. Copy ```src/scripts/sendLogEmailCron.bash``` to ```/etc/cron.daily/sendLogEmailCron.bash``` and make the necessary modifications to the script. See the script for more detail.
1. Copy ```src/scripts/refreshReadingViewsCron.bash``` to ```/etc/cron.daily/refreshReadingViewsCron.bash``` and make the necessary modifications to the script. See the script for more detail.
1. Run ```chmod +x updateMamacMetersOEDCron.bash``` to make the script executable.
1. Run ```chmod +x sendLogEmailCron.bash``` to make the script executable.
1. Run ```chmod +x refreshReadingViewsCron.bash``` to make the script executable.
1. Copy ```src/scripts/oed.service``` to ```/etc/systemd/system/oed.service``` and make the necessary modifications to the script. See the script for more detail.
1. Update your meters to get data for the first time. Refer to the Administration section below.
1. Run ```systemctl enable oed.service``` to make the service start on server boot.
1. Bring the app online with ```systemctl start oed.service```. Stop the app with ```systemctl stop oed.service```.
1. To import meters, visit the admin page and upload the CSV file.



# Administration #

## Data Storage ##

PostgreSQL stores its data in `postgres-data`. This and `node_modules` will be owned by
root, becuase the user in the Docker continer is root; to uninstall the app, you need to
delete them from inside the container (or as root on your own machine):
```docker-compose run --rm web rm -r postgres-data node_modules```.

You can access the PostgreSQL database through the `database` service. Given that the app
is running, you can:

* Get a Postgres shell with `docker-compose exec database psql -U oed`
* Take a database dump with `docker-compose exec database pg_dump -U oed > dump_$(date +%Y-%m-%d"_"%H_%M_%S.sql)`
* Restore a database dump by first copying the dump into the container with `docker cp /path/to/dump.sql container_name:/dump.sql` and then restoring it into the database with `docker-compose exec database psql -U oed -f /dump.sql`.
* Change an admin's password with `docker-compose run --rm web npm run editUser` and follow the directions.
* Nuke the database by running `docker-compose exec database psql -U postgres database/nuke.sql`. ⚠ THIS WILL DELETE ALL DATA. ⚠

### NPM Scripts ###

These can be run by executing `npm run [SCRIPT]` in the `web` Docker-Compose service
(e.g. `docker-compose run --rm web npm run [SCRIPT] [args]`).

For non-Docker installs, simply issue `npm run [SCRIPT]`.

App actions:
* `start` starts the NodeJS webserver.
* `start:dev` starts the NodeJS webserver with Nodemon, so it restarts automatically.
* `webpack:dev` runs Webpack in development mode and dynamically rebuilding the client-side application when files change.
* `webpack:build` runs Webpack once in production mode.
* `webpack` runs Webpack once in development mode.

Validation and CI actions:
* `check` runs all the below non-test checks (that is, all static checks)
* `check:header` ensures that there are no source files without MPL headers.
* `check:typescript` ensures that there are no JavaScript source files in the TypeScript portion of the project.
* `check:lint` runs TSLint against the project to ensure style conformity.
* `check:types` runs the TypeScript compiler without emitting code (i.e. just checks for type errors).
* `test` runs the automated test suite on the server.

Administration:
* `createdb` creates the database schema in an uninitialized database. It will not update the schema.
* `addMamacMeters` adds meters from a CSV file (see above).
* `updateMamacMeters` fetches new data from previously imported Mamac meters.
* `refreshReadingViews` aggregates readings data in the database.
* `createUser` creates a new user. If given no arguments, it is interactive; you can also pass the username and password as command line arguments.
* `editUser` edits the password of an existing user.

### Upgrading the App ###

To upgrade the app:
1. Stop the app (`systemctl stop oed.service`)
1. Store your local config changes with `git stash`
1. Update with `git pull`.
1. Replace your local changes with `git stash pop`
1. Re-build the app (`docker-compose run --rm web ./src/scripts/updateOED.sh`)
1. Restart the app (`systemctl start oed.service`)

Some old installations (from 0.3.0 or before) need to upgrade their PostgreSQL user to
superuser.

