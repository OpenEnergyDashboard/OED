/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ActionType } from './actions';

/*
* Defines the action interfaces used in the corresponding reducers.
*/

export interface RequestVersion {
	type: ActionType.RequestVersion;
}

export interface ReceiveVersion {
	type: ActionType.ReceiveVersion;
	data: string;
}

export type VersionAction = RequestVersion | ReceiveVersion;

export interface VersionState {
	isFetching: boolean;
	version: string;
}