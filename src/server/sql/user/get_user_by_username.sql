/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This exposes the encrypted password so should only be used on
   server code and never returned to the client */

SELECT id, username, password_hash, role, note FROM users WHERE username=${username};
