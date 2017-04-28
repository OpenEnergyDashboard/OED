# Open Energy Dashboard #
[![Build Status](https://travis-ci.org/beloitcollegecomputerscience/OED.svg?branch=master)](https://travis-ci.org/beloitcollegecomputerscience/OED)

This web application is designed to display energy information about Beloit College or other institutions to users.

### Built With: ###
Chart.js - Javascript library used to generate data charts ([chartjs.org](http://www.chartjs.org))

PostgreSQL - Database management system ([postgresql.org](https://www.postgresql.org))

Node.js - Javascript runtime environment ([nodejs.org](https://nodejs.org/en/))

### Developer installation: ###

You can either install PostgreSQL on your computer or use Docker.

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

#### With Docker ####

1. Install Node, npm, and git.
1. Clone this repository.
1. Run ```npm install``` in the project root directory.
1. Run ```docker build -t oed_postgres ./docker```. This will take a while.
1. Copy the ```docker/docker.env``` file to ```.env```.
1. Run ```docker run -d -P --name oed_database oed_postgres```. 
1. Run ```docker ps``` and look for something like ```0.0.0.0:32771->5432/tcp```. 
1. Edit ```.env``` to reflect the correct database port; in the example it would be 32771. Also change the token secret. 
1. Everything from here is the same as above, after setting up the database.
1. Once you're done working, run ```docker stop oed_test```. Optionally you can run ```docker rm oed_test``` in order to completely remove the container from your system.

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

