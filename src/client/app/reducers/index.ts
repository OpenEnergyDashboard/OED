/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { combineReducers } from 'redux';
import { metersSlice } from './meters';
import lineReadings from './lineReadings';
import barReadings from './barReadings';
import compareReadings from './compareReadings';
import { groupsSlice } from './groups';
import maps from './maps';
import { adminSlice } from './admin';
import { versionSlice } from './version';
import { currentUserSlice } from './currentUser';
import { unsavedWarningSlice } from './unsavedWarning';
import { unitsSlice } from './units';
import { conversionsSlice } from './conversions';
import { optionsSlice } from './options';
import { baseApi } from '../redux/api/baseApi';
import { graphSlice } from './graph';


export const rootReducer = combineReducers({
	meters: metersSlice.reducer,
	readings: combineReducers({
		line: lineReadings,
		bar: barReadings,
		compare: compareReadings
	}),
	graph: graphSlice.reducer,
	maps,
	groups: groupsSlice.reducer,
	admin: adminSlice.reducer,
	version: versionSlice.reducer,
	currentUser: currentUserSlice.reducer,
	unsavedWarning: unsavedWarningSlice.reducer,
	units: unitsSlice.reducer,
	conversions: conversionsSlice.reducer,
	options: optionsSlice.reducer,
	// RTK Query's Derived Reducers
	[baseApi.reducerPath]: baseApi.reducer
});
