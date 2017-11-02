/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import { connect } from 'react-redux';
import { changeBarDuration, changeBarStacking, changeChartToRender, changeSelectedMeters } from '../actions/graph';
import { fetchMetersDetailsIfNeeded } from '../actions/meters';
import UIOptionsComponent from '../components/UIOptionsComponent';

/**
 * @param {State} state
 * @return {{meterInfo: *, selectedMeters: Array}}
 */
function mapStateToProps(state) {
	const sortedMeters = _.sortBy(_.values(state.meters.byMeterID).map(meter => ({ id: meter.id, name: meter.name.trim() })), 'name');
	return {
		meters: sortedMeters,
		selectedMeters: state.graph.selectedMeters,
		chartToRender: state.graph.chartToRender
	};
}

function mapDispatchToProps(dispatch) {
	return {
		selectMeters: newSelectedMeterIDs => dispatch(changeSelectedMeters(newSelectedMeterIDs)),
		changeDuration: barDuration => dispatch(changeBarDuration(barDuration)),
		fetchMetersDetailsIfNeeded: () => dispatch(fetchMetersDetailsIfNeeded()),
		changeChartType: chartType => dispatch(changeChartToRender(chartType)),
		changeBarStacking: () => dispatch(changeBarStacking())
	};
}

/**
 * Connects changes to the Redux store to UIOptionsComponent via mapStateToProps
 */
export default connect(mapStateToProps, mapDispatchToProps)(UIOptionsComponent);
