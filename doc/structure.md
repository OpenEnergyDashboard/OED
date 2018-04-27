# Project Structure

The project is organized into a number of subdirectories. The primary division is among:

* Metadata, configs, and deployment information
* Frontend code
* Backend code
* Common code
* Deployment and Analysis Scripts

## Metadata

In the root directory, we have several metadata files. These are further organized by technology or purpose.

### For Humans

* **README.md** is an overview of the project, displayed on the GitHub front page for the project.
* **USAGE.md** describes how to install, configure, and use the project from a sysadmin's point of view.
* **License.txt** describes the legal aspect of the project. OED is licensed under the [Mozilla Public Licese version 2.0](https://www.mozilla.org/en-US/MPL/2.0/).
* The **doc/** directory holds documentation intended for developers.

### For Development Tools

* **.editorconfig** conveys some of our basic style rules to most common code editors.
* **.gitignore** informs the Git Version Control System about files that it should not track.
* **.gitattributes** informs Git about how to properly show diffs for our files.
* **.travis.yml** configures the Travis Continuous Integration service.
* **tslint.json** configures the TSLint code quality tool and style checker

### For Code Transformers
* **.babelrc** configures the Babel JavaScript compiler
* **tsconfig.json** configures the TypeScript compiler
* **webpack.js** configures the WebPack JavaScript uglifier, optimizer, and packer

### For Dependency Management Tools

* **.npmrc** specifies default dependency management behavior for the Node.js Package Manager
* **package.json** specifies direct dependencies and some package metadata
* **package-lock.json** specifies working direct and transitive dependencies used on the last build committed
* **Dockerfile** specifies how to build the web container, which runs the OED web app
* the **database** directory contains everything needed to build the database Docker container
* **.dockerignore** tells the Docker containerization engine which files to ignore
* **docker-compose.yml** specifies how to collect the database and web Docker containers together into a working deployment

## Frontend Code

All frontend code is stored in `src/client`. It follows a standard React/Redux structure.

## Backend Code

All backend code is stored in `src/server`, except for the executable server, which is `src/bin/www`.
It is further broken down into the following categories:

* **app.js** is the Express-based application. All code is eventually called from here.
* **config.js** provides environment-variable or `.env`-file based configuration.
* **log.js** provides a basic logging framework for the project.
* **util.js** provides various processing utilities.
* **version.js** specifies the version of the project.
* **migrations/** includes code to migrate a database between versions of the OED schema.
* **models/** comprises a simple ORM. There is one class for each type of object stored in the database.
* **routes/** contains functions for each Express route for the main page, subsidary pages, and all API routes.
* **services/** contains specialized code not directly related to an individual route; for instance, updating Mamac meters. Some files in this directory are executable.
* **sql/** contains SQL queries called from the NodeJS application.
* **test/** contains the code and data needed for our test suite.

## Common Code

All common code is stored in `src/common`. Currently, only the `TimeInterval` class, which represents an interval between two instants in time, is stored here.

## Scripts

Scripts are stored in `src/scripts`.

The scripts are as follows:

* **checkHeader.sh** verifies that all source files have the MPLv2 legal header. It is run in CI.
* **checkTypescript.sh** verifies that there are no untyped JavaScript files in the client tree. It is run in CI.
* **devstart.sh** starts both the webserver and Webpack, in dev mode (watches files and shows interactive
* **installOED.sh** sets up OED, either for development for production, creating the database schema and installing dependencies
* **oed.service** is a sample [systemd](https://www.freedesktop.org/wiki/Software/systemd/) unit file which allows Linux system administrators to start OED on startup.
* **updateMamacMetersOEDCron.bash** is a script meant to be run at regular intervals (for instance, with cron) which updates Mamac-brand pull-type meters.
* **updateOED.sh** To be run after pulling the latest version from Git. Grabs new dependencies and migrates the database.