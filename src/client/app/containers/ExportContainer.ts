/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import * as moment from 'moment';
import ExportComponent from '../components/ExportComponent';
import { chartTypes } from '../reducers/graph';

interface ExportDataSet {
	label: string;
	id: number;
	timestamp: moment.Moment;
	currentChart: chartTypes;
	exportVals: Array<{x: number, y: number}>;
}

/**
 * @param {State} state
 * @return {{meterInfo: *, selectedMeters: Array}}
 */
function mapStateToProps(state) {
	const timeInterval = state.graph.timeInterval;
	const datasets: ExportDataSet[] = [];
	const chart = state.graph.chartToRender;
	const barDuration = state.graph.barDuration;

	if (chart === chartTypes.line) {
		for (const groupID of state.graph.selectedGroups) {
			const byGroupID = state.readings.line.byGroupID[groupID];
			if (byGroupID !== undefined) {
				const readingsData = byGroupID[timeInterval];
				if (readingsData !== undefined && !readingsData.isFetching) {
					datasets.push({
						label: state.groups.byGroupID[groupID].name,
						id: state.groups.byGroupID[groupID].id,
						timestamp: readingsData.start_timestamp,
						currentChart: chart,
						exportVals: readingsData.readings.map(arr => ({ x: arr[0], y: arr[1] }))
					});
				}
			}
		}
		for (const meterID of state.graph.selectedMeters) {
			const byMeterID = state.readings.line.byMeterID[meterID];
			if (byMeterID !== undefined) {
				const readingsData = byMeterID[timeInterval];
				if (readingsData !== undefined && !readingsData.isFetching) {
					datasets.push({
						label: state.meters.byMeterID[meterID].name,
						id: state.meters.byMeterID[meterID].id,
						timestamp: readingsData.start_timestamp,
						currentChart: chart,
						exportVals: readingsData.readings.map(arr => ({ x: arr[0], y: arr[1] }))
					});
				}
			}
		}
	} else if (chart === chartTypes.bar) {
		for (const groupID of state.graph.selectedGroups) {
			const byGroupID = state.readings.bar.byGroupID[groupID];
			if (byGroupID !== undefined) {
				const byTimeInterval = byGroupID[timeInterval];
				if (byTimeInterval !== undefined) {
					const readingsData = byTimeInterval[barDuration];
					if (readingsData !== undefined && !readingsData.isFetching) {
						datasets.push({
							label: state.groups.byGroupID[groupID].name,
							id: state.groups.byGroupID[groupID].id,
							timestamp: readingsData.start_timestamp,
							currentChart: chart,
							exportVals: readingsData.readings.map(arr => ({ x: arr[0], y: arr[1] }))
						});
					}
				}
			}
		}
		for (const meterID of state.graph.selectedMeters) {
			const byMeterID = state.readings.bar.byMeterID[meterID];
			if (byMeterID !== undefined) {
				const byTimeInterval = byMeterID[timeInterval];
				if (byTimeInterval !== undefined) {
					const readingsData = byTimeInterval[barDuration];
					if (readingsData !== undefined && !readingsData.isFetching) {
						datasets.push({
							label: state.meters.byMeterID[meterID].name,
							id: state.meters.byMeterID[meterID].id,
							timestamp: readingsData.start_timestamp,
							currentChart: chart,
							exportVals: readingsData.readings.map(arr => ({ x: arr[0], y: arr[1] }))
						});
					}
				}
			}
		}
	}

	return {
		selectedMeters: state.graph.selectedMeters,
		exportVals: { datasets }
	};
}

/**
 * Connects changes to the Redux store to UIOptionsComponent via mapStateToProps
 */
export default connect(mapStateToProps)(ExportComponent);
