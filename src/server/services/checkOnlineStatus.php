/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

// This script checks whether the server is online or not using PHP
// See below for editing for your site

<?php
	// edit the next line for the URL you want to check
	$host = 'YOUR SITE URL';
	if($socket = @fsockopen($host, 80, $errno, $errstr, 30)) {
		echo '<script type="text/javascript">
			const { log } = require("../log");
			log.info("The server is still alive");
			</script>';
		fclose($socket);
	} else {
		echo '<script type="text/javascript">
			const { log } = require("../log");
			log.error("The server is down + ' ;
			echo $errstr;
		echo '")</script>;';
	}
?>
