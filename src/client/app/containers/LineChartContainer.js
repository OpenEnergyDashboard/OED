/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { connect } from 'react-redux';
import LineChartComponent from '../components/LineChartComponent';
import { changeGraphZoomIfNeeded } from '../actions/graph';
import TimeInterval from '../../../common/TimeInterval';

/**
 * @param {State} state
 */
function mapStateToProps(state) {
	const timeInterval = state.graph.timeInterval;
	const unboundedTimeInterval = TimeInterval.unbounded();
	const series = {};
	const navigatorSeries = {};
	let isLoading = false;

	for (const meterID of state.graph.selectedMeters) {
		if (state.readings.byMeterID[meterID][timeInterval] === undefined || state.readings.byMeterID[meterID][timeInterval].isFetching) {
			isLoading = true;
		} else {
			series[meterID] = { name: state.meters.byMeterID[meterID].name, data: state.readings.byMeterID[meterID][timeInterval].readings };
		}
		if (state.readings.byMeterID[meterID][unboundedTimeInterval] === undefined || state.readings.byMeterID[meterID][unboundedTimeInterval].isFetching) {
			isLoading = true;
		} else {
			navigatorSeries[meterID] = { name: state.meters.byMeterID[meterID].name, data: state.readings.byMeterID[meterID][unboundedTimeInterval].readings };
		}
	}
	return {
		isLoading,
		series,
		navigatorSeries,
		selectedMeters: state.graph.selectedMeters,
		timeInterval
	};
}

function mapDispatchToProps(dispatch) {
	return {
		onGraphZoomChange: timeInterval => dispatch(changeGraphZoomIfNeeded(timeInterval))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(LineChartComponent);
