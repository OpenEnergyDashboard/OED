/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import * as _ from 'lodash';
import ExportComponent from '../components/ExportComponent';
import { ChartTypes } from '../types/redux/graph';
import { BarReading, LineReading, ExportDataSet } from '../types/readings';
import { State } from '../types/redux/state';

function transformLineReadingToLegacy(reading: LineReading): [number, number, number] {
	return [reading.startTimestamp, reading.reading, reading.endTimestamp];
}

function transformBarReadingToLegacy(reading: BarReading): [number, number, number] {
	return [reading.startTimestamp, reading.reading, reading.endTimestamp];
}

/**
 * @param {State} state
 * @return {{meterInfo: *, selectedMeters: Array}}
 */
function mapStateToProps(state: State) {
	const timeInterval = state.graph.timeInterval;
	const unitID = state.graph.selectedUnit;//convert ID to name below when you return the unit
	const datasets: ExportDataSet[] = [];
	const chart = state.graph.chartToRender;
	const barDuration = state.graph.barDuration;

	if (chart === ChartTypes.line) {
		for (const groupID of state.graph.selectedGroups) {
			const byGroupID = state.readings.line.byGroupID[groupID];
			if (byGroupID !== undefined) {
				const readingsData = byGroupID[timeInterval.toString()][unitID];
				if (readingsData !== undefined && !readingsData.isFetching) {
					const label = state.groups.byGroupID[groupID].name;
					if (readingsData.readings === undefined) {
						throw new Error('Unacceptable condition: readingsData.readings is undefined.');
					}

					const dataPoints: Array<{ x: number, y: number, z: number }> = _.values(readingsData.readings)
						.map(transformLineReadingToLegacy)
						.map((v: [number, number, number]) => ({ x: v[0], y: v[1], z: v[2] })
						);
					datasets.push({
						label,
						id: state.groups.byGroupID[groupID].id,
						currentChart: chart,
						exportVals: dataPoints,
						unit: unitID
					});
				}
			}
		}
		for (const meterID of state.graph.selectedMeters) {
			const byMeterID = state.readings.line.byMeterID[meterID];
			if (byMeterID !== undefined) {
				const readingsData = byMeterID[timeInterval.toString()][unitID];
				if (readingsData !== undefined && !readingsData.isFetching) {
					const label = state.meters.byMeterID[meterID].name;
					if (readingsData.readings === undefined) {
						throw new Error('Unacceptable condition: readingsData.readings is undefined.');
					}

					const dataPoints: Array<{ x: number, y: number, z: number }> = _.values(readingsData.readings)
						.map(transformLineReadingToLegacy)
						.map(
							(v: [number, number, number]) => ({ x: v[0], y: v[1], z: v[2] })
						);
					datasets.push({
						label,
						id: state.meters.byMeterID[meterID].id,
						currentChart: chart,
						exportVals: dataPoints,
						unit: unitID
					});
				}
			}
		}
	} else if (chart === ChartTypes.bar) {
		for (const groupID of state.graph.selectedGroups) {
			const byGroupID = state.readings.bar.byGroupID[groupID];
			if (byGroupID !== undefined) {
				const byTimeInterval = byGroupID[timeInterval.toString()];
				if (byTimeInterval !== undefined) {
					const byBarDuration = byTimeInterval[barDuration.toISOString()];
					if (byBarDuration !== undefined) {
						const readingsData = byBarDuration[unitID];
						if (readingsData !== undefined && !readingsData.isFetching) {
							const label = state.groups.byGroupID[groupID].name;
							if (readingsData.readings === undefined) {
								throw new Error('Unacceptable condition: readingsData.readings is undefined.');
							}

							/* tslint:disable:array-type */
							const dataPoints: Array<{ x: number, y: number, z: number }> = _.values(readingsData.readings)
								.map(transformBarReadingToLegacy)
								.map((v: [number, number, number]) => ({ x: v[0], y: v[1], z: v[2] })
								);
							/* tslint:enable:array-type */
							datasets.push({
								label,
								id: state.groups.byGroupID[groupID].id,
								currentChart: chart,
								exportVals: dataPoints,
								unit: unitID
							});
						}
					}
				}
			}
		}
		for (const meterID of state.graph.selectedMeters) {
			const byMeterID = state.readings.bar.byMeterID[meterID];
			if (byMeterID !== undefined) {
				const byTimeInterval = byMeterID[timeInterval.toString()];
				if (byTimeInterval !== undefined) {
					const byBarDuration = byTimeInterval[barDuration.toISOString()];
					if (byBarDuration !== undefined) {
						const readingsData = byBarDuration[unitID];
						if (readingsData !== undefined && !readingsData.isFetching) {
							const label = state.meters.byMeterID[meterID].name;
							if (readingsData.readings === undefined) {
								throw new Error('Unacceptable condition: readingsData.readings is undefined.');
							}

							/* tslint:disable:array-type */
							const dataPoints: Array<{ x: number, y: number, z: number }> = _.values(readingsData.readings)
								.map(transformBarReadingToLegacy)
								.map((v: [number, number, number]) => ({ x: v[0], y: v[1], z: v[2] })
								);
							/* tslint:enable:array-type */
							datasets.push({
								label,
								id: state.meters.byMeterID[meterID].id,
								currentChart: chart,
								exportVals: dataPoints,
								unit: unitID
							});
						}
					}
				}
			}
		}
	}

	return {
		showRawExport: state.graph.chartToRender === 'line' ? true : false,
		selectedMeters: state.graph.selectedMeters,
		selectedGroups: state.graph.selectedGroups,
		exportVals: { datasets },
		unit: unitID,
		timeInterval: state.graph.timeInterval,
		defaultLanguage: state.admin.defaultLanguage,
		defaultWarningFileSize: state.admin.defaultWarningFileSize,
		defaultFileSizeLimit: state.admin.defaultFileSizeLimit
	};
}

/**
 * Connects changes to the Redux store to UIOptionsComponent via mapStateToProps
 */
export default connect(mapStateToProps)(ExportComponent);
