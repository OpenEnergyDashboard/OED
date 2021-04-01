/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import * as _ from 'lodash';
import ExportComponent from '../components/ExportComponent';
import { ChartTypes } from '../types/redux/graph';
import { ExportDataSet } from '../types/readings';
import { State } from '../types/redux/state';
import { CompressedBarReading, CompressedLineReading } from '../types/compressed-readings';


function transformLineReadingToLegacy(reading: CompressedLineReading): [number, number] {
	return [reading.startTimestamp, reading.reading];
}

function transformBarReadingToLegacy(reading: CompressedBarReading): [number, number] {
	return [reading.startTimestamp, reading.reading];
}

/**
 * @param {State} state
 * @return {{meterInfo: *, selectedMeters: Array}}
 */
function mapStateToProps(state: State) {
	const timeInterval = state.graph.timeInterval;
	const datasets: ExportDataSet[] = [];
	const chart = state.graph.chartToRender;
	const barDuration = state.graph.barDuration;

	if (chart === ChartTypes.line) {
		for (const groupID of state.graph.selectedGroups) {
			const byGroupID = state.readings.line.byGroupID[groupID];
			if (byGroupID !== undefined) {
				const readingsData = byGroupID[timeInterval.toString()];
				if (readingsData !== undefined && !readingsData.isFetching) {
					const label = state.groups.byGroupID[groupID].name;
					if (readingsData.readings === undefined) {
						throw new Error('Unacceptable condition: readingsData.readings is undefined.');
					}

					/* tslint:disable:array-type */
					const dataPoints: Array<{ x: number, y: number }> = _.values(readingsData.readings)
						.map(transformLineReadingToLegacy)
						.map((v: [number, number]) => ({ x: v[0], y: v[1] })
						);
					/* tslint:enable:array-type */
					datasets.push({
						label,
						id: state.groups.byGroupID[groupID].id,
						currentChart: chart,
						exportVals: dataPoints
					});
				}
			}
		}
		for (const meterID of state.graph.selectedMeters) {
			const byMeterID = state.readings.line.byMeterID[meterID];
			if (byMeterID !== undefined) {
				const readingsData = byMeterID[timeInterval.toString()];
				if (readingsData !== undefined && !readingsData.isFetching) {
					const label = state.meters.byMeterID[meterID].name;
					if (readingsData.readings === undefined) {
						throw new Error('Unacceptable condition: readingsData.readings is undefined.');
					}

					/* tslint:disable:array-type */
					const dataPoints: Array<{ x: number, y: number }> = _.values(readingsData.readings)
						.map(transformLineReadingToLegacy)
						.map(
							(v: [number, number]) => ({ x: v[0], y: v[1] })
						);
					/* tslint:enable:array-type */
					datasets.push({
						label,
						id: state.meters.byMeterID[meterID].id,
						currentChart: chart,
						exportVals: dataPoints
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
					const readingsData = byTimeInterval[barDuration.toISOString()];
					if (readingsData !== undefined && !readingsData.isFetching) {
						const label = state.groups.byGroupID[groupID].name;
						if (readingsData.readings === undefined) {
							throw new Error('Unacceptable condition: readingsData.readings is undefined.');
						}

						/* tslint:disable:array-type */
						const dataPoints: Array<{ x: number, y: number }> = _.values(readingsData.readings)
							.map(transformBarReadingToLegacy)
							.map((v: [number, number]) => ({ x: v[0], y: v[1] })
							);
						/* tslint:enable:array-type */
						datasets.push({
							label,
							id: state.groups.byGroupID[groupID].id,
							currentChart: chart,
							exportVals: dataPoints
						});
					}
				}
			}
		}
		for (const meterID of state.graph.selectedMeters) {
			const byMeterID = state.readings.bar.byMeterID[meterID];
			if (byMeterID !== undefined) {
				const byTimeInterval = byMeterID[timeInterval.toString()];
				if (byTimeInterval !== undefined) {
					const readingsData = byTimeInterval[barDuration.toISOString()];
					if (readingsData !== undefined && !readingsData.isFetching) {
						const label = state.meters.byMeterID[meterID].name;
						if (readingsData.readings === undefined) {
							throw new Error('Unacceptable condition: readingsData.readings is undefined.');
						}

						/* tslint:disable:array-type */
						const dataPoints: Array<{ x: number, y: number }> = _.values(readingsData.readings)
							.map(transformBarReadingToLegacy)
							.map((v: [number, number]) => ({ x: v[0], y: v[1] })
							);
						/* tslint:enable:array-type */
						datasets.push({
							label,
							id: state.meters.byMeterID[meterID].id,
							currentChart: chart,
							exportVals: dataPoints
						});
					}
				}
			}
		}
	}

	return {
		showRawExport:state.graph.chartToRender==='line'?true:false,
		selectedMeters: state.graph.selectedMeters,
		selectedGroups: state.graph.selectedGroups,
		exportVals: { datasets },
		timeInterval: state.graph.timeInterval,
		defaultLanguage: state.admin.defaultLanguage
	};
}

/**
 * Connects changes to the Redux store to UIOptionsComponent via mapStateToProps
 */
export default connect(mapStateToProps)(ExportComponent);
