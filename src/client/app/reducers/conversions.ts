/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { conversionsApi } from '../redux/api/conversionsApi';
import * as t from '../types/redux/conversions';
import { ConversionsState } from '../types/redux/conversions';

const defaultState: ConversionsState = {
	hasBeenFetchedOnce: false,
	isFetching: false,
	selectedConversions: [],
	submitting: [],
	conversions: []
};


export const conversionsSlice = createSlice({
	name: 'conversions',
	initialState: defaultState,
	reducers: {
		conversionsFetchedOnce: state => {
			state.hasBeenFetchedOnce = true;
		},
		requestConversionsDetails: state => {
			state.isFetching = true;
		},
		receiveConversionsDetails: (state, action: PayloadAction<t.ConversionData[]>) => {
			state.isFetching = false;
			state.conversions = action.payload;
		},
		changeDisplayedConversions: (state, action: PayloadAction<number[]>) => {
			state.selectedConversions = action.payload;
		},
		submitEditedConversion: (state, action: PayloadAction<t.ConversionData>) => {
			state.submitting.push(action.payload);
		},
		confirmEditedConversion: (state, action: PayloadAction<t.ConversionData>) => {
			// Overwrite the conversion data at the edited conversion's index with the edited conversion's conversion data
			// The passed in id should be correct as it is inherited from the pre-edited conversion
			// See EditConversionModalComponent line 134 for details (starts with if(conversionHasChanges))
			const conversions = state.conversions;
			const conversionDataIndex = conversions.findIndex(conversionData => (
				conversionData.sourceId === action.payload.sourceId
				&&
				conversionData.destinationId === action.payload.destinationId
			));
			conversions[conversionDataIndex] = action.payload;
		},
		deleteSubmittedConversion: (state, action: PayloadAction<t.ConversionData>) => {
			// Remove the current submitting conversion from the submitting state
			const submitting = state.submitting;
			// Search the array of ConversionData in submitting for an object with source/destination ids matching that of the action payload
			const conversionDataIndex = submitting.findIndex(conversionData => (
				conversionData.sourceId === action.payload.sourceId
				&&
				conversionData.destinationId === action.payload.destinationId
			));
			// Remove the object from the submitting array
			submitting.splice(conversionDataIndex, 1);
		},
		deleteConversion: (state, action: PayloadAction<t.ConversionData>) => {
			// Retrieve conversions state
			const conversions = state.conversions;
			// Search the array of ConversionData in conversions for an object with source/destination ids matching that of the action payload
			const conversionDataIndex = conversions.findIndex(conversionData => (
				conversionData.sourceId === action.payload.sourceId
				&&
				conversionData.destinationId === action.payload.destinationId
			));
			// Remove the ConversionData from the conversions array
			conversions.splice(conversionDataIndex, 1);
		}
	},
	extraReducers: builder => {
		builder.addMatcher(conversionsApi.endpoints.getConversionsDetails.matchFulfilled,
			(state, action) => {
				state.conversions = action.payload
			})
	}
});