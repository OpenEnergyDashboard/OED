/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { combineReducers } from 'redux';
import meters from './meters';
import lineReadings from './lineReadings';
import barReadings from './barReadings';
import graph from './graph';
import groups from './groups';
import notifications from './notifications';

import { BarReadingsState } from './barReadings';
import { LineReadingsState } from './lineReadings';
import { GraphState } from './graph';
import { GroupsState } from './groups';
import { MetersState } from './meters';
import { NotificationsState } from './notifications';

/**
 * @typedef {Object} State
 * @property {State~Meters} meters
 * @property {State~LineReadings} lineReadings
 * @property {State~BarReadings} barReadings
 * @property {State~Graph} graph
 * @property {State~Groups} groups
 * @property {State~Notifications} notifications
 */

export interface State {
	meters: MetersState;
	readings: {
		line: LineReadingsState;
		bar: BarReadingsState;
	};
	graph: GraphState;
	groups: GroupsState;
	notifications: NotificationsState;
}

/**
 * @param {State} state
 * @param action
 * @return {State}
 */
export default combineReducers({ meters, readings: combineReducers({ line: lineReadings, bar: barReadings }), graph, groups, notifications });
