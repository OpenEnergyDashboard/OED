/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { combineReducers } from 'redux';
import meters from './meters';
import lineReadings from './lineReadings';
import barReadings from './barReadings';
import compareReadings from './compareReadings';
import groups from './groups';
import maps from './maps';
import admin from './admin';
import version from './version';
import { currentUserSlice } from './currentUser';
import unsavedWarning from './unsavedWarning';
import units from './units';
import conversions from './conversions';
import { optionsSlice } from './options';
import { baseApi } from '../redux/api/baseApi';
import { graphSlice } from './graph';


export default combineReducers({
	meters,
	readings: combineReducers({
		line: lineReadings,
		bar: barReadings,
		compare: compareReadings
	}),
	// graph,
	graph: graphSlice.reducer,
	maps,
	groups,
	admin,
	version,
	currentUser: currentUserSlice.reducer,
	unsavedWarning,
	units,
	conversions,
	options: optionsSlice.reducer,
	// RTK Query's Derived Reducers
	[baseApi.reducerPath]: baseApi.reducer
});
