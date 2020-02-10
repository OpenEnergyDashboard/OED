/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { log } = require('../log');
var script = document.createElement('script');
script.src = 'https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js';
document.body.appendChild(script);	

$.ajax({
	type: "HEAD",
	url: 'oed.beloit.edu',
	success : function() {
	    log.info('The server is still alive');
	}, error: function() {
	    log.error('The server is down');
	}
});

