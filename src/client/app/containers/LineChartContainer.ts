/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import * as moment from 'moment';
import { connect } from 'react-redux';
import getGraphColor from '../utils/getGraphColor';
import { State } from '../types/redux/state';
import translate from '../utils/translate';
import Plot from 'react-plotly.js';
import Locales from '../types/locales';
import { DataType } from '../types/Datasources';
import { lineUnitLabel } from '../utils/graphics';
import { AreaUnitType, getAreaUnitConversion } from '../utils/getAreaUnitConversion';

function mapStateToProps(state: State) {
	const timeInterval = state.graph.timeInterval;
	const unitID = state.graph.selectedUnit;
	const datasets: any[] = [];
	// The unit label depends on the unit which is in selectUnit state.
	const graphingUnit = state.graph.selectedUnit;
	// The current selected rate
	const currentSelectedRate = state.graph.lineGraphRate;
	let unitLabel = '';
	let needsRateScaling = false;
	// variables to determine the slider min and max
	let minTimestamp: number | undefined;
	let maxTimestamp: number | undefined;
	// If graphingUnit is -99 then none selected and nothing to graph so label is empty.
	// This will probably happen when the page is first loaded.
	if (graphingUnit !== -99) {
		const selectUnitState = state.units.units[state.graph.selectedUnit];
		if (selectUnitState !== undefined) {
			// Determine the y-axis label and if the rate needs to be scaled.
			const returned = lineUnitLabel(selectUnitState, currentSelectedRate, state.graph.areaNormalization, state.graph.selectedAreaUnit);
			unitLabel = returned.unitLabel
			needsRateScaling = returned.needsRateScaling;
		}
	}
	// The rate will be 1 if it is per hour (since state readings are per hour) or no rate scaling so no change.
	const rateScaling = needsRateScaling ? currentSelectedRate.rate : 1;

	// Add all valid data from existing meters to the line plot
	for (const meterID of state.graph.selectedMeters) {
		const byMeterID = state.readings.line.byMeterID[meterID];
		// Make sure have the meter data. If you already have the meter, unselect, change
		// the timeInterval via another meter and then reselect then this new timeInterval
		// may not yet be in state so verify with the second condition on the if.
		// Note the second part may not be used based on next checks but do here since simple.
		if (byMeterID !== undefined && byMeterID[timeInterval.toString()] !== undefined) {
			const meterArea = state.meters.byMeterID[meterID].area;
			// We either don't care about area, or we do in which case there needs to be a nonzero area.
			if (!state.graph.areaNormalization || (meterArea > 0 && state.meters.byMeterID[meterID].areaUnit != AreaUnitType.none)) {
				// Convert the meter area into the proper unit if normalizing by area or use 1 if not so won't change reading values.
				const areaScaling = state.graph.areaNormalization ?
					meterArea * getAreaUnitConversion(state.meters.byMeterID[meterID].areaUnit, state.graph.selectedAreaUnit) : 1;
				// Divide areaScaling into the rate so have complete scaling factor for readings.
				const scaling = rateScaling / areaScaling;
				const readingsData = byMeterID[timeInterval.toString()][unitID];
				if (readingsData !== undefined && !readingsData.isFetching) {
					const label = state.meters.byMeterID[meterID].identifier;
					const colorID = meterID;
					if (readingsData.readings === undefined) {
						throw new Error('Unacceptable condition: readingsData.readings is undefined.');
					}

					// Create two arrays for the x and y values. Fill the array with the data from the line readings
					const xData: string[] = [];
					const yData: number[] = [];
					// Create two arrays to store the min and max values of y-axis data points
					const yMinData: number[] = [];
					const yMaxData: number[] = [];
					const hoverText: string[] = [];
					const readings = _.values(readingsData.readings);
					// The scaling is the factor to change the reading by. It divides by the area while will be 1 if no scaling by area.
					readings.forEach(reading => {
						// As usual, we want to interpret the readings in UTC. We lose the timezone as this as the start/endTimestamp
						// are equivalent to Unix timestamp in milliseconds.
						const st = moment.utc(reading.startTimestamp);
						// Time reading is in the middle of the start and end timestamp
						const timeReading = st.add(moment.utc(reading.endTimestamp).diff(st) / 2);
						xData.push(timeReading.format('YYYY-MM-DD HH:mm:ss'));
						const readingValue = reading.reading * scaling;
						yData.push(readingValue);
						// All hover have the date, meter name and value.
						const hoverStart = `<b> ${timeReading.format('ddd, ll LTS')} </b> <br> ${label}: ${readingValue.toPrecision(6)} ${unitLabel}`;
						if (state.graph.showMinMax && reading.max != null) {
							// We want to show min/max. Note if the data is raw for this meter then all the min/max values are null.
							// In this case we still push the min/max but plotly will not show them. This is a little extra work
							// but makes the code cleaner.
							const minValue = reading.min * scaling;
							yMinData.push(minValue);
							const maxValue = reading.max * scaling;
							yMaxData.push(maxValue);
							hoverText.push(`${hoverStart} <br> ${translate('min')}: ${minValue.toPrecision(6)} <br> ${translate('max')}: ${maxValue.toPrecision(6)}`);
						} else {
							hoverText.push(hoverStart);
						}
					});

					/*
					get the min and max timestamp of the meter, and compare it to the global values
					TODO: If we know the interval and frequency of meter data, these calculations should be able to be simplified
					*/
					if (readings.length > 0) {
						if (minTimestamp == undefined || readings[0]['startTimestamp'] < minTimestamp) {
							minTimestamp = readings[0]['startTimestamp'];
						}
						if (maxTimestamp == undefined || readings[readings.length - 1]['endTimestamp'] >= maxTimestamp) {
							// Need to add one extra reading interval to avoid range truncation. The max bound seems to be treated as non-inclusive
							maxTimestamp = readings[readings.length - 1]['endTimestamp'] + (readings[0]['endTimestamp'] - readings[0]['startTimestamp']);
						}
					}

					// This variable contains all the elements (x and y values, line type, etc.) assigned to the data parameter of the Plotly object
					datasets.push({
						name: label,
						x: xData,
						y: yData,
						// only show error bars if enabled and there is data
						error_y: state.graph.showMinMax && yMaxData.length > 0 ? {
							type: 'data',
							symmetric: false,
							array: yMaxData.map((maxValue, index) => (maxValue - yData[index])),
							arrayminus: yData.map((value, index) => (value - yMinData[index]))
						} : undefined,
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
	}

	// TODO The meters and groups code is very similar and maybe it should be refactored out to create a function to do
	// both. This would mean future changes would automatically happen to both.
	// Add all valid data from existing groups to the line plot
	for (const groupID of state.graph.selectedGroups) {
		const byGroupID = state.readings.line.byGroupID[groupID];
		// Make sure have the group data. If you already have the group, unselect, change
		// the timeInterval via another meter and then reselect then this new timeInterval
		// may not yet be in state so verify with the second condition on the if.
		// Note the second part may not be used based on next checks but do here since simple.
		if (byGroupID !== undefined && byGroupID[timeInterval.toString()] !== undefined) {
			const groupArea = state.groups.byGroupID[groupID].area;
			// We either don't care about area, or we do in which case there needs to be a nonzero area.
			if (!state.graph.areaNormalization || (groupArea > 0 && state.groups.byGroupID[groupID].areaUnit != AreaUnitType.none)) {
				// Convert the group area into the proper unit if normalizing by area or use 1 if not so won't change reading values.
				const areaScaling = state.graph.areaNormalization ?
					groupArea * getAreaUnitConversion(state.groups.byGroupID[groupID].areaUnit, state.graph.selectedAreaUnit) : 1;
				// Divide areaScaling into the rate so have complete scaling factor for readings.
				const scaling = rateScaling / areaScaling;
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
						// As usual, we want to interpret the readings in UTC. We lose the timezone as this as the start/endTimestamp
						// are equivalent to Unix timestamp in milliseconds.
						const st = moment.utc(reading.startTimestamp);
						// Time reading is in the middle of the start and end timestamp
						const timeReading = st.add(moment.utc(reading.endTimestamp).diff(st) / 2);
						xData.push(timeReading.utc().format('YYYY-MM-DD HH:mm:ss'));
						const readingValue = reading.reading * scaling;
						yData.push(readingValue);
						hoverText.push(`<b> ${timeReading.format('ddd, ll LTS')} </b> <br> ${label}: ${readingValue.toPrecision(6)} ${unitLabel}`);
					});

					// get the min and max timestamp of the group, and compare it to the global values
					if (readings.length > 0) {
						if (minTimestamp == undefined || readings[0]['startTimestamp'] < minTimestamp) {
							minTimestamp = readings[0]['startTimestamp'];
						}
						if (maxTimestamp == undefined || readings[readings.length - 1]['endTimestamp'] >= maxTimestamp) {
							// Need to add one extra reading interval to avoid range truncation. The max bound seems to be treated as non-inclusive
							maxTimestamp = readings[readings.length - 1]['endTimestamp'] + (readings[0]['endTimestamp'] - readings[0]['startTimestamp']);
						}
					}

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
	}

	// set the bounds for the slider
	if (minTimestamp == undefined) {
		minTimestamp = 0;
		maxTimestamp = 0;
	}
	const root: any = document.getElementById('root');
	root.setAttribute('min-timestamp', minTimestamp);
	root.setAttribute('max-timestamp', maxTimestamp);

	// Use the min/max time found for the readings (and shifted as desired) as the
	// x-axis range for the graph.
	// Avoid pesky shifting timezones with utc.
	const start = moment.utc(minTimestamp).toISOString();
	const end = moment.utc(maxTimestamp).toISOString();

	let layout: any;
	// Customize the layout of the plot
	// See https://community.plotly.com/t/replacing-an-empty-graph-with-a-message/31497 for showing text not plot.
	if (datasets.length === 0) {
		// There is not data so tell user.
		layout = {
			'xaxis': {
				'visible': false
			},
			'yaxis': {
				'visible': false
			},
			'annotations': [
				{
					'text': `${translate('select.meter.group')}`,
					'xref': 'paper',
					'yref': 'paper',
					'showarrow': false,
					'font': {
						'size': 28
					}
				}
			]
		}

	} else {
		// This normal so plot.
		layout = {
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
				range: [start, end], // Specifies the start and end points of visible part of graph
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
	}

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
	props.config.locale = state.options.selectedLanguage;
	return props;
}

export default connect(mapStateToProps)(Plot);
