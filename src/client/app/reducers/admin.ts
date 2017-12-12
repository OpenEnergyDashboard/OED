/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as adminActions from '../actions/admin';
import { chartTypes } from './graph';

export interface AdminState {
	displayTitle: string,
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
		case adminActions.UPDATE_DISPLAY_TITLE:
			return {
				...state,
				displayTitle: action.displayTitle,
				submitted: false
			};
		case adminActions.UPDATE_DEFAULT_CHART_TO_RENDER:
			return {
				...state,
				defaultChartToRender: action.defaultChartToRender,
				submitted: false,
			};
		case adminActions.TOGGLE_DEFAULT_BAR_STACKING:
			return {
				...state,
				defaultBarStacking: !state.defaultBarStacking,
				submitted: false
			};
		case adminActions.REQUEST_PREFERENCES:
			return {
				...state,
				isFetching: true
			};
		case adminActions.RECEIVE_PREFERENCES:
			return {
				...state,
				isFetching: false,
				displayTitle: action.data.displayTitle,
				defaultChartToRender: action.data.defaultChartToRender,
				defaultBarStacking: action.data.defaultBarStacking
			};
		case adminActions.MARK_PREFERENCES_SUBMITTED:
			return {
				...state,
				submitted: true
			};
		case adminActions.MARK_PREFERENCES_NOT_SUBMITTED:
			return {
				...state,
				submitted: false
			};
		default:
			return state;
	}
}
