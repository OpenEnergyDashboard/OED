/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import _ from 'lodash';
import { connect } from 'react-redux';
import UIOptionsComponent from '../components/UIOptionsComponent';
import { changeSelectedMeters, changeBarDuration } from '../actions/graph';
import { fetchMetersDataIfNeeded } from '../actions/meters';

/**
 * @param {State} state
 * @return {{meterInfo: *, selectedMeters: Array}}
 */
function mapStateToProps(state) {
	const sortedMeters = _.sortBy(_.values(state.meters.byMeterID).map(meter => ({ id: meter.id, name: meter.name.trim() })), 'name');
	return {
		meters: sortedMeters,
		selectedMeters: state.graph.selectedMeters
	};
}

function mapDispatchToProps(dispatch) {
	return {
		selectMeters: newSelectedMeterIDs => dispatch(changeSelectedMeters(newSelectedMeterIDs)),
		changeDuration: barDuration => dispatch(changeBarDuration(barDuration)),
		fetchMetersDataIfNeeded: () => dispatch(fetchMetersDataIfNeeded())
	};
}

/**
 * Connects changes to the Redux store to UIOptionsComponent via mapStateToProps
 */
export default connect(mapStateToProps, mapDispatchToProps)(UIOptionsComponent);
