/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

<?php
	$host = 'oed.beloit.edu:3040';
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