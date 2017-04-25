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
	for (const meterID of state.graph.selectedMeters) {
		const readingsData = state.readings.line.byMeterID[meterID][timeInterval];
		if (readingsData !== undefined && !readingsData.isFetching) {
			data.datasets.push({
				label: state.meters.byMeterID[meterID].name,
				id: state.meters.byMeterID[meterID].id,
				timestamp: state.readings.line.byMeterID[meterID][timeInterval].start_timestamp,
				exportVals: state.readings.line.byMeterID[meterID][timeInterval].readings.map(arr => ({ x: arr[0], y: arr[1] }))
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
