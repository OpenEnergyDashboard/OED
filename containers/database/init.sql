/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

CREATE USER oed WITH SUPERUSER PASSWORD 'opened';
DROP DATABASE IF EXISTS oed;
CREATE DATABASE oed WITH OWNER oed;
CREATE USER oed_test WITH NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD 'oedTestOnly';
DROP DATABASE IF EXISTS oed_testing;
CREATE DATABASE oed_testing WITH OWNER oed_test;

REVOKE CONNECT ON DATABASE oed FROM PUBLIC;
GRANT CONNECT ON DATABASE oed TO oed;

ALTER ROLE oed SUPERUSER;

\c oed_testing
CREATE EXTENSION IF NOT EXISTS btree_gist;
