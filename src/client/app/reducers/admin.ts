/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as adminActions from '../actions/admin';
import { chartTypes } from './graph';
import { ActionType } from '../types/redux';

export interface AdminState {
	displayTitle: string;
	defaultChartToRender: chartTypes;
	defaultBarStacking: boolean;
	isFetching: boolean;
	submitted: boolean;
}

const defaultState: AdminState = {
	displayTitle: '',
	defaultChartToRender: chartTypes.line,
	defaultBarStacking: false,
	isFetching: false,
	submitted: true
};

export default function admin(state = defaultState, action: adminActions.AdminAction) {
	switch (action.type) {
		case ActionType.UpdateDisplayTitle:
			return {
				...state,
				displayTitle: action.displayTitle,
				submitted: false
			};
		case ActionType.UpdateDefaultChartToRender:
			return {
				...state,
				defaultChartToRender: action.defaultChartToRender,
				submitted: false
			};
		case ActionType.ToggleDefaultBarStacking:
			return {
				...state,
				defaultBarStacking: !state.defaultBarStacking,
				submitted: false
			};
		case ActionType.RequestPreferences:
			return {
				...state,
				isFetching: true
			};
		case ActionType.ReceivePreferences:
			return {
				...state,
				isFetching: false,
				displayTitle: action.data.displayTitle,
				defaultChartToRender: action.data.defaultChartToRender,
				defaultBarStacking: action.data.defaultBarStacking
			};
		case ActionType.MarkPreferencesNotSubmitted:
			return {
				...state,
				submitted: false
			};
		case ActionType.MarkPreferencesSubmitted:
			return {
				...state,
				submitted: true
			};
		default:
			return state;
	}
}
