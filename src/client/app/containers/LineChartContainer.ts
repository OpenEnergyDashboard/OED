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
import translate from '../utils/translate';

function mapStateToProps(state: State) {
	const timeInterval = state.graph.timeInterval;
	const unitID = state.graph.selectedUnit;
	const datasets: any[] = [];
	// The unit label depends on the unit which is in selectUnit state.
	const graphingUnit = state.graph.selectedUnit;
	// The current selected rate
	const currentSelectedRate = state.graph.lineGraphRate;
	let unitLabel: string = '';
	let needsRateScaling = false;
	// variables to determine the slider min and max
	let minTimestamp: number | undefined;
	let maxTimestamp: number | undefined;
	// If graphingUnit is -99 then none selected and nothing to graph so label is empty.
	// This will probably happen when the page is first loaded.
	if (graphingUnit !== -99) {
		const selectUnitState = state.units.units[state.graph.selectedUnit];
		if (selectUnitState !== undefined) {
			// Quantity and flow units have different unit labels.
			// Look up the type of unit if it is for quantity/flow/raw and decide what to do.
			// Bar graphics are always quantities.
			if (selectUnitState.identifier === 'kWh' || selectUnitState.identifier === 'kW') {
				// This is a special case. kWh has a general meaning and the flow equivalent is kW.
				// A kW is a Joule/sec. While it is possible to convert to another rate, OED is not
				// going to allow that. If you want that then the site should add Joule as a unit.
				// Note the rate is per second which is unusual and not the normal OED of per hour.
				// Thus, OED will show kW and not allow other rates. To make it consistent, kWh cannot
				// be shown in another rate. Thus, there is no need to scale.
				// TODO This isn't a general solution. For example, Wh or W would not be fixed.
				// The y-axis label is the kW.
				unitLabel = 'kW';
			} else if (selectUnitState.unitRepresent == UnitRepresentType.raw) {
				// A raw unit just uses the identifier.
				// The y-axis label is the same as the identifier.
				unitLabel = selectUnitState.identifier;
			} else if (selectUnitState.unitRepresent === UnitRepresentType.quantity || selectUnitState.unitRepresent === UnitRepresentType.flow) {
				// If it is a quantity or flow unit then it is a rate so indicate by dividing by the time interval
				// which is always one hour for OED.
				unitLabel = selectUnitState.identifier + ' / ' + translate(currentSelectedRate.label);
				// Rate scaling is needed
				needsRateScaling = true;
			}
		}
		// If the current rate is per hour (default rate) then don't bother with the extra calculations since we'd be multiplying by 1
		needsRateScaling = needsRateScaling && (currentSelectedRate.rate != 1);
	}

	// Add all valid data from existing meters to the line plot
	for (const meterID of state.graph.selectedMeters) {
		const byMeterID = state.readings.line.byMeterID[meterID];
		if (byMeterID !== undefined) {
			const meterArea = state.meters.byMeterID[meterID].area;
			// we either don't care about area, or we do in which case there needs to be a nonzero area
			if (!state.graph.normalizeByArea || meterArea > 0) {
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
					const hoverText: string[] = [];
					const readings = _.values(readingsData.readings);
					// Check if reading needs scaling outside of the loop so only one check is needed
					// Results in more code but SLIGHTLY better efficiency :D
					if (needsRateScaling) {
						const rate = currentSelectedRate.rate;
						readings.forEach(reading => {
							// As usual, we want to interpret the readings in UTC. We lose the timezone as this as the start/endTimestamp
							// are equivalent to Unix timestamp in milliseconds.
							const st = moment.utc(reading.startTimestamp);
							// Time reading is in the middle of the start and end timestamp
							const timeReading = st.add(moment.utc(reading.endTimestamp).diff(st) / 2);
							xData.push(timeReading.format('YYYY-MM-DD HH:mm:ss'));
							yData.push(reading.reading * rate);
							hoverText.push(`<b> ${timeReading.format('ddd, ll LTS')} </b> <br> ${label}: ${(reading.reading * rate).toPrecision(6)} ${unitLabel}`);
						});
					}
					else {
						readings.forEach(reading => {
							// As usual, we want to interpret the readings in UTC. We lose the timezone as this as the start/endTimestamp
							// are equivalent to Unix timestamp in milliseconds.
							const st = moment.utc(reading.startTimestamp);
							// Time reading is in the middle of the start and end timestamp
							const timeReading = st.add(moment.utc(reading.endTimestamp).diff(st) / 2);
							xData.push(timeReading.format('YYYY-MM-DD HH:mm:ss'));
							let readingValue = reading.reading;
							if(state.graph.normalizeByArea) {
								readingValue /= meterArea;
							}
							yData.push(readingValue);
							hoverText.push(`<b> ${timeReading.format('ddd, ll LTS')} </b> <br> ${label}: ${readingValue.toPrecision(6)} ${unitLabel}`);
						});
					}

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
		if (byGroupID !== undefined) {
			let groupArea = state.groups.byGroupID[groupID].area;
			// TODO Consider changing group area to always be defined
			if(groupArea === undefined) {
				groupArea = 0;
			}
			if (!state.graph.normalizeByArea || groupArea > 0) {
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
					// Check if reading needs scaling outside of the loop so only one check is needed
					// Results in more code but SLIGHTLY better efficiency :D
					if (needsRateScaling) {
						const rate = currentSelectedRate.rate;
						readings.forEach(reading => {
							// As usual, we want to interpret the readings in UTC. We lose the timezone as this as the start/endTimestamp
							// are equivalent to Unix timestamp in milliseconds.
							const st = moment.utc(reading.startTimestamp);
							// Time reading is in the middle of the start and end timestamp
							const timeReading = st.add(moment.utc(reading.endTimestamp).diff(st) / 2);
							xData.push(timeReading.utc().format('YYYY-MM-DD HH:mm:ss'));
							yData.push(reading.reading * rate);
							hoverText.push(`<b> ${timeReading.format('ddd, ll LTS')} </b> <br> ${label}: ${(reading.reading * rate).toPrecision(6)} ${unitLabel}`);
						});
					}
					else {
						readings.forEach(reading => {
							// As usual, we want to interpret the readings in UTC. We lose the timezone as this as the start/endTimestamp
							// are equivalent to Unix timestamp in milliseconds.
							const st = moment.utc(reading.startTimestamp);
							// Time reading is in the middle of the start and end timestamp
							const timeReading = st.add(moment.utc(reading.endTimestamp).diff(st) / 2);
							xData.push(timeReading.utc().format('YYYY-MM-DD HH:mm:ss'));
							let readingValue = reading.reading;
							if(state.graph.normalizeByArea) {
								// TODO: Consider changing group area to always be defined
								if(groupArea === undefined) {
									groupArea = 0;
								}
								readingValue /= groupArea;
							}
							yData.push(readingValue);
							hoverText.push(`<b> ${timeReading.format('ddd, ll LTS')} </b> <br> ${label}: ${readingValue.toPrecision(6)} ${unitLabel}`);
						});
					}

					// get the min and max timestamp of the meter, and compare it to the global values
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
