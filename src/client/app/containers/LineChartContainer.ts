/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import * as moment from 'moment-timezone';
import { connect } from 'react-redux';
import getGraphColor from '../utils/getGraphColor';
import { State } from '../types/redux/state';
import Plot from 'react-plotly.js';
import { TimeInterval } from '../../../common/TimeInterval';
import Locales from '../types/locales';
import { DataType } from '../types/Datasources';
import { UnitRepresentType } from '../types/redux/units';

function mapStateToProps(state: State) {
	const timeInterval = state.graph.timeInterval;
	const unitID = state.graph.selectedUnit;
	const datasets: any[] = [];
	// The unit label depends on the unit which is in selectUnit state.
	const graphingUnit = state.graph.selectedUnit;
	let unitLabel: string = '';
	// If graphingUnit is -99 then none selected and nothing to graph so label is empty.
	// This will probably happen when the page is first loaded.
	if (graphingUnit !== -99) {
		const selectUnitState = state.units.units[state.graph.selectedUnit];
		if (selectUnitState !== undefined) {
			// Quantity and flow units have different unit labels.
			// Look up the type of unit if it is for quantity/flow/raw and decide what to do.
			// Bar graphics are always quantities.
			if (selectUnitState.unitRepresent === UnitRepresentType.quantity) {
				// If it is a quantity unit then it is a rate so indicate by dividing by the time interval
				// which is always one hour for OED.
				unitLabel = selectUnitState.identifier + ' / hour';
				// This is a special case where the automatic labeling is not the common usage so note usual in parentheses.
				if (unitLabel === 'kWh / hour') {
					unitLabel += ' (kW)';
				}
			} else if (selectUnitState.unitRepresent === UnitRepresentType.flow || selectUnitState.unitRepresent === UnitRepresentType.raw) {
				// If it is a flow meter then you are graphing the original rate unit.
				unitLabel = selectUnitState.identifier;
			}
		}
	}

	// Add all valid data from existing meters to the line plot
	for (const meterID of state.graph.selectedMeters) {
		const byMeterID = state.readings.line.byMeterID[meterID];
		if (byMeterID !== undefined) {
			const readingsData = byMeterID[timeInterval.toString()][unitID];
			if (readingsData !== undefined && !readingsData.isFetching) {
				const label = state.meters.byMeterID[meterID].name;
				const colorID = meterID;
				if (readingsData.readings === undefined) {
					throw new Error('Unacceptable condition: readingsData.readings is undefined.');
				}

				// Create two arrays for the x and y values. Fill the array with the data from the line readings
				const xData: string[] = [];
				const yData: number[] = [];
				const hoverText: string[] = [];
				const readings = _.values(readingsData.readings);
				readings.forEach(reading => {
					const st = moment(reading.startTimestamp);
					// Time reading is in the middle of the start and end timestamp
					const timeReading = st.add(moment(reading.endTimestamp).diff(st) / 2);
					xData.push(timeReading.utc().format('YYYY-MM-DD HH:mm:ss'));
					yData.push(reading.reading);
					hoverText.push(`<b> ${timeReading.format('ddd, ll LTS')} </b> <br> ${label}: ${reading.reading.toPrecision(6)} ${unitLabel}`);
				});

				// Save the timestamp range of the plot
				let minTimestamp: string = '';
				let maxTimestamp: string = '';
				if (readings.length > 0) {
					/* tslint:disable:no-string-literal */
					minTimestamp = readings[0]['startTimestamp'].toString();
					maxTimestamp = readings[readings.length - 1]['startTimestamp'].toString();
					/* tslint:enable:no-string-literal */
				}
				const root: any = document.getElementById('root');
				root.setAttribute('min-timestamp', minTimestamp);
				root.setAttribute('max-timestamp', maxTimestamp);

				// This variable contains all the elements (x and y values, line type, etc.) assigned to the data parameter of the Plotly object
				datasets.push({
					name: label,
					x: xData,
					y: yData,
					text: hoverText,
					hoverinfo: 'text',
					type: 'scatter',
					mode: 'lines',
					line: {
						shape: 'spline',
						width: 2,
						color: getGraphColor(colorID, DataType.Meter)
					}
				});
			}
		}
	}

	// TODO The meters and groups code is very similar and maybe it should be refactored out to create a function to do
	// both. This would mean future changes would automatically happen to both.
	// Add all valid data from existing groups to the line plot
	for (const groupID of state.graph.selectedGroups) {
		const byGroupID = state.readings.line.byGroupID[groupID];
		if (byGroupID !== undefined) {
			const readingsData = byGroupID[timeInterval.toString()][unitID];
			if (readingsData !== undefined && !readingsData.isFetching) {
				const label = state.groups.byGroupID[groupID].name;
				const colorID = groupID;
				if (readingsData.readings === undefined) {
					throw new Error('Unacceptable condition: readingsData.readings is undefined.');
				}

				// Create two arrays for the x and y values. Fill the array with the data from the line readings
				const xData: string[] = [];
				const yData: number[] = [];
				const hoverText: string[] = [];
				const readings = _.values(readingsData.readings);
				readings.forEach(reading => {
					const st = moment(reading.startTimestamp);
					// Time reading is in the middle of the start and end timestamp
					const timeReading = st.add(moment(reading.endTimestamp).diff(st) / 2);
					xData.push(timeReading.utc().format('YYYY-MM-DD HH:mm:ss'));
					yData.push(reading.reading);
					hoverText.push(`<b> ${timeReading.format('ddd, ll LTS')} </b> <br> ${label}: ${reading.reading.toPrecision(6)} ${unitLabel}`);
				});

				// This variable contains all the elements (x and y values, line type, etc.) assigned to the data parameter of the Plotly object
				datasets.push({
					name: label,
					x: xData,
					y: yData,
					text: hoverText,
					hoverinfo: 'text',
					type: 'scatter',
					mode: 'lines',
					line: {
						shape: 'spline',
						width: 2,
						color: getGraphColor(colorID, DataType.Group)
					}
				});
			}
		}
	}

	// Calculate slider interval if rangeSliderInterval is specified;
	const sliderInterval = state.graph.rangeSliderInterval.equals(TimeInterval.unbounded()) ? timeInterval : state.graph.rangeSliderInterval;
	const start = Date.parse(moment(sliderInterval.getStartTimestamp()).toISOString());
	const end = Date.parse(moment(sliderInterval.getEndTimestamp()).toISOString());

	// Customize the layout of the plot
	const layout: any = {
		autosize: true,
		showlegend: true,
		height: 700,
		legend: {
			x: 0,
			y: 1.1,
			orientation: 'h'
		},
		yaxis: {
			title: unitLabel,
			gridcolor: '#ddd'
		},

		xaxis: {
			range: [start, end], // Specifies the start and end points of visible part of graph(unshaded region on slider);
			rangeslider: {
				thickness: 0.1
			},
			showgrid: true,
			gridcolor: '#ddd'
		},
		margin: {
			t: 10,
			b: 10
		}
	};

	// Assign all the parameters required to create the Plotly object (data, layout, config) to the variable props, returned by mapStateToProps
	// The Plotly toolbar is displayed if displayModeBar is set to true
	const props: any = {
		data: datasets,
		layout,
		config: {
			displayModeBar: true,
			responsive: true,
			locales: Locales // makes locales available for use
		}
	};
	props.config.locale = state.admin.defaultLanguage;
	return props;
}

export default connect(mapStateToProps)(Plot);
