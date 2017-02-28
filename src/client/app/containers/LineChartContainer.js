/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { connect } from 'react-redux';
import ReduxLineChartComponent from '../components/LineChartComponent';
import { fetchReadingsIfNeeded, fetchNeededReadings } from '../actions/readings';

/**
 * @param {State} state
 */
function mapStateToProps(state) {
	const timeInterval = state.graph.timeInterval;
	const series = {};
	const notLoadedMeters = [];
	let isLoading = false;

	for (const meterID of state.graph.selectedMeters) {
		if (state.readings.byMeterID[meterID][timeInterval] === undefined || state.readings.byMeterID[meterID][timeInterval].isFetching) {
			isLoading = true;
			if (state.readings.byMeterID[meterID][timeInterval] === undefined) {
				notLoadedMeters.push(meterID);
			}
		} else {
			series[meterID] = { name: state.meters.byMeterID[meterID].name, data: state.readings.byMeterID[meterID][timeInterval].readings };
		}
	}
	return {
		isLoading,
		series,
		notLoadedMeters,
		selectedMeters: state.graph.selectedMeters,
		timeInterval
	};
}

function mapDispatchToProps(dispatch) {
	return {
		fetchNewReadings: (meterID, timeInterval) => dispatch(fetchReadingsIfNeeded(meterID, timeInterval)),
		fetchManyNewReadings: (meterIDs, timeInterval) => dispatch(fetchNeededReadings(meterIDs, timeInterval))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(ReduxLineChartComponent);
