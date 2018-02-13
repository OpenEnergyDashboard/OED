/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import _ from 'lodash';
import { connect } from 'react-redux';
import UIOptionsComponent from '../components/UIOptionsComponent';
import {
	changeSelectedMeters,
	changeBarDuration,
	changeBarStacking,
	changeChartToRender,
	changeCompareTimeInterval } from '../actions/graph';

/**
 * @param {State} state
 * @return {{meterInfo: *, selectedMeters: Array}}
 */
function mapStateToProps(state) {
	const sortedMeters = _.sortBy(_.values(state.meters.byMeterID).map(meter => ({ id: meter.id, name: meter.name.trim() })), 'name');
	return {
		meters: sortedMeters,
		selectedMeters: state.graph.selectedMeters.map(meterID => (
			{
				label: state.meters.byMeterID[meterID] ? state.meters.byMeterID[meterID].name : '',
				value: meterID
			}
		)),
		chartToRender: state.graph.chartToRender,
		barDuration: state.graph.barDuration,
		barStacking: state.graph.barStacking,
		compareInterval: state.graph.compareTimeInterval
	};
}

function mapDispatchToProps(dispatch) {
	return {
		selectMeters: newSelectedMeterIDs => dispatch(changeSelectedMeters(newSelectedMeterIDs)),
		changeDuration: barDuration => dispatch(changeBarDuration(barDuration)),
		changeChartType: chartType => dispatch(changeChartToRender(chartType)),
		changeCompareInterval: (compareInterval, compareDuration) => dispatch(changeCompareTimeInterval(compareInterval, compareDuration)),
		changeBarStacking: () => dispatch(changeBarStacking())
	};
}

/**
 * Connects changes to the Redux store to UIOptionsComponent via mapStateToProps
 */
export default connect(mapStateToProps, mapDispatchToProps)(UIOptionsComponent);
