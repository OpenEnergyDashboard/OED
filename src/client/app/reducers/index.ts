/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { combineReducers } from 'redux';
import barReadings from './barReadings';
import graph from './graph';
import lineReadings from './lineReadings';
import meters from './meters';
import notifications from './notifications';

/**
 * @typedef {Object} State
 * @property {State~Meters} meters
 * @property {State~LineReadings} lineReadings
 * @property {State~BarReadings} barReadings
 * @property {State~Graph} graph
 * @property {State~Notifications} notifications
 */

/**
 * @param {State} state
 * @param action
 * @return {State}
 */
export default combineReducers({ meters, readings: combineReducers({ line: lineReadings, bar: barReadings }), graph, notifications });
