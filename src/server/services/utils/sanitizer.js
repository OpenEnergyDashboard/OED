/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

// Create jsdom window application and initialize
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

module.exports = DOMPurify;
