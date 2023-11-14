/* eslint-disable */
//@ts-nocheck
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import * as _ from 'lodash';
import { unitsApi } from '../redux/api/unitsApi';
import * as t from '../types/redux/units';
import { UnitsState } from '../types/redux/units';

const defaultState: UnitsState = {
	hasBeenFetchedOnce: false,
	isFetching: false,
	selectedUnits: [],
	submitting: [],
	units: {}
};

export const unitsSlice = createSlice({
	name: 'units',
	initialState: defaultState,
	reducers: {
		confirmUnitsFetchedOnce: state => {
			state.hasBeenFetchedOnce = true;
		},
		requestUnitsDetails: state => {
			state.isFetching = true;
		},
		receiveUnitsDetails: (state, action: PayloadAction<t.UnitData[]>) => {
			state.isFetching = false;
			state.units = _.keyBy(action.payload, unit => unit.id);
		},
		changeDisplayedUnits: (state, action: PayloadAction<number[]>) => {
			state.selectedUnits = action.payload;
		},
		submitEditedUnit: (state, action: PayloadAction<number>) => {
			state.submitting.push(action.payload);
		},
		confirmEditedUnit: (state, action: PayloadAction<t.UnitData>) => {
			state.units[action.payload.id] = action.payload;
		},
		confirmUnitEdits: (state, action: PayloadAction<number>) => {
			state.submitting.splice(state.submitting.indexOf(action.payload), 1);
		}
	},
	extraReducers: builder => {
		builder.addMatcher(unitsApi.endpoints.getUnitsDetails.matchFulfilled,
			(state, action) => { state.units = action.payload }
		)
	},
	selectors: {
		selectUnitsState: state => state,
		selectUnitDataById: state => state.units
	}
});
