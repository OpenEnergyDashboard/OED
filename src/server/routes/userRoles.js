/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const jwt = require('jsonwebtoken');
const roles = require('../models/User').role;

/** Checks if a token has the authorization capabilities as the requested role. */
function isTokenAuthorized(token, requestedRole){
    const payload = jwt.decode(token);
    const { role } = payload;
    if (role === roles.ADMIN){
        return true;
    } else {
        return role === requestedRole; 
    }
}

module.exports = {
    isTokenAuthorized
}