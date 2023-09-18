/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { UnsavedWarningState } from '../types/redux/unsavedWarning';
import { any } from 'prop-types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const defaultState: UnsavedWarningState = {
	hasUnsavedChanges: false,
	isLogOutClicked: false,
	removeFunction: () => any,
	submitFunction: () => any
};

export const unsavedWarningSlice = createSlice({
	name: 'unsavedWarning',
	initialState: defaultState,
	reducers: {
		// 	case ActionType.UpdateUnsavedChanges:
		// 		return {
		// 			...state,
		// 			hasUnsavedChanges: true,
		// 			removeFunction: action.removeFunction,
		// 			submitFunction: action.submitFunction
		// 		}
		updateUnsavedChanges: (state, action: PayloadAction<{ removeFunction: any, submitFunction: any }>) => {
			state.hasUnsavedChanges = true;
			state.removeFunction = action.payload.removeFunction;
			state.submitFunction = action.payload.submitFunction;
		},
		// 	case ActionType.RemoveUnsavedChanges:
		// 		return {
		// 			...state,
		// 			hasUnsavedChanges: false
		// 		}
		removeUnsavedChanges: state => {
			state.hasUnsavedChanges = false;
		},
		// 	case ActionType.FlipLogOutState:
		// 		return {
		// 			...state,
		// 			isLogOutClicked: !state.isLogOutClicked
		// 		}
		flipLogOutState: state => {
			state.isLogOutClicked = !state.isLogOutClicked;
		}

	}
}
);

// export default function unsavedWarning(state = defaultState, action: UnsavedWarningAction) {
// 	switch (action.type) {
// 		case ActionType.UpdateUnsavedChanges:
// 			return {
// 				...state,
// 				hasUnsavedChanges: true,
// 				removeFunction: action.removeFunction,
// 				submitFunction: action.submitFunction
// 			}
// 		case ActionType.RemoveUnsavedChanges:
// 			return {
// 				...state,
// 				hasUnsavedChanges: false
// 			}
// 		case ActionType.FlipLogOutState:
// 			return {
// 				...state,
// 				isLogOutClicked: !state.isLogOutClicked
// 			}
// 		default:
// 			return state;
// 	}
// }