/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import * as moment from 'moment';
import { connect } from 'react-redux';
import getGraphColor from '../utils/getGraphColor';
import { State } from '../types/redux/state';
import Plot from 'react-plotly.js';
import Locales from '../types/locales';
import { DataType } from '../types/Datasources';
import { UnitRepresentType } from '../types/redux/units';

/* Passes the current redux state of the barchart, and turns it into props for the React
*  component, which is what will be visible on the page. Makes it possible to access
*  your reducer state objects from within your React components.
*
*  Returns the props object. */
function mapStateToProps(state: State) {
	const timeInterval = state.graph.timeInterval;
	const barDuration = state.graph.barDuration;
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
			// Look up the type of unit if it is for quantity/flow (should not be raw) and decide what to do.
			// Bar graphics are always quantities.
			if (selectUnitState.unitRepresent === UnitRepresentType.quantity) {
				// If it is a quantity unit then that is the unit you are graphing.
				unitLabel  = selectUnitState.identifier;
			} else if (selectUnitState.unitRepresent === UnitRepresentType.flow) {
				// If it is a flow meter then you need to multiply by time to get the quantity unit.
				// The quantity/time for flow has varying time so label by multiplying by time.
				// To make sure it is clear, also indicate it is a quantity.
				// Note this should not be used for raw data.
				// It might not be usual to take a flow and make it into a quantity so this label is a little different to
				// catch people's attention. If sites/users don't like OED doing this then we can eliminate flow for these types
				// of graphics as we are doing for rate.
				unitLabel = selectUnitState.identifier + ' * time ≡ quantity';
			}
		}
	}

	// Add all valid data from existing meters to the bar chart
	for (const meterID of state.graph.selectedMeters) {
		const byMeterID = state.readings.bar.byMeterID[meterID];
		if (byMeterID !== undefined && byMeterID[timeInterval.toString()] !== undefined &&
			byMeterID[timeInterval.toString()][barDuration.toISOString()] !== undefined) {
			const readingsData = byMeterID[timeInterval.toString()][barDuration.toISOString()][unitID];
			if (readingsData !== undefined && !readingsData.isFetching) {
				const label = state.meters.byMeterID[meterID].name;
				const colorID = meterID;
				if (readingsData.readings === undefined) {
					throw new Error('Unacceptable condition: readingsData.readings is undefined.');
				}

				// Create two arrays for the x and y values. Fill the array with the data.
				const xData: string[] = [];
				const yData: number[] = [];
				const hoverText: string[] = [];
				const readings = _.orderBy(readingsData.readings, ['startTimestamp'], ['asc']);
				readings.forEach(barReading => {
					// subtracting one extra day caused by day ending at midnight of the next day
					const timeReading: string =
						`${moment(barReading.startTimestamp).utc().format('ll')} - ${moment(barReading.endTimestamp).subtract(1, 'days').utc().format('ll')}`;
					xData.push(timeReading);
					yData.push(barReading.reading);
					hoverText.push(`<b> ${timeReading} </b> <br> ${label}: ${barReading.reading.toPrecision(6)} ${unitLabel}`);
				});
				// This variable contains all the elements (x and y values, bar type, etc.) assigned to the data parameter of the Plotly object
				datasets.push({
					name: label,
					x: xData,
					y: yData,
					text: hoverText,
					hoverinfo: 'text',
					type: 'bar',
					marker: {color: getGraphColor(colorID, DataType.Meter)}
				});
			}
		}
	}

	for (const groupID of state.graph.selectedGroups) {
		const byGroupID = state.readings.bar.byGroupID[groupID];
		if (byGroupID !== undefined && byGroupID[timeInterval.toString()] !== undefined &&
			byGroupID[timeInterval.toString()][barDuration.toISOString()] !== undefined) {
			const readingsData = byGroupID[timeInterval.toString()][barDuration.toISOString()][unitID];
			if (readingsData !== undefined && !readingsData.isFetching) {
				const label = state.groups.byGroupID[groupID].name;
				const colorID = groupID;
				if (readingsData.readings === undefined) {
					throw new Error('Unacceptable condition: readingsData.readings is undefined.');
				}

				// Create two arrays for the x and y values. Fill the array with the data.
				const xData: string[] = [];
				const yData: number[] = [];
				const hoverText: string[] = [];
				const readings = _.orderBy(readingsData.readings, ['startTimestamp'], ['asc']);
				readings.forEach(barReading => {
					// subtracting one extra day caused by day ending at midnight of the next day
					const timeReading: string =
						`${moment(barReading.startTimestamp).utc().format('ll')} - ${moment(barReading.endTimestamp).subtract(1, 'days').utc().format('ll')}`;
					xData.push(timeReading);
					yData.push(barReading.reading);
					hoverText.push(`<b> ${timeReading} </b> <br> ${label}: ${barReading.reading.toPrecision(6)} ${unitLabel}`);
				});

				// This variable contains all the elements (x and y values, bar chart, etc.) assigned to the data parameter of the Plotly object
				datasets.push({
					name: label,
					x: xData,
					y: yData,
					text: hoverText,
					hoverinfo: 'text',
					type: 'bar',
					marker: {color: getGraphColor(colorID, DataType.Group)}
				});
			}
		}
	}

	// Customize the layout of the plot
	const layout: any = {
		barmode: (state.graph.barStacking ? 'stack' : 'group'),
		bargap: 0.2, // Gap between different times of readings
		bargroupgap: 0.1, // Gap between different meter's readings under the same timestamp
		autosize: true,
		height: 700,	// Height is set to 700 for now, but we do need to scale in the future (issue #466)
		showlegend: true,
		legend: {
			x: 0,
			y: 1.1,
			orientation: 'h'
		},
		yaxis: {
			title: unitLabel,
			showgrid: true,
			gridcolor: '#ddd'
		},
		xaxis: {
			showgrid: true,
			gridcolor: '#ddd',
			tickfont: {
				size: 10
			},
			tickangle: -45,
			autotick: true,
			nticks: 10,
			automargin: true
		},
		margin: {
			t: 0,
			b: 120,
			l: 120
		}
	};

	// Assign all the parameters required to create the Plotly object (data, layout, config) to the variable props, returned by mapStateToProps
	// The Plotly toolbar is displayed if displayModeBar is set to true (not for bar charts)
	const props: any = {
		data: datasets,
		layout,
		config: {
			displayModeBar: false,
			responsive: true,
			locales: Locales // makes locales available for use
		}
	};
	props.config.locale = state.admin.defaultLanguage;
	return props;
}

export default connect(mapStateToProps)(Plot);
