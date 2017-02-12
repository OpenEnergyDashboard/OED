# Environmental Dashboard - Beloit College #

This web application is designed to display environmental information about Beloit College or other institutions to users.

### Built With: ###
Highcharts - Javascript library used to generate data charts ([highcharts.com](http://www.highcharts.com))

PostgreSQL - Database management system ([postgresql.org](https://www.postgresql.org))

Node - Javascript runtime environment ([nodejs.org](https://nodejs.org/en/))

### Developer installation: ###

1. Install Node, npm, and git.
1. Clone this repository.
1. Run ```npm install``` in the project root directory.
1. Install PostgreSQL, start the PostgreSQL server, and connect to it via psql.
1. In psql, run ```CREATE DATABASE environmental_dashboard;``` to create the database.
1. Still in psql, run ```CREATE DATABASE environmental_dashboard_testing;``` to create a database for automated tests.
1. Create a .env file in the root directory of the project with the following, replacing (?) with the desired information: <br>
&nbsp;&nbsp;&nbsp;&nbsp;SERVER_PORT=? // The port that the server should run on. 3000 is a good default choice<br>
&nbsp;&nbsp;&nbsp;&nbsp;DB_USER=? // The user that should be used to connect to postgres<br>
&nbsp;&nbsp;&nbsp;&nbsp;DB_DATABASE=? // The database you just created, so likely environmental_dashboard<br>
&nbsp;&nbsp;&nbsp;&nbsp;DB_TEST_DATABASE=? // The test database you just created, so likely environmental_dashboard_testing<br>
&nbsp;&nbsp;&nbsp;&nbsp;DB_PASSWORD=? // The password for your postgres user<br>
&nbsp;&nbsp;&nbsp;&nbsp;DB_HOST=? // The host for your postgres db, likely localhost<br>
&nbsp;&nbsp;&nbsp;&nbsp;DB_PORT=? // The port for your postgres db, likely 5432<br>
&nbsp;&nbsp;&nbsp;&nbsp;TOKEN_SECRET=? // Token for authentication. Generate something secure and random
1. Run ```npm run createdb``` to create the database schema.
1. Run ```npm run build``` to create the Webpack bundle for production, otherwise run ```npm run dev``` for development.
1. Run ```npm start```

### Authors ###

This application was created by a team of Beloit College CS students led by Prof. Steven Huss-Lederman

For a list of contributors, [click here](https://github.com/beloitcollegecomputerscience/ED-JS/graphs/contributors)

### Licensing ###

This project is licensed under the GNU General Public License v3.0

See the full licensing agreement [here](https://github.com/beloitcollegecomputerscience/ED-JS/blob/README/License.txt)

### Contact: ###

Send us an email, open a GitHub issue, or make a pull request.

