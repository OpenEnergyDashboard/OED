/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { combineReducers } from 'redux';
import meters from './meters';
import lineReadings from './lineReadings';
import barReadings from './barReadings';
import graph from './graph';
import groups from './groups';
import notifications from './notifications';
import admin from './admin';


export default combineReducers({
	meters,
	readings: combineReducers({
		line: lineReadings,
		bar: barReadings
	}),
	graph,
	groups,
	notifications,
	admin
});
