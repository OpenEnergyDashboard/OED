/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import _ from 'lodash';
import { connect } from 'react-redux';
import ExportComponent from '../components/ExportComponent';
import { changeSelectedMeters } from '../actions/graph';
import { fetchMetersDataIfNeeded } from '../actions/meters';

/**
 * @param {State} state
 * @return {{meterInfo: *, selectedMeters: Array}}
 */
function mapStateToProps(state) {
	const sortedMeters = _.sortBy(_.values(state.meters.byMeterID).map(meter => ({ id: meter.id, name: meter.name.trim() })), 'name');

	const timeInterval = state.graph.timeInterval;
	const data = { datasets: [] };
	for (const meterID of state.graph.selectedMeters) {
		const readingsData = state.readings.byMeterID[meterID][timeInterval];
		if (readingsData !== undefined && !readingsData.isFetching) {
			data.datasets.push({
				label: state.meters.byMeterID[meterID].name,
				id: state.meters.byMeterID[meterID].id,
				timestamp: state.readings.byMeterID[meterID][timeInterval].start_timestamp,
				exportVals: state.readings.byMeterID[meterID][timeInterval].readings.map(arr => ({ x: arr[0], y: arr[1] }))
			});
		}
	}
	return {
		meters: sortedMeters,
		selectedMeters: state.graph.selectedMeters,
		exportVals: data
	};
}

function mapDispatchToProps(dispatch) {
	return {
		selectMeters: newSelectedMeterIDs => dispatch(changeSelectedMeters(newSelectedMeterIDs)),
		fetchMetersDataIfNeeded: () => dispatch(fetchMetersDataIfNeeded())
	};
}

/**
 * Connects changes to the Redux store to UIOptionsComponent via mapStateToProps
 */
export default connect(mapStateToProps, mapDispatchToProps)(ExportComponent);
