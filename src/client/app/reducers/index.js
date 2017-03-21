/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { combineReducers } from 'redux';
import meters from './meters';
import readings from './readings';
import graph from './graph';
import groups from './groups';

/**
 * @typedef {Object} State
 * @property {State~Meters} meters
 * @property {State~Readings} readings
 * @property {State~Graph} graph
 * @property {State~Groups} groups
 */

/**
 * @param {State} state
 * @param action
 * @return {State}
 */
export default combineReducers({ meters, readings, graph, groups });
