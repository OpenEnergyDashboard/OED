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
// Make your own radarUnitLabel later. Lets see if this works first
import { barUnitLabel } from '../utils/graphics';
import { AreaUnitType, getAreaUnitConversion } from '../utils/getAreaUnitConversion';

function mapStateToProps(state: State) {
	const timeInterval = state.graph.timeInterval;
	const unitID = state.graph.selectedUnit;
	const datasets: any[] = [];
	const barDuration = state.graph.barDuration;
	//For largest and smallest usage in reading.reading.
	let minR: number | undefined;
	let maxR: number | undefined;
	// The unit label depends on the unit which is in selectUnit state.
	const graphingUnit = state.graph.selectedUnit;
	let unitLabel = '';
	// If graphingUnit is -99 then none selected and nothing to graph so label is empty.
	// This will probably happen when the page is first loaded.
	if (graphingUnit !== -99) {
		const selectUnitState = state.units.units[state.graph.selectedUnit];
		if (selectUnitState !== undefined) {
			// Determine the r-axis label.
			unitLabel = barUnitLabel(selectUnitState, state.graph.areaNormalization, state.graph.selectedAreaUnit);
		}
	}

	// Add all valid data from existing meters to the radar plot
	for (const meterID of state.graph.selectedMeters) {
		const byMeterID = state.readings.bar.byMeterID[meterID];
		if (byMeterID !== undefined && byMeterID[timeInterval.toString()] !== undefined &&
			byMeterID[timeInterval.toString()][barDuration.toISOString()] !== undefined) {
			let meterArea = state.meters.byMeterID[meterID].area;
			// We either don't care about area, or we do in which case there needs to be a nonzero area.
			if (!state.graph.areaNormalization || (meterArea > 0 && state.meters.byMeterID[meterID].areaUnit != AreaUnitType.none)) {
				// Convert the meter area into the proper unit if normalizing by area or use 1 if not so won't change reading values.
				if (state.graph.areaNormalization) {
					// convert the meter area into the proper unit, if needed
					meterArea *= getAreaUnitConversion(state.meters.byMeterID[meterID].areaUnit, state.graph.selectedAreaUnit);
				}
				const readingsData = byMeterID[timeInterval.toString()][barDuration.toISOString()][unitID];
				if (readingsData !== undefined && !readingsData.isFetching) {
					const label = state.meters.byMeterID[meterID].identifier;
					const colorID = meterID;
					if (readingsData.readings === undefined) {
						throw new Error('Unacceptable condition: readingsData.readings is undefined.');
					}

					// Create two arrays for the x and y values. Fill the array with the data from the line readings
					const thetaData: string[] = [];
					const rData: number[] = [];
					const hoverText: string[] = [];
					const readings = _.values(readingsData.readings);
					// The scaling is the factor to change the reading by. It divides by the area while will be 1 if no scaling by area.
					readings.forEach(reading => {
						// As usual, we want to interpret the readings in UTC. We lose the timezone as this as the start/endTimestamp
						// are equivalent to Unix timestamp in milliseconds.
						const st = moment.utc(reading.startTimestamp);
						// Time reading is in the middle of the start and end timestamp
						const timeReading = st.add(moment.utc(reading.endTimestamp).diff(st) / 2);
						// thetaData.push(timeReading.format('YYYY-MM-DD HH:mm:ss'));
						thetaData.push(timeReading.format('ddd, ll LTS'));
						let readingValue = reading.reading;
						if (state.graph.areaNormalization) {
							readingValue /= meterArea;
						}
						rData.push(readingValue);
						// only display a range of dates for the hover text if there is more than one day in the range
						let timeRange: string = `${moment.utc(reading.startTimestamp).format('ll')}`;
						if (barDuration.asDays() != 1) {
							// subtracting one extra day caused by day ending at midnight of the next day.
							// Going from DB unit timestamp that is UTC so force UTC with moment, as usual.
							timeRange += ` - ${moment.utc(reading.endTimestamp).subtract(1, 'days').format('ll')}`;
						}
						hoverText.push(`<b> ${timeRange} </b> <br> ${label}: ${readingValue.toPrecision(6)} ${unitLabel}`);
					});

					//Find the largest and smallest usage in rData.
					if (minR == undefined || minR > Math.min(...rData)) {
						minR = Math.min(...rData);
					}
					if (maxR == undefined || maxR < Math.max(...rData)) {
						maxR = Math.max(...rData);
					}

					// This variable contains all the elements (x and y values, line type, etc.) assigned to the data parameter of the Plotly object
					datasets.push({
						name: label,
						theta: thetaData,
						r: rData,
						text: hoverText,
						hoverinfo: 'text',
						type: 'scatterpolar',
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

	//THIS DOES NOT WORK YET AND IT'S STILL USING RADAR READINGS I MOVED TO BAR READINGS
	// for (const groupID of state.graph.selectedGroups) {
	// 	const byGroupID = state.readings.line.byGroupID[groupID];
	// 	if (byGroupID !== undefined && byGroupID[timeInterval.toString()] !== undefined) {
	// 		let groupArea = state.groups.byGroupID[groupID].area;
	// 		if (!state.graph.areaNormalization || (groupArea > 0 && state.groups.byGroupID[groupID].areaUnit != AreaUnitType.none)) {
	// 			if (state.graph.areaNormalization) {
	// 				// convert the meter area into the proper unit, if needed
	// 				groupArea *= getAreaUnitConversion(state.groups.byGroupID[groupID].areaUnit, state.graph.selectedAreaUnit);
	// 			}
	// 			const readingsData = byGroupID[timeInterval.toString()][unitID];
	// 			if (readingsData !== undefined && !readingsData.isFetching) {
	// 				const label = state.groups.byGroupID[groupID].name;
	// 				const colorID = groupID;
	// 				if (readingsData.readings === undefined) {
	// 					throw new Error('Unacceptable condition: readingsData.readings is undefined.');
	// 				}

	// 				// Create two arrays for the x and y values. Fill the array with the data from the line readings
	// 				const thetaData: string[] = [];
	// 				const rData: number[] = [];
	// 				const hoverText: string[] = [];
	// 				const readings = _.values(readingsData.readings);
	// 				// Check if reading needs scaling outside of the loop so only one check is needed
	// 				// Results in more code but SLIGHTLY better efficiency :D
	// 				if (needsRateScaling) {
	// 					const rate = currentSelectedRate.rate;
	// 					readings.forEach(reading => {
	// 						// As usual, we want to interpret the readings in UTC. We lose the timezone as this as the start/endTimestamp
	// 						// are equivalent to Unix timestamp in milliseconds.
	// 						const st = moment.utc(reading.startTimestamp);
	// 						// Time reading is in the middle of the start and end timestamp
	// 						const timeReading = st.add(moment.utc(reading.endTimestamp).diff(st) / 2);
	// 						// thetaData.push(timeReading.utc().format('YYYY-MM-DD HH:mm:ss'));
	// 						thetaData.push(timeReading.utc().format('ddd, ll LTS'));
	// 						rData.push(reading.reading * rate);
	// 						hoverText.push(`<b> ${timeReading.format('ddd, ll LTS')} </b> <br> ${label}: ${(reading.reading * rate).toPrecision(6)} ${unitLabel}`);
	// 					});
	// 				}
	// 				else {
	// 					readings.forEach(reading => {
	// 						// As usual, we want to interpret the readings in UTC. We lose the timezone as this as the start/endTimestamp
	// 						// are equivalent to Unix timestamp in milliseconds.
	// 						const st = moment.utc(reading.startTimestamp);
	// 						// Time reading is in the middle of the start and end timestamp
	// 						const timeReading = st.add(moment.utc(reading.endTimestamp).diff(st) / 2);
	// 						// thetaData.push(timeReading.utc().format('YYYY-MM-DD HH:mm:ss'));
	// 						thetaData.push(timeReading.utc().format('ddd, ll LTS'));
	// 						let readingValue = reading.reading;
	// 						if (state.graph.areaNormalization) {
	// 							readingValue /= groupArea;
	// 						}
	// 						rData.push(readingValue);
	// 						hoverText.push(`<b> ${timeReading.format('ddd, ll LTS')} </b> <br> ${label}: ${readingValue.toPrecision(6)} ${unitLabel}`);
	// 					});
	// 				}

	// 				//Find the largest and smallest usage in rData.
	// 				if (minR == undefined || minR > Math.min(...rData)) {
	// 					minR = Math.min(...rData);
	// 				}
	// 				if (maxR == undefined || maxR < Math.max(...rData)) {
	// 					maxR = Math.max(...rData);
	// 				}

	// 				// This variable contains all the elements (x and y values, line type, etc.) assigned to the data parameter of the Plotly object
	// 				datasets.push({
	// 					name: label,
	// 					x: thetaData,
	// 					y: rData,
	// 					text: hoverText,
	// 					hoverinfo: 'text',
	// 					type: 'scatterpolar',
	// 					mode: 'lines',
	// 					line: {
	// 						shape: 'spline',
	// 						width: 2,
	// 						color: getGraphColor(colorID, DataType.Group)
	// 					}
	// 				});
	// 			}
	// 		}
	// 	}
	// }

	// No range if minR or maxR is undefined.
	if (minR == undefined || maxR == undefined) {
		minR = 0;
		maxR = 0;
	}

	let layout: any;
	// Customize the layout of the plot
	// See https://community.plotly.com/t/replacing-an-empty-graph-with-a-message/31497 for showing text not plot.
	if (datasets.length === 0) {
		// There is no data so tell user.
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
		// Data available so plot.
		layout = {
			autosize: true,
			showlegend: true,
			height: 700,
			legend: {
				x: 0,
				y: 1.1,
				orientation: 'h'
			},

			polar: {
				radialaxis: {
					title: unitLabel,
					// Specifies the start and end points of the usage.
					range: [minR, maxR],
					showgrid: true,
					gridcolor: '#ddd'
				}
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
