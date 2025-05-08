/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 const express = require('express') /* needed to resolve types in JSDoc comments */

 const DOMPurify = require('../utils/sanitizer');
 
 /**
  * Inform the client of a success (200 OK) with sanitized HTML content.
  *
  * @param {express.Request} req - The Express request object.
  * @param {express.Response} res - The Express response object.
  * @param {string} comment - Any additional data to be returned to the client.
  */
 function success(req, res, comment = '') {
    const safeComment = DOMPurify.sanitize(comment); 
    res.status(200).send(`<h1>SUCCESS</h1>${safeComment}`);
 }
 
 
 /**
  * Inform the client of a failure (400 OK) with sanitized HTML content.
  *
  * @param {express.Request} req - The Express request object.
  * @param {express.Response} res - The Express response object.
  * @param {string} comment - Any additional data to be returned to the client.
  */
 function failure(req, res, comment = '') {
    const safeComment = DOMPurify.sanitize(comment); 
    res.status(400).send(`<h1>FAILURE</h1>${safeComment}`);
 }
 
 
 module.exports = { success, failure };
 
 
 