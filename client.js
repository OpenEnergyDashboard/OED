/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { Client } = require('pg');

const pgclient = new Client({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: 'postgres',
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.OED_DB_TEST_DATABASE
});

pgclient.connect();

const createUser = "CREATE USER " + process.env.OED_DB_USER + " WITH PASSWORD '" + process.env.POSTGRES_PASSWORD + "'"
const alterUser = "ALTER USER " + process.env.OED_DB_USER + " WITH SUPERUSER;"
const extension = "CREATE EXTENSION IF NOT EXISTS btree_gist;"

pgclient.query(createUser, (err, res) => {
  if (err) throw err
});

pgclient.query(alterUser, (err, res) => {
  if (err) throw err
});

pgclient.query(extension, (err, res) => {
  if (err) throw err
  pgclient.end()
});
