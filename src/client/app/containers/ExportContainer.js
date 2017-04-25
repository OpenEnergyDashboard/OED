/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import ExportComponent from '../components/ExportComponent';

/**
 * @param {State} state
 * @return {{meterInfo: *, selectedMeters: Array}}
 */
function mapStateToProps(state) {
	const timeInterval = state.graph.timeInterval;
	const data = { datasets: [] };
	let readingsData;
	const chart = state.graph.chartToRender;
	const barDuration = state.graph.barDuration;

	for (const meterID of state.graph.selectedMeters) {
		if (chart === 'line') {
			readingsData = state.readings.line.byMeterID[meterID][timeInterval];
		}		else { readingsData = state.readings.bar.byMeterID[meterID][timeInterval][barDuration]; }
		if (readingsData !== undefined && !readingsData.isFetching && chart === 'line') {
			data.datasets.push({
				label: state.meters.byMeterID[meterID].name,
				id: state.meters.byMeterID[meterID].id,
				timestamp: state.readings.line.byMeterID[meterID][timeInterval].start_timestamp,
				exportVals: state.readings.line.byMeterID[meterID][timeInterval].readings.map(arr => ({ x: arr[0], y: arr[1] }))
			});
		} else if (readingsData !== undefined && !readingsData.isFetching && chart === 'bar') {
			data.datasets.push({
				label: state.meters.byMeterID[meterID].name,
				id: state.meters.byMeterID[meterID].id,
				timestamp: state.readings.bar.byMeterID[meterID][timeInterval][barDuration].timestamp,
				exportVals: state.readings.bar.byMeterID[meterID][timeInterval][barDuration].readings.map(arr => ({ x: arr[0], y: arr[1] }))
			});
		}
	}
	return {
		selectedMeters: state.graph.selectedMeters,
		exportVals: data
	};
}

/**
 * Connects changes to the Redux store to UIOptionsComponent via mapStateToProps
 */
export default connect(mapStateToProps)(ExportComponent);
