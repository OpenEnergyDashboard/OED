# Environmental Dashboard - Beloit College #

This web application is designed to display environmental information about Beloit College or other institutions to users.

### Developer installation: ###

1. Install Node and npm
1. Clone this repository
1. Run ```npm install```
1. Install PostgreSQL, start the PostgreSQL server, and connect to it via psql
1. In psql, run ```CREATE DATABASE environmental_dashboard``` to create the database.
1. Still in psql, run ```\c environmental_dasboard``` to connect to the database that was just created.
1. Run the file ```sql/createdb.sql``` to create the tables in the database.
1. Create a .env file in the root directory of the project with the following, replacing (?) with the desired information: <br>
&nbsp;&nbsp;&nbsp;&nbsp;SERVER_PORT=?<br>
&nbsp;&nbsp;&nbsp;&nbsp;DB_USER=?<br>
&nbsp;&nbsp;&nbsp;&nbsp;DB_DATABASE=? // The database you just created, so likely environmental_dashboard<br>
&nbsp;&nbsp;&nbsp;&nbsp;DB_PASSWORD=?<br>
&nbsp;&nbsp;&nbsp;&nbsp;DB_HOST=?<br>
&nbsp;&nbsp;&nbsp;&nbsp;DB_PORT=? <br>
&nbsp;&nbsp;&nbsp;&nbsp;TOKEN_SECRET=? // Token for authentication
1. Run ```npm run build``` to create the Webpack bundle for production, otherwise run ```npm run dev``` for development.
1. Run ```npm start```

### Contact: ###

Send us an email, open a GitHub issue, or make a pull request.
