import { combineReducers } from 'redux';
import { meters, defaultState as defaultMetersState } from './meters';
import { readings, defaultState as defaultReadingsState } from './readings';
import { graph, defaultState as defaultGraphState } from './graph';

import * as metersActions from '../actions/meters';
import * as readingsActions from '../actions/readings';
import * as graphActions from '../actions/graph';

/**
 * @typedef {Object} State
 * @property {State~Meters} meters
 * @property {State~Readings} readings
 * @property {State~Graph} graph
 */

/**
 * @param {State} state
 * @param action
 * @return {State}
 */
export default combineReducers({ meters, readings, graph });
