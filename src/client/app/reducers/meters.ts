/* eslint-disable */
//@ts-nocheck
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import * as _ from 'lodash';
import { metersApi } from '../redux/api/metersApi';
import * as t from '../types/redux/meters';
import { MetersState } from '../types/redux/meters';
import { durationFormat } from '../utils/durationFormat';

const defaultState: MetersState = {
	hasBeenFetchedOnce: false,
	isFetching: false,
	byMeterID: {},
	submitting: []
};


export const metersSlice = createSlice({
	name: 'meters',
	initialState: defaultState,
	reducers: {
		confirmMetersFetchedOnce: state => {
			state.hasBeenFetchedOnce = true;
		},
		requestMetersDetails: state => {
			state.isFetching = true;
		},
		receiveMetersDetails: (state, action: PayloadAction<t.MeterData[]>) => {
			state.isFetching = false;
			state.byMeterID = _.keyBy(action.payload, meter => meter.id);
		},
		submitEditedMeter: (state, action: PayloadAction<number>) => {
			state.submitting.push(action.payload);
		},
		confirmEditedMeter: (state, action: PayloadAction<t.MeterData>) => {
			action.payload.readingFrequency = durationFormat(action.payload.readingFrequency);
			state.byMeterID[action.payload.id] = action.payload;
		},
		confirmAddMeter: (state, action: PayloadAction<t.MeterData>) => {
			action.payload.readingFrequency = durationFormat(action.payload.readingFrequency);
			state.byMeterID[action.payload.id] = action.payload;
		},
		deleteSubmittedMeter: (state, action: PayloadAction<number>) => {
			state.submitting.splice(state.submitting.indexOf(action.payload));
		}
	},
	extraReducers: builder => {
		builder.addMatcher(
			metersApi.endpoints.getMeters.matchFulfilled,
			(state, { payload }) => {
				state.byMeterID = payload
			}
		)
	},
	selectors: {
		selectMeterState: state => state

	}
});
