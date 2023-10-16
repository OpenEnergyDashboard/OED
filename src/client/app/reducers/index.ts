/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { combineReducers } from 'redux';
import meters from './meters';
import lineReadings from './lineReadings';
import barReadings from './barReadings';
import compareReadings from './compareReadings';
import graph from './graph';
import groups from './groups';
import maps from './maps';
import admin from './admin';
import version from './version';
import currentUser from './currentUser';
import unsavedWarning from './unsavedWarning';
import units from './units';
import conversions from './conversions';
import options from './options';


export default combineReducers({
	meters,
	readings: combineReducers({
		line: lineReadings,
		bar: barReadings,
		compare: compareReadings
	}),
	graph,
	maps,
	groups,
	admin,
	version,
	currentUser,
	unsavedWarning,
	units,
	conversions,
	options
});
