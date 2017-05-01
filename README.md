# Open Energy Dashboard #
[![Build Status](https://travis-ci.org/beloitcollegecomputerscience/OED.svg?branch=master)](https://travis-ci.org/beloitcollegecomputerscience/OED)

This web application is designed to display energy information about Beloit College or other institutions to users.

### Built With: ###
Chart.js - Javascript library used to generate data charts ([chartjs.org](http://www.chartjs.org))

PostgreSQL - Database management system ([postgresql.org](https://www.postgresql.org))

Node.js - Javascript runtime environment ([nodejs.org](https://nodejs.org/en/))

### Developer installation: ###

You can either use Docker Compose to install the app and PostgreSQL in containers, or install PostgreSQL on your system.

#### With Docker ####

Depending on your environment, you may need ```sudo``` for these commands.

1. In the main directory, run ```docker-compose build```. 
This may take some time, as it installs the Node dependencies in the container.
1. Set up the database with ```docker-compose run --rm web scripts/init.sh <excel file>```. 
To clarify: ```docker-compose run --rm web``` means run the following command, in the ```web``` container (the one containing the OED NodeJS app). 
You can either provide an Excel file with the IPs of some Mamac meters, in which case the database will be populated, or enter NONE, which will skip populating it.
1. For production, run the app with ```docker-compose up -d```. This starts the app in the background.
For development, use ```docker-compose run --rm --service-ports web scripts/devstart.sh```, which will enable watching rebuild and serve the app locally.
```--service-ports``` is required because by default only ```docker-compose up``` opens the ports.
1. Stop the app with ```docker-compose stop```. This means that next time, you can skip the built and init steps. You can get rid of the database with ```docker-compose down```.

Configuration is in ```docker-config.yml```. See especially the ```environment:``` section for the ```web``` service.
By default, the app will run on the port 3000 with secret key ?, which should definitely be changed.

#### Without Docker ####

1. Install Node, npm, and git.
1. Clone this repository.
1. Run ```npm install``` in the project root directory.
1. Install PostgreSQL, start the PostgreSQL server, and connect to it via psql.
1. In psql, run ```CREATE DATABASE oed;``` to create the database.
1. Still in psql, run ```CREATE DATABASE oed_testing;``` to create a database for automated tests.
1. Create a .env file in the root directory of the project with the following, replacing (?) with the desired information: <br>
```
SERVER_PORT=?              // The port that the server should run on. 3000 is a good default choice
DB_USER=?                  // The user that should be used to connect to postgres
DB_DATABASE=?              // The database you just created, so likely oed
DB_TEST_DATABASE=?         // The test database you just created, so likely oed_testing
DB_PASSWORD=?              // The password for your postgres user
DB_HOST=?                  // The host for your postgres db, likely localhost
DB_PORT=?                  // The port for your postgres db, likely 5432
TOKEN_SECRET=?             // Token for authentication. Generate something secure and random
```
8. Run ```npm run createdb``` to create the database schema.
1. Run `npm run addMamacMeters` to load mamac meters from an `.xlsx` file.
1. Run `npm run updateMamacMeters` to fetch new data for mamac meters in the database.
1. Run ```npm run build``` to create the Webpack bundle for production, otherwise run ```npm run dev``` for development.
1. Run ```npm start```

### Authors ###

This application was created by a team of Beloit College CS students led by Prof. Steven Huss-Lederman

For a list of contributors, [click here](https://github.com/beloitcollegecomputerscience/ED-JS/graphs/contributors)

### Licensing ###

This project is licensed under the MPL version 2.0.

See the full licensing agreement [here](https://github.com/beloitcollegecomputerscience/ED-JS/blob/master/License.txt)

### Contributions ###

We welcome others to contribute to this project by writing code for submission or collaborating with us. Before contributing, please sign our Contributor License Agreement [here](https://goo.gl/forms/nR9MtVHUOqYn8WbP2).
If you have any questions or concerns feel free to email us at oed@beloit.edu.
### Contact: ###

To contact us, send an email to oed@beloit.edu or open an issue on GitHub.

